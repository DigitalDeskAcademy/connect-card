"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import {
  BackgroundCheckStatus,
  VolunteerCategoryType,
  DocumentScope,
} from "@/lib/generated/prisma";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { volunteerSchema, type VolunteerSchemaType } from "@/lib/zodSchemas";
import { sendEmail } from "@/lib/email/service";
import {
  getVolunteerDocumentsEmail,
  getVolunteerDocumentsText,
} from "@/lib/email/templates/volunteer-documents";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
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
      message: "You don't have permission to perform this action",
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
      message: "Invalid form data",
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
          organizationId: organization.id, // Multi-tenant isolation from auth context
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

      // Create category assignments if provided
      if (validatedData.categories && validatedData.categories.length > 0) {
        await tx.volunteerCategory.createMany({
          data: validatedData.categories.map(category => ({
            volunteerId: newVolunteer.id,
            organizationId: organization.id,
            category: category,
          })),
        });
      }

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
      message: "You don't have permission to perform this action",
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

    // 5. Verify volunteer exists and belongs to organization
    const existingVolunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id, // Multi-tenant isolation
      },
    });

    if (!existingVolunteer) {
      return {
        status: "error",
        message: "Unable to update volunteer",
      };
    }

    // Check version for optimistic locking
    if (existingVolunteer.version !== currentVersion) {
      return {
        status: "error",
        message:
          "This volunteer was modified by another user. Please refresh and try again.",
        shouldRefresh: true,
      };
    }

    // 6. Update volunteer profile with optimistic locking
    // Note: categories are not updated here - they're managed via VolunteerCategory relation
    const { categories, ...volunteerData } = data;
    await prisma.volunteer.update({
      where: { id: volunteerId },
      data: {
        ...volunteerData,
        version: { increment: 1 }, // Increment version on successful update
      },
    });

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
      message: "You don't have permission to perform this action",
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
      message: "You don't have permission to perform this action",
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
      message: "You don't have permission to perform this action",
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
 * Process Volunteer (PENDING_APPROVAL → ACTIVE)
 *
 * Processes a pending volunteer by assigning categories and activating them.
 * Used in the volunteer onboarding workflow after connect card processing.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID to process
 * @param categories - Array of category types to assign
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
      message: "You don't have permission to perform this action",
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
        message: "Too many requests. Please wait and try again.",
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
      select: {
        id: true,
        documentsSentAt: true,
        churchMember: { select: { name: true, email: true } },
        categories: { select: { category: true } },
      },
    });

    if (!volunteer) {
      return {
        status: "error",
        message: "Volunteer not found",
      };
    }

    // 5. Update volunteer status to ACTIVE and optionally update background check
    const bgCheckCleared = backgroundCheckStatus === "CLEARED";
    // Only mark ready for export if BG check cleared AND docs were already sent
    const canMarkReadyForExport =
      bgCheckCleared && volunteer.documentsSentAt !== null;

    await prisma.volunteer.update({
      where: { id: volunteerId },
      data: {
        status: "ACTIVE",
        ...(backgroundCheckStatus && {
          backgroundCheckStatus: backgroundCheckStatus as BackgroundCheckStatus,
        }),
        // Mark as ready for export when BG check is cleared AND docs were sent
        ...(canMarkReadyForExport && {
          readyForExport: true,
          readyForExportDate: new Date(),
        }),
      },
    });

    // 6. Delete existing categories and add new ones
    await prisma.volunteerCategory.deleteMany({
      where: { volunteerId: volunteerId },
    });

    if (categories.length > 0) {
      await prisma.volunteerCategory.createMany({
        data: categories.map(category => ({
          volunteerId: volunteerId,
          organizationId: organization.id,
          category: category as VolunteerCategoryType,
        })),
      });
    }

    // 7. Send welcome email with documents + BG check link (if volunteer has email)
    let documentsSent = false;
    if (volunteer.churchMember.email && categories.length > 0) {
      // Use first category for ministry-specific requirements/docs
      const primaryCategory = categories[0] as VolunteerCategoryType;

      // Fetch ministry requirements, documents, and BG check config in parallel
      const [ministryRequirements, documents, bgCheckConfig] =
        await Promise.all([
          prisma.ministryRequirements.findUnique({
            where: {
              organizationId_category: {
                organizationId: organization.id,
                category: primaryCategory,
              },
            },
          }),
          prisma.volunteerDocument.findMany({
            where: {
              organizationId: organization.id,
              OR: [
                { scope: DocumentScope.GLOBAL },
                {
                  scope: DocumentScope.MINISTRY_SPECIFIC,
                  category: primaryCategory,
                },
              ],
            },
            select: { name: true, description: true, fileUrl: true },
          }),
          prisma.backgroundCheckConfig.findUnique({
            where: { organizationId: organization.id },
          }),
        ]);

      // Only send email if there's content to send
      const hasContent =
        documents.length > 0 ||
        (ministryRequirements?.backgroundCheckRequired &&
          bgCheckConfig?.applicationUrl) ||
        (ministryRequirements?.trainingRequired &&
          ministryRequirements?.trainingUrl);

      if (hasContent) {
        const categoryDisplay = primaryCategory
          .split("_")
          .map(w => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" ");

        // Generate BG check confirmation token if BG check is required
        // GHL will use this token in follow-up SMS/email sequences
        if (ministryRequirements?.backgroundCheckRequired) {
          const token = crypto.randomUUID();
          await prisma.volunteer.update({
            where: { id: volunteerId },
            data: { bgCheckToken: token },
          });
        }

        const emailHtml = getVolunteerDocumentsEmail({
          churchName: organization.name,
          volunteerName: volunteer.churchMember.name || "Volunteer",
          volunteerCategory: categoryDisplay,
          documents: documents.map(d => ({
            name: d.name,
            description: d.description,
            fileUrl: d.fileUrl,
          })),
          backgroundCheckRequired:
            ministryRequirements?.backgroundCheckRequired ?? false,
          backgroundCheckUrl: bgCheckConfig?.applicationUrl ?? null,
          backgroundCheckInstructions: bgCheckConfig?.instructions ?? null,
          trainingRequired: ministryRequirements?.trainingRequired ?? false,
          trainingUrl: ministryRequirements?.trainingUrl ?? null,
          trainingDescription:
            ministryRequirements?.trainingDescription ?? null,
        });

        const emailText = getVolunteerDocumentsText({
          churchName: organization.name,
          volunteerName: volunteer.churchMember.name || "Volunteer",
          volunteerCategory: categoryDisplay,
          documents: documents.map(d => ({
            name: d.name,
            description: d.description,
            fileUrl: d.fileUrl,
          })),
          backgroundCheckRequired:
            ministryRequirements?.backgroundCheckRequired ?? false,
          backgroundCheckUrl: bgCheckConfig?.applicationUrl ?? null,
          backgroundCheckInstructions: bgCheckConfig?.instructions ?? null,
          trainingRequired: ministryRequirements?.trainingRequired ?? false,
          trainingUrl: ministryRequirements?.trainingUrl ?? null,
          trainingDescription:
            ministryRequirements?.trainingDescription ?? null,
        });

        const emailResult = await sendEmail({
          to: volunteer.churchMember.email,
          subject: `Welcome to ${categoryDisplay} - ${organization.name}`,
          html: emailHtml,
          text: emailText,
          organizationId: organization.id,
          metadata: {
            template: "volunteer-documents",
            volunteerId: volunteerId,
            category: primaryCategory,
          },
        });

        if (emailResult.success) {
          documentsSent = true;
          // Update documentsSentAt timestamp
          await prisma.volunteer.update({
            where: { id: volunteerId },
            data: { documentsSentAt: new Date() },
          });
        }
      }
    }

    // 8. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${volunteerId}`);

    const message = documentsSent
      ? `${volunteer.churchMember.name} has been activated and welcome email sent`
      : `${volunteer.churchMember.name} has been activated as a volunteer`;

    return {
      status: "success",
      message,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to process volunteer. Please try again.",
    };
  }
}

