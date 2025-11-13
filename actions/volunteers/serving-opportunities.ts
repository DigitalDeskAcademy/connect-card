"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import {
  servingOpportunitySchema,
  type ServingOpportunitySchemaType,
} from "@/lib/zodSchemas";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

/**
 * Create Serving Opportunity
 *
 * Creates a new ministry role/serving opportunity (e.g., "Sunday Greeter", "Kids Ministry Helper").
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Validates location belongs to organization
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Serving opportunity data
 * @returns ApiResponse with created opportunity ID
 */
export async function createServingOpportunity(
  slug: string,
  data: ServingOpportunitySchemaType
): Promise<ApiResponse<{ opportunityId: string }>> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage serving opportunities",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_create_opportunity`,
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
  const validation = servingOpportunitySchema.safeParse(data);

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

    // 6. Create serving opportunity
    const opportunity = await prisma.servingOpportunity.create({
      data: validatedData,
    });

    // 7. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers/opportunities`);

    return {
      status: "success",
      message: "Serving opportunity created successfully",
      data: { opportunityId: opportunity.id },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to create serving opportunity. Please try again.",
    };
  }
}

/**
 * Update Serving Opportunity
 *
 * Updates an existing serving opportunity with optimistic locking.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Optimistic locking prevents concurrent edit conflicts
 *
 * @param slug - Organization slug for multi-tenant context
 * @param opportunityId - Opportunity ID to update
 * @param currentVersion - Current version number (for optimistic locking)
 * @param data - Updated opportunity data
 * @returns ApiResponse with success/error status
 */
export async function updateServingOpportunity(
  slug: string,
  opportunityId: string,
  currentVersion: number,
  data: Partial<ServingOpportunitySchemaType>
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage serving opportunities",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_update_opportunity`,
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
          message:
            "Unable to update opportunity. Please verify all selections.",
        };
      }
    }

    // 5. Update serving opportunity with optimistic locking
    const updatedOpportunity = await prisma.servingOpportunity.updateMany({
      where: {
        id: opportunityId,
        organizationId: organization.id, // Multi-tenant isolation
        version: currentVersion, // Optimistic lock - fails if version changed
      },
      data: {
        ...data,
        version: { increment: 1 }, // Increment version on successful update
      },
    });

    // If count is 0, either opportunity doesn't exist or version mismatch
    if (updatedOpportunity.count === 0) {
      // Check if opportunity exists
      const opportunity = await prisma.servingOpportunity.findFirst({
        where: {
          id: opportunityId,
          organizationId: organization.id,
        },
      });

      if (!opportunity) {
        return {
          status: "error",
          message: "Unable to update opportunity",
        };
      }

      // Version mismatch - someone else updated the opportunity
      return {
        status: "error",
        message:
          "This opportunity was modified by another user. Please refresh and try again.",
        shouldRefresh: true,
      };
    }

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers/opportunities`);

    return {
      status: "success",
      message: "Serving opportunity updated successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Unable to update opportunity. Please try again.",
    };
  }
}

/**
 * Delete Serving Opportunity
 *
 * Deletes a serving opportunity. This cascades to delete associated
 * required skills and shifts due to Prisma onDelete: Cascade.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Validates opportunity belongs to organization
 *
 * @param slug - Organization slug for multi-tenant context
 * @param opportunityId - Opportunity ID to delete
 * @returns ApiResponse with success/error status
 */
export async function deleteServingOpportunity(
  slug: string,
  opportunityId: string
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage serving opportunities",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_delete_opportunity`,
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
    // 4. Find opportunity and verify it belongs to this organization
    const opportunity = await prisma.servingOpportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId: organization.id, // Multi-tenant isolation
      },
    });

    if (!opportunity) {
      return {
        status: "error",
        message: "Serving opportunity not found",
      };
    }

    // 5. Delete serving opportunity (cascades to skills and shifts)
    await prisma.servingOpportunity.delete({
      where: { id: opportunityId },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers/opportunities`);

    return {
      status: "success",
      message: `"${opportunity.name}" has been deleted`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to delete serving opportunity. Please try again.",
    };
  }
}

/**
 * Toggle Serving Opportunity Active Status
 *
 * Activates or deactivates a serving opportunity without deleting it.
 * Inactive opportunities won't appear in scheduling but preserve history.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param opportunityId - Opportunity ID to toggle
 * @param isActive - New active status
 * @returns ApiResponse with success/error status
 */
export async function toggleServingOpportunityStatus(
  slug: string,
  opportunityId: string,
  isActive: boolean
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage serving opportunities",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_toggle_opportunity`,
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
    // 4. Find opportunity and verify it belongs to this organization
    const opportunity = await prisma.servingOpportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId: organization.id, // Multi-tenant isolation
      },
    });

    if (!opportunity) {
      return {
        status: "error",
        message: "Serving opportunity not found",
      };
    }

    // 5. Update active status
    await prisma.servingOpportunity.update({
      where: { id: opportunityId },
      data: { isActive },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers/opportunities`);

    return {
      status: "success",
      message: `"${opportunity.name}" has been ${isActive ? "activated" : "deactivated"}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to update serving opportunity status. Please try again.",
    };
  }
}
