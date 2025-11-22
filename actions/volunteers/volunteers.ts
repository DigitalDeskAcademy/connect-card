"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { volunteerSchema, type VolunteerSchemaType } from "@/lib/zodSchemas";
import type { VolunteerStatus, BackgroundCheckStatus, VolunteerCategoryType } from "@/lib/generated/prisma";

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
 * Creates a new volunteer profile with automatic member lookup/creation.
 * If a church member with the provided email exists, links to that member.
 * If not, creates a new church member first, then creates the volunteer profile.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Prevents duplicate volunteer profiles
 * - Transaction ensures atomic member + volunteer creation
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Volunteer profile data with member information
 * @returns ApiResponse with created volunteer ID and status message
 */
export async function createVolunteer(
  slug: string,
  data: VolunteerSchemaType
): Promise<ApiResponse<{ volunteerId: string; isNewMember: boolean }>> {
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
    // 5. Validate location belongs to organization (if provided)
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

    // 6. Check if church member exists by email (case-insensitive)
    const existingMember = await prisma.churchMember.findFirst({
      where: {
        email: {
          equals: validatedData.email,
          mode: "insensitive",
        },
        organizationId: organization.id, // Multi-tenant isolation
      },
      include: {
        volunteer: true, // Check if they already have a volunteer profile
      },
    });

    let churchMemberId: string;
    let isNewMember = false;

    if (existingMember) {
      // Member exists - check if they already have a volunteer profile
      if (existingMember.volunteer) {
        return {
          status: "error",
          message: "This member already has a volunteer profile",
        };
      }
      churchMemberId = existingMember.id;
    } else {
      // Member doesn't exist - create new member first
      const fullName =
        `${validatedData.firstName} ${validatedData.lastName}`.trim();
      const newMember = await prisma.churchMember.create({
        data: {
          organizationId: organization.id,
          name: fullName,
          email: validatedData.email,
          phone: validatedData.phone,
          memberType: "VOLUNTEER",
        },
      });
      churchMemberId = newMember.id;
      isNewMember = true;
    }

    // 7. Create volunteer profile and category assignments in transaction
    const volunteer = await prisma.$transaction(async tx => {
      // Create volunteer profile
      const newVolunteer = await tx.volunteer.create({
        data: {
          churchMemberId,
          organizationId: validatedData.organizationId,
          locationId: validatedData.locationId,
          status: validatedData.status,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          inactiveReason: validatedData.inactiveReason,
          emergencyContactName: validatedData.emergencyContactName,
          emergencyContactPhone: validatedData.emergencyContactPhone,
          backgroundCheckStatus: validatedData.backgroundCheckStatus,
          backgroundCheckDate: validatedData.backgroundCheckDate,
          backgroundCheckExpiry: validatedData.backgroundCheckExpiry,
          notes: validatedData.notes,
        },
      });

      // Create category assignments (always at least OTHER due to schema default)
      await tx.volunteerCategory.createMany({
        data: validatedData.categories.map(category => ({
          volunteerId: newVolunteer.id,
          organizationId: organization.id,
          category: category,
        })),
      });

      return newVolunteer;
    });

    // 8. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${volunteer.id}`);

    const message = isNewMember
      ? "Volunteer profile created successfully (new member created)"
      : "Volunteer profile created successfully (linked to existing member)";

    return {
      status: "success",
      message,
      data: { volunteerId: volunteer.id, isNewMember },
    };
  } catch (error) {
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
    return {
      status: "error",
      message: "Unable to update volunteer. Please try again.",
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
    return {
      status: "error",
      message: "Failed to reactivate volunteer. Please try again.",
    };
  }
}

/**
 * Process Pending Volunteer
 *
 * Moves a volunteer from PENDING to ACTIVE status and assigns ministry categories.
 * This is the key workflow for onboarding volunteers from connect cards.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Transaction ensures atomic status + category updates
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID to process
 * @param categories - Array of ministry categories to assign
 * @param backgroundCheckStatus - Optional background check status update
 * @returns ApiResponse with success/error status
 */
export async function processVolunteer(
  slug: string,
  volunteerId: string,
  categories: string[],
  backgroundCheckStatus?: string
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to process volunteers",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_process_volunteer`,
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
  if (!categories || categories.length === 0) {
    return {
      status: "error",
      message: "At least one category must be selected",
    };
  }

  try {
    // 5. Find volunteer and verify they belong to this organization + are PENDING_APPROVAL
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id, // Multi-tenant isolation
        status: "PENDING_APPROVAL",
      },
      include: {
        churchMember: true,
      },
    });

    if (!volunteer) {
      return {
        status: "error",
        message: "Pending volunteer not found",
      };
    }

    // 6. Process volunteer: update status + categories in transaction
    await prisma.$transaction(async tx => {
      // Update volunteer status to ACTIVE
      const updateData: {
        status: VolunteerStatus;
        backgroundCheckStatus?: BackgroundCheckStatus;
      } = {
        status: "ACTIVE",
      };

      if (backgroundCheckStatus) {
        updateData.backgroundCheckStatus = backgroundCheckStatus as BackgroundCheckStatus;
      }

      await tx.volunteer.update({
        where: { id: volunteerId },
        data: updateData,
      });

      // Delete existing category assignments
      await tx.volunteerCategory.deleteMany({
        where: {
          volunteerId: volunteerId,
          organizationId: organization.id,
        },
      });

      // Create new category assignments
      await tx.volunteerCategory.createMany({
        data: categories.map(category => ({
          volunteerId: volunteerId,
          organizationId: organization.id,
          category: category as VolunteerCategoryType,
        })),
      });
    });

    // 7. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteer`);
    revalidatePath(`/church/${slug}/admin/volunteer/${volunteerId}`);

    return {
      status: "success",
      message: `${volunteer.churchMember.name} has been processed and activated`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to process volunteer. Please try again.",
    };
  }
}

/**
 * Delete Volunteer
 *
 * Permanently deletes a volunteer profile and all associated data.
 * Admin-only operation with cascade deletion of skills, availability, categories, and shifts.
 *
 * Security:
 * - Requires admin permissions (church_owner or church_admin)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Cascade deletes all related records
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - ID of volunteer to delete
 * @returns ApiResponse with deletion status
 */
export async function deleteVolunteer(
  slug: string,
  volunteerId: string
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check - only admins can delete
  if (!dataScope.filters.canDeleteData) {
    return {
      status: "error",
      message: "You don't have permission to delete volunteers",
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
    // 4. Verify volunteer exists and belongs to organization
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id,
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

    // 5. Delete volunteer with cascade (skills, categories, availability, shifts)
    await prisma.volunteer.delete({
      where: { id: volunteerId },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteer`);

    return {
      status: "success",
      message: `${volunteer.churchMember.name} has been removed from volunteers`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to delete volunteer. Please try again.",
    };
  }
}
