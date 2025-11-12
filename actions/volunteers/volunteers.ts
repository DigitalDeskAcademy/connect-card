"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { volunteerSchema, type VolunteerSchemaType } from "@/lib/zodSchemas";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

/**
 * Create Volunteer Profile
 *
 * Creates a new volunteer profile linked to an existing ChurchMember.
 * One church member can have one volunteer profile (one-to-one relationship).
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Validates church member exists and belongs to organization
 * - Prevents duplicate volunteer profiles
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Volunteer profile data
 * @returns ApiResponse with created volunteer ID
 */
export async function createVolunteer(
  slug: string,
  data: VolunteerSchemaType
): Promise<ApiResponse<{ volunteerId: string }>> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage volunteers",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_create_volunteer`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please wait before trying again.",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked by security policy",
      };
    }
  }

  // 4. Validation
  const validation = volunteerSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  const validatedData = validation.data;

  try {
    // 5. Verify church member exists and belongs to organization
    const churchMember = await prisma.churchMember.findFirst({
      where: {
        id: validatedData.churchMemberId,
        organizationId: organization.id, // Multi-tenant isolation
      },
    });

    if (!churchMember) {
      return {
        status: "error",
        message: "Church member not found",
      };
    }

    // 6. Check if volunteer profile already exists
    const existingVolunteer = await prisma.volunteer.findUnique({
      where: {
        churchMemberId: validatedData.churchMemberId,
      },
    });

    if (existingVolunteer) {
      return {
        status: "error",
        message: "This member already has a volunteer profile",
      };
    }

    // 7. Validate location belongs to organization (if provided)
    if (validatedData.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: validatedData.locationId,
          organizationId: organization.id,
          isActive: true,
        },
      });

      if (!location) {
        return {
          status: "error",
          message: "Invalid location - location not found or inactive",
        };
      }
    }

    // 8. Create volunteer profile
    const volunteer = await prisma.volunteer.create({
      data: validatedData,
    });

    // 9. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${volunteer.id}`);

    return {
      status: "success",
      message: "Volunteer profile created successfully",
      data: { volunteerId: volunteer.id },
    };
  } catch (error) {
    console.error("Failed to create volunteer:", error);
    return {
      status: "error",
      message: "Failed to create volunteer profile. Please try again.",
    };
  }
}

/**
 * Update Volunteer Profile
 *
 * Updates an existing volunteer profile with optimistic locking.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Optimistic locking prevents concurrent edit conflicts
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID to update
 * @param currentVersion - Current version number (for optimistic locking)
 * @param data - Updated volunteer data
 * @returns ApiResponse with success/error status
 */
