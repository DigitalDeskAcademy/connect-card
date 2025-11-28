"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { markAnsweredSchema, MarkAnsweredSchemaType } from "@/lib/zodSchemas";
import { canAccessLocation } from "@/lib/data/location-filter";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 10, // 10 answered prayers per minute
  })
);

/**
 * Mark Prayer as Answered
 *
 * Marks a prayer request as answered with optional testimony.
 * Updates status to ANSWERED and records answered date.
 *
 * Security:
 * - Requires authenticated user
 * - Admins/owners can mark any request as answered
 * - Staff can only mark their assigned requests as answered
 * - Multi-tenant data isolation via organizationId
 * - Location-based access control
 * - Rate limiting via Arcjet (10 per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Answered date and testimony
 * @returns ApiResponse with success/error status
 */
export async function markPrayerAnswered(
  slug: string,
  data: MarkAnsweredSchemaType
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_mark_answered`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please try again later.",
      };
    }
    return {
      status: "error",
      message: "Request blocked. Please contact support if this persists.",
    };
  }

  // 3. Validation
  const validation = markAnsweredSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid answered data",
    };
  }

  const validData = validation.data;

  try {
    // 4. Fetch prayer request to check permissions
    const prayerRequest = await prisma.prayerRequest.findFirst({
      where: {
        id: validData.id,
        organizationId: organization.id,
      },
    });

    if (!prayerRequest) {
      return {
        status: "error",
        message: "Prayer request not found",
      };
    }

    // 5. Location access check
    if (prayerRequest.locationId) {
      if (!canAccessLocation(dataScope, prayerRequest.locationId)) {
        return {
          status: "error",
          message: "Access denied",
        };
      }
    }

    // 6. Permission check: Admins/owners can mark any, staff only their assigned
    if (
      !dataScope.filters.canManageUsers &&
      prayerRequest.assignedToId !== session.user.id
    ) {
      return {
        status: "error",
        message: "Access denied",
      };
    }

    // 7. Mark as answered
    await prisma.prayerRequest.update({
      where: { id: validData.id },
      data: {
        status: "ANSWERED",
        answeredDate: validData.answeredDate,
        answeredNotes: validData.answeredNotes,
      },
    });

    return {
      status: "success",
      message: "Prayer marked as answered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to mark prayer as answered",
    };
  }
}
