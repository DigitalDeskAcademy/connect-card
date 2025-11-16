"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { togglePrivacySchema, TogglePrivacySchemaType } from "@/lib/zodSchemas";
import { canAccessLocation } from "@/lib/data/location-filter";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10, // 10 privacy toggles per minute
  })
);

/**
 * Toggle Prayer Request Privacy
 *
 * Changes the privacy status of a prayer request.
 * This is a sensitive operation as it affects who can see the request.
 *
 * Security:
 * - Requires admin or owner permissions (staff cannot change privacy)
 * - Multi-tenant data isolation via organizationId
 * - Location-based access control
 * - Rate limiting via Arcjet (10 toggles per minute)
 * - Audit trail via optional reason field (for future logging)
 *
 * Privacy Rules:
 * - Public requests: Visible to all church staff
 * - Private requests: Only visible to admins, owners, and assigned team member
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Request ID, new privacy status, and optional reason
 * @returns ApiResponse with success/error status
 */
export async function togglePrayerPrivacy(
  slug: string,
  data: TogglePrivacySchemaType
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check: Only admins/owners can change privacy
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to change privacy settings",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_toggle_privacy`,
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

  // 4. Validation
  const validation = togglePrivacySchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid privacy data",
    };
  }

  const validData = validation.data;

  try {
    // 5. Fetch prayer request to check permissions
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

    // 6. Location access check
    if (prayerRequest.locationId) {
      if (!canAccessLocation(dataScope, prayerRequest.locationId)) {
        return {
          status: "error",
          message: "Access denied",
        };
      }
    }

    // 7. Update privacy status
    await prisma.prayerRequest.update({
      where: { id: validData.id },
      data: {
        isPrivate: validData.isPrivate,
      },
    });

    // TODO: Add audit log entry for privacy changes
    // This is a sensitive operation and should be tracked
    // Audit log implementation: Future enhancement

    return {
      status: "success",
      message: validData.isPrivate
        ? "Prayer request marked as private"
        : "Prayer request marked as public",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update privacy settings",
    };
  }
}
