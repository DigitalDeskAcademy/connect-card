"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import {
  updatePrayerRequestSchema,
  UpdatePrayerRequestSchemaType,
} from "@/lib/zodSchemas";
import { canAccessLocation } from "@/lib/data/location-filter";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 10, // 10 updates per minute
  })
);

/**
 * Update Prayer Request
 *
 * Updates an existing prayer request (text, category, privacy, urgency, status).
 *
 * Security:
 * - Requires authenticated user
 * - Multi-tenant data isolation via organizationId
 * - Privacy enforcement: Staff can only edit public or assigned requests
 * - Admins/owners can edit all requests in their organization
 * - Location-based access control
 * - Rate limiting via Arcjet (10 updates per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Prayer request update data
 * @returns ApiResponse with success/error status
 */
export async function updatePrayerRequest(
  slug: string,
  data: UpdatePrayerRequestSchemaType
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_update_prayer`,
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
  const validation = updatePrayerRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid update data",
    };
  }

  const validData = validation.data;

  try {
    // 4. Fetch existing prayer request to check permissions
    const existingRequest = await prisma.prayerRequest.findFirst({
      where: {
        id: validData.id,
        organizationId: organization.id,
      },
    });

    if (!existingRequest) {
      return {
        status: "error",
        message: "Prayer request not found",
      };
    }

    // 5. Location access check
    if (existingRequest.locationId) {
      if (!canAccessLocation(dataScope, existingRequest.locationId)) {
        return {
          status: "error",
          message: "Access denied",
        };
      }
    }

    // 6. Privacy check: Staff can only edit public or assigned private requests
    if (
      existingRequest.isPrivate &&
      !dataScope.filters.canManageUsers &&
      existingRequest.assignedToId !== session.user.id
    ) {
      return {
        status: "error",
        message: "Access denied",
      };
    }

    // 7. Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (validData.request !== undefined) updateData.request = validData.request;
    if (validData.category !== undefined)
      updateData.category = validData.category;
    if (validData.isPrivate !== undefined)
      updateData.isPrivate = validData.isPrivate;
    if (validData.isUrgent !== undefined)
      updateData.isUrgent = validData.isUrgent;
    if (validData.status !== undefined) updateData.status = validData.status;
    if (validData.followUpDate !== undefined)
      updateData.followUpDate = validData.followUpDate;

    // 8. Update prayer request
    await prisma.prayerRequest.update({
      where: { id: validData.id },
      data: updateData,
    });

    return {
      status: "success",
      message: "Prayer request updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update prayer request",
    };
  }
}
