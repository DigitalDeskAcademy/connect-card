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
    max: 3, // Limit to 3 invitations per minute to prevent abuse
  })
);

/**
 * Staff Invitation Schema
 */
const inviteStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
  locationId: z.string().uuid("Invalid location ID").nullable(),
});

type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

/**
 * Invite Staff Member
 *
 * Creates a staff invitation and sends email with secure acceptance link.
 *
 * Security:
 * - Requires account owner or admin permissions (from Member.role)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (3 invitations per minute)
 * - Cryptographically secure token generation
 * - 7-day expiration for invitation links
 *
 * Role Requirements:
 * - owner (Primary Admin): Can invite admins and staff for any location
 * - admin: Can invite staff for any location
 * - member (Staff): Cannot invite (blocked by canManageUsers permission)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Invitation details (email, role, locationId)
 * @returns ApiResponse with success/error status
 */
export async function inviteStaff(
  slug: string,
  data: InviteStaffInput
): Promise<ApiResponse> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Permission check: Only owners and admins can invite
  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to invite team members",
    };
  }

  // 3. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_invite_staff`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many invitations. Please wait before sending more.",
      };
    } else {
      return {
        status: "error",
        message: "Request blocked by security policy",
      };
    }
  }

  // 4. Validation
  const validation = inviteStaffSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message || "Invalid input",
    };
  }

  const { email, role, locationId } = validation.data;

  try {
    // 5. Check if user already exists in organization
    const existingMember = await prisma.member.findFirst({
      where: {
        organizationId: organization.id,
        user: {
          email: email.toLowerCase(),
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (existingMember) {
      return {
        status: "error",
        message: "This user is already a member of your organization",
      };
    }

    // 6. Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: organization.id,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return {
        status: "error",
        message:
          "An invitation for this email is already pending. Please revoke the existing invitation first.",
      };
    }

    // 7. Validate location belongs to organization (if provided)
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

    // 8. Generate secure invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // 9. Create invitation record
    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        locationId,
        token,
        status: "PENDING",
        expiresAt,
        organizationId: organization.id,
        invitedBy: session.user.id,
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    // 10. Get location name for email template
    let locationName: string | null = null;
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
        select: { name: true },
      });
      locationName = location?.name || null;
    }

    // 11. Generate acceptance URL
    const acceptUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`;

    // 12. Send invitation email
    const emailHtml = getStaffInvitationEmail({
      churchName: organization.name,
      inviterName: session.user.name || "A team member",
      recipientEmail: email,
      role,
      locationName,
      acceptUrl,
      expiresInDays: 7,
    });

    const emailText = getStaffInvitationText({
      churchName: organization.name,
      inviterName: session.user.name || "A team member",
      recipientEmail: email,
      role,
      locationName,
      acceptUrl,
      expiresInDays: 7,
    });

    await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: email,
      subject: `You've been invited to join ${organization.name}`,
      html: emailHtml,
      text: emailText,
    });

    return {
      status: "success",
      message: `Invitation sent to ${email}`,
    };
  } catch (error) {
    console.error("Failed to invite staff:", error);
    return {
      status: "error",
      message: "Failed to send invitation. Please try again.",
    };
  }
}
