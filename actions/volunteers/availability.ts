"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import {
  volunteerAvailabilitySchema,
  type VolunteerAvailabilitySchemaType,
} from "@/lib/zodSchemas";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

/**
 * Add Volunteer Availability
 *
 * Adds an availability pattern (recurring schedule or blackout date) for a volunteer.
 * Examples:
 * - RECURRING: "Available every Sunday 9am-12pm"
 * - BLACKOUT: "Unavailable Dec 20-27 (vacation)"
 * - ONE_TIME: "Available for Easter service"
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Validates volunteer belongs to organization
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Volunteer availability data
 * @returns ApiResponse with created availability ID
 */
export async function addVolunteerAvailability(
  slug: string,
  data: VolunteerAvailabilitySchemaType
): Promise<ApiResponse<{ availabilityId: string }>> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "Unable to perform this action",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_add_availability`,
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
  const validation = volunteerAvailabilitySchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  const validatedData = validation.data;

  try {
    // 5. Verify volunteer belongs to organization
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: validatedData.volunteerId,
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

    // 6. Add volunteer availability
    const availability = await prisma.volunteerAvailability.create({
      data: validatedData,
    });

    // 7. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(
      `/church/${slug}/admin/volunteers/${validatedData.volunteerId}`
    );
    revalidatePath(`/church/${slug}/admin/volunteers/schedule`);

    return {
      status: "success",
      message: `Availability updated for ${volunteer.churchMember.name}`,
      data: { availabilityId: availability.id },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to add volunteer availability. Please try again.",
    };
  }
}

/**
 * Update Volunteer Availability
 *
 * Updates an existing availability pattern.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param availabilityId - Availability ID to update
 * @param data - Updated availability data
 * @returns ApiResponse with success/error status
 */
export async function updateVolunteerAvailability(
  slug: string,
  availabilityId: string,
  data: Partial<VolunteerAvailabilitySchemaType>
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "Unable to perform this action",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_update_availability`,
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
    // 4. Find availability and verify volunteer belongs to organization
    const availability = await prisma.volunteerAvailability.findFirst({
      where: {
        id: availabilityId,
        volunteer: {
          organizationId: organization.id, // Multi-tenant isolation
        },
      },
    });

    if (!availability) {
      return {
        status: "error",
        message: "Volunteer availability not found",
      };
    }

    // 5. Update volunteer availability
    await prisma.volunteerAvailability.update({
      where: { id: availabilityId },
      data,
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(
      `/church/${slug}/admin/volunteers/${availability.volunteerId}`
    );
    revalidatePath(`/church/${slug}/admin/volunteers/schedule`);

    return {
      status: "success",
      message: "Volunteer availability updated successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to update volunteer availability. Please try again.",
    };
  }
}

/**
 * Delete Volunteer Availability
 *
 * Removes an availability pattern from a volunteer.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param availabilityId - Availability ID to delete
 * @returns ApiResponse with success/error status
 */
export async function deleteVolunteerAvailability(
  slug: string,
  availabilityId: string
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "Unable to perform this action",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_delete_availability`,
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
    // 4. Find availability and verify volunteer belongs to organization
    const availability = await prisma.volunteerAvailability.findFirst({
      where: {
        id: availabilityId,
        volunteer: {
          organizationId: organization.id, // Multi-tenant isolation
        },
      },
    });

    if (!availability) {
      return {
        status: "error",
        message: "Volunteer availability not found",
      };
    }

    // 5. Delete volunteer availability
    await prisma.volunteerAvailability.delete({
      where: { id: availabilityId },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(
      `/church/${slug}/admin/volunteers/${availability.volunteerId}`
    );
    revalidatePath(`/church/${slug}/admin/volunteers/schedule`);

    return {
      status: "success",
      message: "Volunteer availability removed successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to delete volunteer availability. Please try again.",
    };
  }
}

/**
 * Add Blackout Date
 *
 * Quick helper to add a blackout period for a volunteer (vacation, unavailable, etc.).
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID
 * @param startDate - Blackout start date
 * @param endDate - Blackout end date
 * @param reason - Reason for unavailability
 * @returns ApiResponse with created availability ID
 */
export async function addBlackoutDate(
  slug: string,
  volunteerId: string,
  startDate: Date,
  endDate: Date,
  reason?: string
): Promise<ApiResponse<{ availabilityId: string }>> {
  return addVolunteerAvailability(slug, {
    volunteerId,
    availabilityType: "BLACKOUT",
    startDate,
    endDate,
    isAvailable: false,
    reason,
    dayOfWeek: null,
    startTime: null,
    endTime: null,
    recurrencePattern: null,
    notes: null,
  });
}

/**
 * Add Recurring Availability
 *
 * Quick helper to add recurring availability for a volunteer (e.g., "Every Sunday 9am-12pm").
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param volunteerId - Volunteer ID
 * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @param startTime - Start time (HH:MM format)
 * @param endTime - End time (HH:MM format)
 * @param recurrencePattern - Recurrence pattern (WEEKLY, BIWEEKLY, etc.)
 * @returns ApiResponse with created availability ID
 */
export async function addRecurringAvailability(
  slug: string,
  volunteerId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  recurrencePattern:
    | "WEEKLY"
    | "BIWEEKLY"
    | "MONTHLY"
    | "FIRST_OF_MONTH"
    | "THIRD_OF_MONTH" = "WEEKLY"
): Promise<ApiResponse<{ availabilityId: string }>> {
  return addVolunteerAvailability(slug, {
    volunteerId,
    availabilityType: "RECURRING",
    dayOfWeek,
    startTime,
    endTime,
    recurrencePattern,
    isAvailable: true,
    startDate: null,
    endDate: null,
    reason: null,
    notes: null,
  });
}
