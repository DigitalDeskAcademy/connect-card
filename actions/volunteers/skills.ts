"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import {
  volunteerSkillSchema,
  servingOpportunitySkillSchema,
  type VolunteerSkillSchemaType,
  type ServingOpportunitySkillSchemaType,
} from "@/lib/zodSchemas";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

/**
 * Add Volunteer Skill
 *
 * Adds a skill or qualification to a volunteer's profile
 * (e.g., "Background Check Cleared", "CPR Certified", "Musical Ability").
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Validates volunteer belongs to organization
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Volunteer skill data
 * @returns ApiResponse with created skill ID
 */
export async function addVolunteerSkill(
  slug: string,
  data: VolunteerSkillSchemaType
): Promise<ApiResponse<{ skillId: string }>> {
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
    fingerprint: `${session.user.id}_${organization.id}_add_skill`,
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
  const validation = volunteerSkillSchema.safeParse(data);

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
    });

    if (!volunteer) {
      return {
        status: "error",
        message: "Volunteer not found",
      };
    }

    // 6. Check for duplicate skill
    const existingSkill = await prisma.volunteerSkill.findFirst({
      where: {
        volunteerId: validatedData.volunteerId,
        skillName: validatedData.skillName,
      },
    });

    if (existingSkill) {
      return {
        status: "error",
        message: "This volunteer already has this skill",
      };
    }

    // 7. Add volunteer skill
    const skill = await prisma.volunteerSkill.create({
      data: validatedData,
    });

    // 8. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(
      `/church/${slug}/admin/volunteers/${validatedData.volunteerId}`
    );

    return {
      status: "success",
      message: `Skill "${validatedData.skillName}" added successfully`,
      data: { skillId: skill.id },
    };
  } catch (error) {
    console.error("Failed to add volunteer skill:", error);
    return {
      status: "error",
      message: "Failed to add volunteer skill. Please try again.",
    };
  }
}

/**
 * Update Volunteer Skill
 *
 * Updates an existing volunteer skill (e.g., update verification status, expiry date).
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param skillId - Skill ID to update
 * @param data - Updated skill data
 * @returns ApiResponse with success/error status
 */
export async function updateVolunteerSkill(
  slug: string,
  skillId: string,
  data: Partial<VolunteerSkillSchemaType>
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
    fingerprint: `${session.user.id}_${organization.id}_update_skill`,
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
    // 4. Find skill and verify volunteer belongs to organization
    const skill = await prisma.volunteerSkill.findFirst({
      where: {
        id: skillId,
        volunteer: {
          organizationId: organization.id, // Multi-tenant isolation
        },
      },
    });

    if (!skill) {
      return {
        status: "error",
        message: "Volunteer skill not found",
      };
    }

    // 5. Update volunteer skill
    await prisma.volunteerSkill.update({
      where: { id: skillId },
      data,
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${skill.volunteerId}`);

    return {
      status: "success",
      message: "Volunteer skill updated successfully",
    };
  } catch (error) {
    console.error("Failed to update volunteer skill:", error);
    return {
      status: "error",
      message: "Failed to update volunteer skill. Please try again.",
    };
  }
}

/**
 * Delete Volunteer Skill
 *
 * Removes a skill from a volunteer's profile.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param skillId - Skill ID to delete
 * @returns ApiResponse with success/error status
 */
export async function deleteVolunteerSkill(
  slug: string,
  skillId: string
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
    fingerprint: `${session.user.id}_${organization.id}_delete_skill`,
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
    // 4. Find skill and verify volunteer belongs to organization
    const skill = await prisma.volunteerSkill.findFirst({
      where: {
        id: skillId,
        volunteer: {
          organizationId: organization.id, // Multi-tenant isolation
        },
      },
    });

    if (!skill) {
      return {
        status: "error",
        message: "Volunteer skill not found",
      };
    }

    // 5. Delete volunteer skill
    await prisma.volunteerSkill.delete({
      where: { id: skillId },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers`);
    revalidatePath(`/church/${slug}/admin/volunteers/${skill.volunteerId}`);

    return {
      status: "success",
      message: `Skill "${skill.skillName}" removed successfully`,
    };
  } catch (error) {
    console.error("Failed to delete volunteer skill:", error);
    return {
      status: "error",
      message: "Failed to delete volunteer skill. Please try again.",
    };
  }
}

/**
 * Add Required Skill to Serving Opportunity
 *
 * Links a required skill to a serving opportunity (e.g., "Kids Ministry" requires "Background Check Cleared").
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Serving opportunity skill data
 * @returns ApiResponse with created skill requirement ID
 */
export async function addServingOpportunitySkill(
  slug: string,
  data: ServingOpportunitySkillSchemaType
): Promise<ApiResponse<{ skillRequirementId: string }>> {
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
    fingerprint: `${session.user.id}_${organization.id}_add_opp_skill`,
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
  const validation = servingOpportunitySkillSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  const validatedData = validation.data;

  try {
    // 5. Verify serving opportunity belongs to organization
    const opportunity = await prisma.servingOpportunity.findFirst({
      where: {
        id: validatedData.servingOpportunityId,
        organizationId: organization.id, // Multi-tenant isolation
      },
    });

    if (!opportunity) {
      return {
        status: "error",
        message: "Serving opportunity not found",
      };
    }

    // 6. Add required skill
    const skillRequirement = await prisma.servingOpportunitySkill.create({
      data: validatedData,
    });

    // 7. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers/opportunities`);

    return {
      status: "success",
      message: `Required skill "${validatedData.skillName}" added successfully`,
      data: { skillRequirementId: skillRequirement.id },
    };
  } catch (error) {
    console.error("Failed to add serving opportunity skill:", error);
    return {
      status: "error",
      message: "Failed to add required skill. Please try again.",
    };
  }
}

/**
 * Remove Required Skill from Serving Opportunity
 *
 * Removes a required skill from a serving opportunity.
 *
 * Security:
 * - Requires admin permissions
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug for multi-tenant context
 * @param skillRequirementId - Skill requirement ID to delete
 * @returns ApiResponse with success/error status
 */
export async function removeServingOpportunitySkill(
  slug: string,
  skillRequirementId: string
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
    fingerprint: `${session.user.id}_${organization.id}_remove_opp_skill`,
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
    // 4. Find skill requirement and verify opportunity belongs to organization
    const skillRequirement = await prisma.servingOpportunitySkill.findFirst({
      where: {
        id: skillRequirementId,
        servingOpportunity: {
          organizationId: organization.id, // Multi-tenant isolation
        },
      },
    });

    if (!skillRequirement) {
      return {
        status: "error",
        message: "Skill requirement not found",
      };
    }

    // 5. Delete skill requirement
    await prisma.servingOpportunitySkill.delete({
      where: { id: skillRequirementId },
    });

    // 6. Revalidate relevant pages
    revalidatePath(`/church/${slug}/admin/volunteers/opportunities`);

    return {
      status: "success",
      message: `Required skill "${skillRequirement.skillName}" removed successfully`,
    };
  } catch (error) {
    console.error("Failed to remove serving opportunity skill:", error);
    return {
      status: "error",
      message: "Failed to remove required skill. Please try again.",
    };
  }
}
