"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { connectCardSchema, ConnectCardSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";

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

  try {
    // 4. Save to database
    const connectCard = await prisma.connectCard.create({
      data: {
        organizationId: organization.id,
        imageKey: validation.data.imageKey,
        extractedData: validation.data.extractedData,
        // Map extracted fields to database columns
        name: validation.data.extractedData.name,
        email: validation.data.extractedData.email,
        phone: validation.data.extractedData.phone,
        address: validation.data.extractedData.address,
        prayerRequest: validation.data.extractedData.prayer_request,
        visitType: validation.data.extractedData.first_time_visitor
          ? "First Time Visitor"
          : null,
        interests: validation.data.extractedData.interests || [],
        status: "EXTRACTED",
        scannedBy: session.user.id,
        scannedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    return {
      status: "success",
      message: "Connect card saved successfully",
      data: { id: connectCard.id },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to save connect card",
    };
  }
}
