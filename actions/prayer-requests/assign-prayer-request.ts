"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import {
  assignPrayerRequestSchema,
  AssignPrayerRequestSchemaType,
} from "@/lib/zodSchemas";
import { canAccessLocation } from "@/lib/data/location-filter";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10, // 10 assignments per minute
  })
);

/**
 * Assign Prayer Request
 *
 * Assigns a prayer request to a prayer team member.
 * Updates status to ASSIGNED and denormalizes assignedToName for performance.
 *
 * Security:
 * - Requires authenticated user
 * - Admins/owners can assign any request
 * - Staff can only assign themselves to public requests
 * - Multi-tenant data isolation via organizationId
 * - Location-based access control
 * - Rate limiting via Arcjet (10 assignments per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Assignment details (requestId, userId)
 * @returns ApiResponse with success/error status
 */
export async function assignPrayerRequest(
  slug: string,
  data: AssignPrayerRequestSchemaType
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_assign_prayer`,
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
  const validation = assignPrayerRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid assignment data",
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

    // 6. Privacy check: Staff can only assign themselves to public requests
    if (
      prayerRequest.isPrivate &&
      !dataScope.filters.canManageUsers &&
      validData.assignedToId !== session.user.id
    ) {
      return {
        status: "error",
        message: "Access denied",
      };
    }

    // 7. Verify assigned user exists and belongs to organization
    const assignedUser = await prisma.user.findFirst({
      where: {
        id: validData.assignedToId,
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!assignedUser) {
      return {
        status: "error",
        message: "User not found",
      };
    }

    // 8. Assign prayer request
    await prisma.prayerRequest.update({
      where: { id: validData.id },
      data: {
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name, // Denormalize for performance
        status: "ASSIGNED", // Auto-update status
      },
    });

    return {
      status: "success",
      message: "Prayer request assigned successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to assign prayer request",
    };
  }
}
