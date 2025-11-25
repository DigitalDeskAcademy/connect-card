"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { z } from "zod";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10, // Allow more revocations per minute than invitations
  })
);

/**
 * Revoke Invitation Schema
 */
const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation ID"),
});

type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;

/**
 * Revoke Invitation
 *
 * Marks a pending invitation as EXPIRED, preventing it from being accepted.
 *
 * Security:
 * - Requires admin permissions (from dataScope.canManageUsers)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (10 revocations per minute)
 * - Validates invitation belongs to organization
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Invitation ID to revoke
 * @returns ApiResponse with success/error status
 */
export async function revokeInvitation(
  slug: string,
  data: RevokeInvitationInput
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to revoke invitations",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_revoke_invitation`,
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
  const validation = revokeInvitationSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  const { invitationId } = validation.data;

  try {
    // 5. Find invitation and verify it belongs to this organization
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: organization.id, // Multi-tenant isolation
      },
    });

    if (!invitation) {
      return {
        status: "error",
        message: "Invitation not found",
      };
    }

    // 6. Check if already revoked or accepted
    if (invitation.status === "EXPIRED") {
      return {
        status: "error",
        message: "This invitation has already been revoked",
      };
    }

    if (invitation.status === "ACCEPTED") {
      return {
        status: "error",
        message: "Cannot revoke an invitation that has been accepted",
      };
    }

    // 7. Revoke invitation (mark as EXPIRED)
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    });

    return {
      status: "success",
      message: `Invitation to ${invitation.email} has been revoked`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to revoke invitation. Please try again.",
    };
  }
}