/**
 * Update Background Check Status
 *
 * Allows staff to approve (CLEARED) or flag a volunteer's background check.
 * Primarily used from the "BG Check Review" tab after a volunteer self-reports completion.
 *
 * @param slug - Organization slug for routing
 * @param volunteerId - Volunteer to update
 * @param status - New background check status (CLEARED, FLAGGED, etc.)
 * @param notes - Optional notes about the decision
 */
export async function updateBackgroundCheckStatus(
  slug: string,
  volunteerId: string,
  status: BackgroundCheckStatus,
  notes?: string
): Promise<ApiResponse> {
  try {
    // 1. Verify user has access
    const { organization } = await requireDashboardAccess(slug);

    // 2. Rate limiting
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: `update_bg_status_${volunteerId}`,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Too many requests. Please wait and try again.",
      };
    }

    // 3. Verify volunteer exists and belongs to organization
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id,
      },
      select: {
        id: true,
        backgroundCheckStatus: true,
        documentsSentAt: true,
        churchMember: { select: { name: true } },
      },
    });

    if (!volunteer) {
      return {
        status: "error",
        message: "Volunteer not found",
      };
    }

    // 4. Update background check status
    const updateData: {
      backgroundCheckStatus: BackgroundCheckStatus;
      backgroundCheckDate?: Date;
      notes?: string;
      readyForExport?: boolean;
      readyForExportDate?: Date;
    } = {
      backgroundCheckStatus: status,
    };

    // If clearing, set the completion date
    if (status === "CLEARED") {
      updateData.backgroundCheckDate = new Date();

      // Check if volunteer is now ready for export (BG cleared + docs sent)
      if (volunteer.documentsSentAt) {
        updateData.readyForExport = true;
        updateData.readyForExportDate = new Date();
      }
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    await prisma.volunteer.update({
      where: { id: volunteerId },
      data: updateData,
    });

    // 5. Revalidate
    revalidatePath(`/church/${slug}/admin/volunteer`);
    revalidatePath(`/church/${slug}/admin/volunteer/${volunteerId}`);

    const statusLabel =
      status === "CLEARED" ? "approved" : status.toLowerCase();
    return {
      status: "success",
      message: `Background check ${statusLabel} for ${volunteer.churchMember.name}`,
    };
  } catch (error) {
    console.error("Error updating background check status:", error);
    return {
      status: "error",
      message: "Failed to update background check status. Please try again.",
    };
  }
}
