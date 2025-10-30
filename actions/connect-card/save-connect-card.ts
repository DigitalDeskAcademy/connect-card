"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { connectCardSchema, ConnectCardSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { validateConnectCardData } from "@/lib/validation/connect-card-quality";
import { formatPhoneNumber } from "@/lib/utils";

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
 * @returns ApiResponse with success/error status and saved record ID
 */
export async function saveConnectCard(
  slug: string,
  data: ConnectCardSchemaType
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
   * Get user's default location for auto-assignment
   *
   * Location Assignment Logic:
   * - Auto-assigns to the staff member's default campus location
   * - Based on WHO scanned the card, not WHERE the card was filled out
   * - Falls back to null if user has no default location set
   *
   * Future Enhancement: Add location dropdown override in upload UI
   * to handle edge cases (e.g., staff scanning cards from different campus)
   */
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultLocationId: true },
  });

  try {
    // 5. Save to database
    const connectCard = await prisma.connectCard.create({
      data: {
        organizationId: organization.id,
        imageKey: validation.data.imageKey,
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
        // Auto-assign to staff member's default campus
        locationId: user?.defaultLocationId || null,
      },
      select: {
        id: true,
      },
    });

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
