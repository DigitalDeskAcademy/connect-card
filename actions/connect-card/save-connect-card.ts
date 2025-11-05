"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { connectCardSchema, ConnectCardSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { validateConnectCardData } from "@/lib/validation/connect-card-quality";
import { formatPhoneNumber } from "@/lib/utils";
import {
  getOrCreateActiveBatch,
  incrementBatchCardCount,
} from "@/lib/data/connect-card-batch";
import { calculateImageHash } from "@/lib/utils/image-hash";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

/**
 * Save Connect Card
 *
 * Saves extracted connect card data to database after Claude Vision processing.
 *
 * Security:
 * - Requires dashboard access (church admin or staff)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (5 saves per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Connect card image key and extracted data
 * @param locationId - Optional location ID to override user's default location
 * @returns ApiResponse with success/error status and saved record ID
 */
export async function saveConnectCard(
  slug: string,
  data: ConnectCardSchemaType,
  locationId?: string | null
): Promise<ApiResponse<{ id: string }>> {
  // 1. Authentication and authorization
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_save_connect_card`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // 3. Validation
  const validation = connectCardSchema.safeParse(data);

  if (!validation.success) {
    // Log validation errors for debugging
    console.error("[Connect Card Validation Failed]", {
      errors: validation.error.errors,
      data: JSON.stringify(data, null, 2),
    });

    return {
      status: "error",
      message: "Invalid Form Data",
    };
  }

  // 4. Data Quality Validation
  const validationResult = validateConnectCardData(
    validation.data.extractedData
  );

  // Log validation results for monitoring
  if (validationResult.needsReview) {
    console.log("[Connect Card Validation] Issues detected:", {
      issues: validationResult.issues,
      extractedData: validation.data.extractedData,
    });
  }

  /**
   * Location Assignment & Validation
   *
   * Priority:
   * 1. If locationId provided → use it (manual override from UI)
   * 2. Otherwise → fetch user's default campus location
   * 3. Validate locationId belongs to organization (multi-tenant security)
   */
  let finalLocationId: string | null = null;

  if (locationId) {
    // User explicitly selected a location
    finalLocationId = locationId;
  } else {
    // Fallback to user's default location
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultLocationId: true },
    });
    finalLocationId = user?.defaultLocationId || null;
  }

  // Multi-tenant security: Validate locationId belongs to organization
  if (finalLocationId) {
    const locationExists = await prisma.location.findFirst({
      where: {
        id: finalLocationId,
        organizationId: organization.id, // Multi-tenant isolation
        isActive: true, // Only accept active locations
      },
      select: { id: true },
    });

    if (!locationExists) {
      return {
        status: "error",
        message: "Invalid location - location not found or inactive",
      };
    }
  }

  try {
    // 5. Calculate image hash for duplicate detection
    const imageHash = calculateImageHash(validation.data.imageKey);

    // 6. Check for duplicate image (same physical card scanned twice)
    const duplicateImage = await prisma.connectCard.findFirst({
      where: {
        organizationId: organization.id,
        imageHash,
      },
      select: {
        id: true,
        name: true,
        scannedAt: true,
      },
    });

    if (duplicateImage) {
      return {
        status: "error",
        message:
          "Duplicate image detected - this exact card has already been scanned",
        data: {
          duplicateType: "image",
          existingCard: duplicateImage,
        } as never,
      };
    }

    // Note: We intentionally do NOT check for duplicate person data here.
    // Returning members filling out prayer requests or updating info should be allowed.
    // Future enhancement: Link to existing ChurchMember records instead of blocking.

    // 7. Get or create active batch for this upload
    const batch = await getOrCreateActiveBatch(
      session.user.id,
      organization.id
    );

    // 8. Save to database with batch assignment and image hash
    const connectCard = await prisma.connectCard.create({
      data: {
        organizationId: organization.id,
        imageKey: validation.data.imageKey,
        imageHash,
        extractedData: validation.data.extractedData,
        // Map extracted fields to database columns
        name: validation.data.extractedData.name,
        email: validation.data.extractedData.email,
        phone: formatPhoneNumber(validation.data.extractedData.phone),
        address: validation.data.extractedData.address,
        prayerRequest: validation.data.extractedData.prayer_request,
        visitType: validation.data.extractedData.first_time_visitor
          ? "First Time Visitor"
          : null,
        interests: validation.data.extractedData.interests || [],
        // Status: All cards go to review queue initially (EXTRACTED)
        // Staff can batch approve or review individually
        status: "EXTRACTED",
        // Store validation issues for review UI (cast to JSON for Prisma)
        validationIssues: validationResult.issues as never,
        scannedBy: session.user.id,
        scannedAt: new Date(),
        // Use provided locationId or staff member's default campus
        locationId: finalLocationId,
        // Assign to active batch
        batchId: batch.id,
      },
      select: {
        id: true,
      },
    });

    // 9. Increment batch card count
    await incrementBatchCardCount(batch.id);

    return {
      status: "success",
      message: "Connect card saved - added to review queue",
      data: { id: connectCard.id },
    };
  } catch (error) {
    console.error("Failed to save connect card:", error);
    return {
      status: "error",
      message: "Failed to save connect card",
    };
  }
}
