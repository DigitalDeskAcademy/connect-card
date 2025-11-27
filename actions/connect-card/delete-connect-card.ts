"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 10, // Allow 10 deletes per minute (staff reviewing cards)
  })
);

/**
 * Delete Connect Card
 *
 * Permanently deletes a connect card from the database.
 * Used when staff identifies a fake or invalid card during review.
 *
 * Security:
 * - Requires dashboard access (church admin or staff)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (10 deletes per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param cardId - ID of the connect card to delete
 * @returns ApiResponse with success/error status
 */
export async function deleteConnectCard(
  slug: string,
  cardId: string
): Promise<ApiResponse<void>> {
  // 1. Authentication and authorization
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_delete_connect_card`,
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

  try {
    // 3. Verify card belongs to this organization (security check)
    const existingCard = await prisma.connectCard.findFirst({
      where: {
        id: cardId,
        organizationId: organization.id,
      },
    });

    if (!existingCard) {
      return {
        status: "error",
        message: "Connect card not found",
      };
    }

    // 4. Delete the card
    await prisma.connectCard.delete({
      where: {
        id: cardId,
      },
    });

    return {
      status: "success",
      message: "Connect card deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete connect card",
    };
  }
}