export async function updateVolunteer(
  slug: string,
  volunteerId: string,
  currentVersion: number,
  data: Partial<VolunteerSchemaType>
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage volunteers",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_update_volunteer`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please wait before trying again.",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked by security policy",
      };
    }
  }

  try {
    // 4. Validate location belongs to organization (if updating)
    if (data.locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: data.locationId,
          organizationId: organization.id,
          isActive: true,
        },
      });

      if (!location) {
        return {
          status: "error",
          message: "Unable to update volunteer. Please verify all selections.",
        };
      }
    }

    // 5. Update volunteer profile with optimistic locking
    const updatedVolunteer = await prisma.volunteer.updateMany({
      where: {
        id: volunteerId,
        organizationId: organization.id, // Multi-tenant isolation
        version: currentVersion, // Optimistic lock - fails if version changed
      },
      data: {
        ...data,
        version: { increment: 1 }, // Increment version on successful update
      },
    });

    // If count is 0, either volunteer doesn't exist or version mismatch
    if (updatedVolunteer.count === 0) {
      // Check if volunteer exists
      const volunteer = await prisma.volunteer.findFirst({
        where: {
          id: volunteerId,
          organizationId: organization.id,
        },
      });

      if (!volunteer) {
        console.error(
          `Volunteer ${volunteerId} not found for org ${organization.id}`
        );
        return {
          status: "error",
          message: "Unable to update volunteer",
        };
      }

      // Version mismatch - someone else updated the volunteer
      return {
        status: "error",
        message:
          "This volunteer was modified by another user. Please refresh and try again.",
        shouldRefresh: true,
      };
    }

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${volunteerId}`);

    return {
      status: "success",
      message: "Volunteer profile updated successfully",
    };
  } catch (error) {
    console.error("Failed to update volunteer:", error);
    return {
      status: "error",
      message: "Unable to update volunteer. Please try again.",
    };
  }
}

/**
 * Delete Volunteer Profile
 *
 * Deletes a volunteer profile. This cascades to delete associated skills,
 * availability, and shifts due to Prisma onDelete: Cascade.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Validates volunteer belongs to organization
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID to delete
 * @returns ApiResponse with success/error status
 */
export async function deleteVolunteer(
  slug: string,
  volunteerId: string
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage volunteers",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_delete_volunteer`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please wait before trying again.",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked by security policy",
      };
    }
  }

  try {
    // 4. Find volunteer and verify they belong to this organization
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id, // Multi-tenant isolation
      },
      include: {
        churchMember: true,
      },
    });

    if (!volunteer) {
      return {
        status: "error",
        message: "Volunteer not found",
      };
    }

    // 5. Delete volunteer profile (cascades to skills, availability, shifts)
    await prisma.volunteer.delete({
      where: { id: volunteerId },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);

    return {
      status: "success",
      message: `${volunteer.churchMember.name}'s volunteer profile has been deleted`,
    };
  } catch (error) {
    console.error("Failed to delete volunteer:", error);
    return {
      status: "error",
      message: "Failed to delete volunteer profile. Please try again.",
    };
  }
}

/**
 * Deactivate Volunteer
 *
 * Sets volunteer status to INACTIVE and records end date/reason.
 * Soft delete approach that preserves volunteer history.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID to deactivate
 * @param reason - Reason for deactivation
 * @returns ApiResponse with success/error status
 */
export async function deactivateVolunteer(
  slug: string,
  volunteerId: string,
  reason?: string
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage volunteers",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_deactivate_volunteer`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please wait before trying again.",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked by security policy",
      };
    }
  }

  try {
    // 4. Find volunteer and verify they belong to this organization
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id, // Multi-tenant isolation
      },
      include: {
        churchMember: true,
      },
    });

    if (!volunteer) {
      return {
        status: "error",
        message: "Volunteer not found",
      };
    }

    // 5. Update volunteer status to INACTIVE
    await prisma.volunteer.update({
      where: { id: volunteerId },
      data: {
        status: "INACTIVE",
        endDate: new Date(),
        inactiveReason: reason,
      },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${volunteerId}`);

    return {
      status: "success",
      message: `${volunteer.churchMember.name} has been marked as inactive`,
    };
  } catch (error) {
    console.error("Failed to deactivate volunteer:", error);
    return {
      status: "error",
      message: "Failed to deactivate volunteer. Please try again.",
    };
  }
}

/**
 * Reactivate Volunteer
 *
 * Sets volunteer status back to ACTIVE and clears end date/reason.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID to reactivate
 * @returns ApiResponse with success/error status
 */
export async function reactivateVolunteer(
  slug: string,
  volunteerId: string
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage volunteers",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_reactivate_volunteer`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please wait before trying again.",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked by security policy",
      };
    }
  }

  try {
    // 4. Find volunteer and verify they belong to this organization
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id, // Multi-tenant isolation
      },
      include: {
        churchMember: true,
      },
    });

    if (!volunteer) {
      return {
        status: "error",
        message: "Volunteer not found",
      };
    }

    // 5. Update volunteer status to ACTIVE
    await prisma.volunteer.update({
      where: { id: volunteerId },
      data: {
        status: "ACTIVE",
        endDate: null,
        inactiveReason: null,
      },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${volunteerId}`);

    return {
      status: "success",
      message: `${volunteer.churchMember.name} has been reactivated`,
    };
  } catch (error) {
    console.error("Failed to reactivate volunteer:", error);
    return {
      status: "error",
      message: "Failed to reactivate volunteer. Please try again.",
    };
  }
}
