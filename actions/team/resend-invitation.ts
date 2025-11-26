"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { resend, DEFAULT_FROM_EMAIL } from "@/lib/email/client";
import {
  getStaffInvitationEmail,
  getStaffInvitationText,
} from "@/lib/email/templates/staff-invitation";
import { z } from "zod";
import crypto from "crypto";
import { env } from "@/lib/env";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5, // Same as invite-staff (prevent spam)
  })
);

/**
 * Resend Invitation Schema
 */
const resendInvitationSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation ID"),
});

type ResendInvitationInput = z.infer<typeof resendInvitationSchema>;

/**
 * Resend Invitation
 *
 * Generates a new token, extends expiration, and resends the invitation email.
 *
 * Security:
 * - Requires admin permissions (from dataScope.canManageUsers)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (5 resends per minute)
 * - Validates invitation belongs to organization
 * - Generates new cryptographically secure token
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Invitation ID to resend
 * @returns ApiResponse with success/error status
 */
export async function resendInvitation(
  slug: string,
  data: ResendInvitationInput
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to resend invitations",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_resend_invitation`,
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
  const validation = resendInvitationSchema.safeParse(data);

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
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return {
        status: "error",
        message: "Invitation not found",
      };
    }

    // 6. Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return {
        status: "error",
        message: "Cannot resend an invitation that has been accepted",
      };
    }

    // 7. Generate new token and extend expiration
    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

    // 8. Update invitation with new token and expiration
    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: "PENDING", // Reset to PENDING if it was EXPIRED
      },
    });

    // 9. Get location name for email template
    let locationName: string | null = null;
    if (invitation.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: invitation.locationId },
        select: { name: true },
      });
      locationName = location?.name || null;
    }

    // 10. Generate new acceptance URL with new token
    const acceptUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${newToken}`;

    // 11. Send invitation email
    const emailHtml = getStaffInvitationEmail({
      churchName: organization.name,
      inviterName: session.user.name || "A team member",
      recipientEmail: invitation.email,
      role: invitation.role,
      locationName,
      acceptUrl,
      expiresInDays: 7,
    });

    const emailText = getStaffInvitationText({
      churchName: organization.name,
      inviterName: session.user.name || "A team member",
      recipientEmail: invitation.email,
      role: invitation.role,
      locationName,
      acceptUrl,
      expiresInDays: 7,
    });

    await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: invitation.email,
      subject: `You've been invited to join ${organization.name}`,
      html: emailHtml,
      text: emailText,
    });

    return {
      status: "success",
      message: `Invitation resent to ${invitation.email}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to resend invitation. Please try again.",
    };
  }
}
