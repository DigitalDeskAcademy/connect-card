"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { headers } from "next/headers";
import { mapUIRoleToUserRole, type UIRole } from "@/lib/role-mapping";

/**
 * Accept Staff Invitation
 *
 * Processes invitation token and adds user to organization with assigned role/location.
 *
 * Security:
 * - Requires authenticated user session
 * - Validates invitation token and expiration
 * - Prevents duplicate acceptances
 * - Sets user's defaultLocationId for staff members
 *
 * Flow:
 * 1. User clicks invitation link with token
 * 2. User must sign in/up if not already authenticated
 * 3. System validates token and creates membership
 * 4. User is redirected to organization dashboard
 *
 * @param token - Secure invitation token from email
 * @returns ApiResponse with redirect URL on success
 */
export async function acceptInvitation(
  token: string
): Promise<ApiResponse<{ redirectUrl: string }>> {
  try {
    // 1. Validate token format
    if (!token || token.length !== 64) {
      return {
        status: "error",
        message: "Invalid invitation token",
      };
    }

    // 2. Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        status: "error",
        message: "You must be signed in to accept this invitation",
      };
    }

    // 3. Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invitation) {
      return {
        status: "error",
        message: "Invitation not found or has been revoked",
      };
    }

    // 4. Validate invitation status
    if (invitation.status === "ACCEPTED") {
      return {
        status: "error",
        message: "This invitation has already been accepted",
      };
    }

    if (invitation.status === "EXPIRED") {
      return {
        status: "error",
        message:
          "This invitation has expired. Please request a new invitation.",
      };
    }

    if (invitation.status === "DECLINED") {
      return {
        status: "error",
        message: "This invitation has been declined",
      };
    }

    // 5. Check expiration
    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });

      return {
        status: "error",
        message:
          "This invitation has expired. Please request a new invitation.",
      };
    }

    // 6. Validate email matches (case-insensitive)
    if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return {
        status: "error",
        message: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
      };
    }

    // 7. Check if user is already a member
    const existingMembership = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
      },
    });

    if (existingMembership) {
      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedBy: session.user.id,
        },
      });

      return {
        status: "success",
        message: "You are already a member of this organization",
        data: {
          redirectUrl: `/church/${invitation.organization.slug}/admin`,
        },
      };
    }

    // 8. Map invitation role to Prisma UserRole enum
    // invitation.role is a string like "admin" or "member"
    // User.role needs Prisma enum like "church_admin" or "user"
    const userRole = mapUIRoleToUserRole(invitation.role as UIRole);

    // 9. Create membership and update user in transaction
    await prisma.$transaction(async tx => {
      // Create Member record (organization-specific role)
      await tx.member.create({
        data: {
          userId: session.user.id,
          organizationId: invitation.organizationId,
          role: invitation.role, // String: "admin" or "member"
        },
      });

      // Update User record (global platform role)
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          organizationId: invitation.organizationId,
          role: userRole, // Prisma enum: "church_admin" or "user"
          defaultLocationId: invitation.locationId, // Set default location for staff
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedBy: session.user.id,
        },
      });
    });

    return {
      status: "success",
      message: `Welcome to ${invitation.organization.name}!`,
      data: {
        redirectUrl: `/church/${invitation.organization.slug}/admin`,
      },
    };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return {
      status: "error",
      message: "Failed to accept invitation. Please try again.",
    };
  }
}
