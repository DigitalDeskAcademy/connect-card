"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

/**
 * Remove Member Schema
 */
const removeMemberSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
});

type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

/**
 * Remove Member
 *
 * Removes a team member from the organization.
 * Deletes the Member record, but keeps the User record intact.
 *
 * Security:
 * - Requires admin permissions (from dataScope.canManageUsers)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet
 * - Prevents removing platform_admin users
 * - Prevents self-removal
 * - Prevents removing the last owner
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Member ID to remove
 * @returns ApiResponse with success/error status
 */
export async function removeMember(
  slug: string,
  data: RemoveMemberInput
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
    fingerprint: `${session.user.id}_${organization.id}_remove_member`,
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
  const validation = removeMemberSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid form data",
    };
  }

  const { memberId } = validation.data;

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

    // 6. Prevent removing platform admins
    if (user.role === "platform_admin") {
      return {
        status: "error",
        message: "Cannot remove platform administrators",
      };
    }

    // 7. Prevent self-removal
    if (user.id === session.user.id) {
      return {
        status: "error",
        message: "You cannot remove yourself from the team",
      };
    }

    // 8. Prevent removing the last account owner
    if (user.role === "church_owner") {
      const ownerCount = await prisma.user.count({
        where: {
          organizationId: organization.id,
          role: "church_owner",
        },
      });

      if (ownerCount <= 1) {
        return {
          status: "error",
          message:
            "Cannot remove the last Account Owner. Assign another Account Owner first.",
        };
      }
    }

    // 9. Remove the Member record (User record remains)
    const member = await prisma.member.findFirst({
      where: {
        userId: memberId,
        organizationId: organization.id,
      },
    });

    if (member) {
      await prisma.member.delete({
        where: { id: member.id },
      });
    }

    // 10. Update user to remove organization association
    await prisma.user.update({
      where: {
        id: memberId,
        organizationId: organization.id, // Multi-tenant isolation
      },
      data: {
        organizationId: null,
        role: null,
        defaultLocationId: null,
      },
    });

    // 11. Revalidate the team page to show updated data
    revalidatePath(`/church/${slug}/admin/team`);

    return {
      status: "success",
      message: `${user.name} has been removed from the team`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to remove team member. Please try again.",
    };
  }
}
