"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  connectCardUpdateSchema,
  ConnectCardUpdateSchemaType,
} from "@/lib/zodSchemas";
import { request } from "@arcjet/next";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10, // Allow 10 updates per minute (staff reviewing cards)
  })
);

/**
 * Update Connect Card
 *
 * Updates a connect card with corrected data from staff review.
 * Changes card status from "EXTRACTED" to "REVIEWED" after correction.
 *
 * Security:
 * - Requires dashboard access (church admin or staff)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (10 updates per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Corrected connect card data
 * @returns ApiResponse with success/error status
 */
export async function updateConnectCard(
  slug: string,
  data: ConnectCardUpdateSchemaType
): Promise<ApiResponse<{ id: string }>> {
  // 1. Authentication and authorization
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_update_connect_card`,
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
  const validation = connectCardUpdateSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data",
    };
  }

  try {
    // 4. Verify card belongs to this organization (security check)
    const existingCard = await prisma.connectCard.findFirst({
      where: {
        id: validation.data.id,
        organizationId: organization.id,
      },
    });

    if (!existingCard) {
      return {
        status: "error",
        message: "Connect card not found",
      };
    }

    // 5. Update card with corrected data and mark as REVIEWED
    const updatedCard = await prisma.connectCard.update({
      where: {
        id: validation.data.id,
      },
      data: {
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        visitType: validation.data.visitType,
        interests: validation.data.interests,
        prayerRequest: validation.data.prayerRequest,
        status: "REVIEWED", // Mark as reviewed after correction
        updatedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    return {
      status: "success",
      message: "Connect card updated successfully",
      data: { id: updatedCard.id },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update connect card",
    };
  }
}
