"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import {
  deletePrayerRequestSchema,
  DeletePrayerRequestSchemaType,
} from "@/lib/zodSchemas";
import { canAccessLocation } from "@/lib/data/location-filter";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5, // 5 deletions per minute
  })
);

/**
 * Delete Prayer Request
 *
 * Archives or permanently deletes a prayer request.
 * Default behavior is to archive (soft delete) by setting status to ARCHIVED.
 * Hard delete only if explicitly requested and user has permissions.
 *
 * Security:
 * - Requires admin or owner permissions for deletion
 * - Staff cannot delete (blocked by canDeleteData permission)
 * - Multi-tenant data isolation via organizationId
 * - Location-based access control
 * - Rate limiting via Arcjet (5 deletions per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Request ID and delete type (archive vs hard delete)
 * @returns ApiResponse with success/error status
 */
export async function deletePrayerRequest(
  slug: string,
  data: DeletePrayerRequestSchemaType
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check: Only admins/owners can delete
  if (!dataScope.filters.canDeleteData) {
    return {
      status: "error",
      message: "You don't have permission to delete prayer requests",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_delete_prayer`,
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
  const validation = deletePrayerRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid delete data",
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

    // 7. Archive (soft delete) or hard delete
    if (validData.shouldArchive) {
      // Soft delete: Set status to ARCHIVED
      await prisma.prayerRequest.update({
        where: { id: validData.id },
        data: { status: "ARCHIVED" },
      });
    } else {
      // Hard delete: Permanently remove from database
      await prisma.prayerRequest.delete({
        where: { id: validData.id },
      });
    }

    return {
      status: "success",
      message: validData.shouldArchive
        ? "Prayer request archived successfully"
        : "Prayer request deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete prayer request",
    };
  }
}
