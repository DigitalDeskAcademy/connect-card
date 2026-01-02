"use server";

/**
 * Update Card Extraction
 *
 * Updates a PENDING connect card with extracted data from Claude Vision.
 * This is the second step in async processing - called after extraction completes.
 *
 * Security:
 * - Supports Better Auth session (admin flow) OR scan session cookie (phone flow)
 * - Rate limited via Arcjet (30/min - extraction is the bottleneck)
 * - Verifies card belongs to user's organization
 * - Card must be in PENDING status
 *
 * @param slug - Organization slug for multi-tenant context
 * @param cardId - ID of the pending card to update
 * @param extractedData - Data extracted by Claude Vision
 * @returns ApiResponse with success/error status
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { extractedDataSchema, ExtractedData } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { validateConnectCardData } from "@/lib/validation/connect-card-quality";
import { formatPhoneNumber } from "@/lib/utils";
import {
  toValidationIssuesJson,
  validateJsonSize,
} from "@/lib/prisma/json-types";
import { validateScanSession } from "@/lib/auth/scan-session";
import {
  normalizeVisitStatus,
  normalizeInterests,
  normalizeKeywords,
} from "@/lib/utils/connect-card-normalization";
import { z } from "zod";

// Validation schema for extraction update
const updateCardExtractionSchema = z.object({
  cardId: z.string().min(1, "Card ID is required"),
  extractedData: extractedDataSchema,
});

export type UpdateCardExtractionInput = z.infer<
  typeof updateCardExtractionSchema
>;

// Rate limit: 30 extractions per minute (Claude Vision is the bottleneck)
const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 30,
  })
);

export async function updateCardExtraction(
  slug: string,
  cardId: string,
  extractedData: ExtractedData
): Promise<ApiResponse<{ id: string }>> {
  // 1. Authentication - supports Better Auth session OR scan session cookie
  let userId: string;
  let organizationId: string;

  // Check for scan session first (phone QR code flow)
  const scanSession = await validateScanSession();

  if (scanSession && scanSession.slug === slug) {
    // Phone scanning via QR code - already validated via token
    userId = scanSession.userId;
    organizationId = scanSession.organizationId;
  } else {
    // Standard dashboard access (logged-in user)
    const { session, organization } = await requireDashboardAccess(slug);
    userId = session.user.id;
    organizationId = organization.id;
  }

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${userId}_${organizationId}_update_card_extraction`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message:
          "Rate limit exceeded. Please wait before processing more cards.",
      };
    }
    return {
      status: "error",
      message: "Request blocked by security policy",
    };
  }

  // 3. Validation
  const validation = updateCardExtractionSchema.safeParse({
    cardId,
    extractedData,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid data: " + validation.error.issues[0]?.message,
    };
  }

  // 3b. JSON Size Validation (prevents storage exhaustion attacks)
  const sizeCheck = validateJsonSize(validation.data.extractedData);
  if (!sizeCheck.valid) {
    return {
      status: "error",
      message: "Extracted data exceeds maximum size limit",
    };
  }
  // Log warning for large payloads (monitoring)
  if (sizeCheck.warning) {
    console.warn(
      `[MONITORING] Large extractedData payload: ${sizeCheck.bytes} bytes`,
      { organizationId, userId, cardId }
    );
  }

  // 4. Verify card exists and belongs to organization
  const existingCard = await prisma.connectCard.findFirst({
    where: {
      id: cardId,
      organizationId, // Multi-tenant isolation
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existingCard) {
    return {
      status: "error",
      message: "Card not found or access denied",
    };
  }

  // 5. Verify card is in PENDING status (hasn't been processed yet)
  if (existingCard.status !== "PENDING") {
    return {
      status: "error",
      message: `Card has already been processed (status: ${existingCard.status})`,
    };
  }

  // 6. Data Quality Validation
  const validationResult = validateConnectCardData(
    validation.data.extractedData
  );

  try {
    // 7. Update card with extracted data
    const updatedCard = await prisma.connectCard.update({
      where: { id: cardId },
      data: {
        extractedData: validation.data.extractedData,
        // Map extracted fields to database columns with normalization
        name: validation.data.extractedData.name,
        email: validation.data.extractedData.email,
        phone: formatPhoneNumber(validation.data.extractedData.phone),
        address: validation.data.extractedData.address,
        prayerRequest: validation.data.extractedData.prayer_request,
        // Normalize visit status
        visitType: normalizeVisitStatus(
          validation.data.extractedData.visit_status || null
        ),
        // Normalize interests
        interests: normalizeInterests(validation.data.extractedData.interests),
        // Normalize campaign keywords
        detectedKeywords: normalizeKeywords(
          validation.data.extractedData.keywords
        ),
        // Update status to EXTRACTED
        status: "EXTRACTED",
        // Store validation issues for review UI
        validationIssues: toValidationIssuesJson(validationResult.issues),
      },
      select: {
        id: true,
      },
    });

    return {
      status: "success",
      message: "Card extraction complete - ready for review",
      data: { id: updatedCard.id },
    };
  } catch (error) {
    console.error("[updateCardExtraction] Error:", error);
    return {
      status: "error",
      message: "Failed to update card with extracted data",
    };
  }
}
