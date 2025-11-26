"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { mapUIRoleToUserRole, type UIRole } from "@/lib/role-mapping";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

/**
 * Update Member Schema
 */
const updateMemberSchema = z.object({
  memberId: z.string().min(1, "Invalid member ID"), // Better Auth uses nanoid, not UUID
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
  locationId: z.string().uuid("Invalid location ID").nullable(),
  volunteerCategories: z.array(z.string()).optional(),
});

type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

/**
 * Update Member
 *
 * Updates a team member's role and/or assigned location.
 *
 * Security:
 * - Requires admin permissions (from dataScope.canManageUsers)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Prevents editing platform_admin users
 * - Prevents self-demotion from owner/admin
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Member ID, new role, new location
 * @returns ApiResponse with success/error status
 */
export async function updateMember(
  slug: string,
  data: UpdateMemberInput
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to update team members",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_update_member`,
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
  const validation = updateMemberSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  const { memberId, role, locationId, volunteerCategories } = validation.data;

  try {
    // 5. Find user and verify they belong to this organization
    const user = await prisma.user.findFirst({
      where: {
        id: memberId,
        organizationId: organization.id, // Multi-tenant isolation
      },
    });

    if (!user) {
      return {
        status: "error",
        message: "Team member not found",
      };
    }

    // 6. Prevent editing platform admins
    if (user.role === "platform_admin") {
      return {
        status: "error",
        message: "Cannot modify platform administrators",
      };
    }

    // 7. Prevent self-demotion
    if (user.id === session.user.id && role === "member") {
      return {
        status: "error",
        message: "You cannot change your own role to Staff",
      };
    }

    // 8. Validate location belongs to organization (if provided)
    if (locationId) {
      const location = await prisma.location.findFirst({
        where: {
          id: locationId,
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

    // 9. Map UI role to Prisma UserRole enum
    // UI uses "admin"/"member", but User.role expects Prisma enum values
    // See: /lib/role-mapping.ts for mapping details
    const userRole = mapUIRoleToUserRole(role as UIRole);

    // 10. Update both User.role (global) and Member.role (org-specific)
    // This keeps the dual role system in sync
    const member = await prisma.member.findFirst({
      where: {
        userId: memberId,
        organizationId: organization.id,
      },
    });

    // Use transaction to ensure both updates succeed or both fail
    await prisma.$transaction([
      // Update User.role (global platform role)
      prisma.user.update({
        where: { id: memberId },
        data: {
          role: userRole, // Prisma enum: "church_admin" or "user"
          defaultLocationId: locationId, // Set default location for staff
          volunteerCategories: volunteerCategories || [], // Volunteer leadership categories
        },
      }),
      // Update Member.role (organization-specific role)
      ...(member
        ? [
            prisma.member.update({
              where: { id: member.id },
              data: {
                role, // String: "admin" or "member"
              },
            }),
          ]
        : []),
    ]);

    // 11. Revalidate the team page to show updated data
    revalidatePath(`/church/${slug}/admin/team`);

    return {
      status: "success",
      message: `${user.name} has been updated successfully`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to update team member. Please try again.",
    };
  }
}
