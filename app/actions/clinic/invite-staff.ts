/**
 * Server Action: Invite Clinic Staff
 *
 * Allows clinic admins to invite their staff members.
 * Creates a user account with the appropriate clinic association.
 */

"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { z } from "zod";
import crypto from "crypto";
// TODO: Add email service integration
// import { sendEmail } from "@/lib/email";

const inviteStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["clinic_admin", "clinic_staff"]),
  clinicId: z.string().uuid("Invalid clinic ID"),
});

export async function inviteClinicStaff(
  input: z.infer<typeof inviteStaffSchema>
) {
  try {
    // Validate input
    const validatedInput = inviteStaffSchema.parse(input);
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        error: "Unauthorized: Please log in",
      };
    }

    // Get user details with clinic info
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        clinicId: true,
        organizationId: true,
      },
    });

    if (!currentUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Only clinic admins and platform admins can invite staff
    if (
      currentUser.role !== "clinic_admin" &&
      currentUser.role !== "platform_admin"
    ) {
      return {
        success: false,
        error: "Only clinic administrators can invite staff",
      };
    }

    // If current user is a clinic admin, they can only invite to their own clinic
    if (currentUser.role === "clinic_admin") {
      if (currentUser.clinicId !== validatedInput.clinicId) {
        return {
          success: false,
          error: "You can only invite staff to your own clinic",
        };
      }
    }

    // Verify user has an organization (required for multi-tenant isolation)
    if (!currentUser.organizationId) {
      return {
        success: false,
        error: "User is not associated with an organization",
      };
    }

    // Verify the clinic exists and belongs to the organization
    const clinic = await prisma.contact.findFirst({
      where: {
        id: validatedInput.clinicId,
        contactType: "CLINIC",
        organizationId: currentUser.organizationId,
      },
    });

    if (!clinic) {
      return {
        success: false,
        error: "Clinic not found",
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedInput.email },
    });

    if (existingUser) {
      // User exists - check if they're already associated with this clinic
      if (existingUser.clinicId === validatedInput.clinicId) {
        return {
          success: false,
          error: "User is already a member of this clinic",
        };
      }

      // TODO: Handle case where user exists but needs to be added to this clinic
      // This might require a different flow or organization switching
      return {
        success: false,
        error: "User already exists. Please contact support for assistance.",
      };
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation record
    await prisma.invitation.create({
      data: {
        email: validatedInput.email,
        role: validatedInput.role === "clinic_admin" ? "admin" : "member",
        token: invitationToken,
        status: "PENDING",
        expiresAt,
        organizationId: currentUser.organizationId || "",
        invitedBy: session.user.id,
      },
    });

    // TODO: Send invitation email
    // For now, return the invitation link that would be sent
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}&clinicId=${validatedInput.clinicId}`;

    // In production, you would send this via email
    console.log("Invitation link:", invitationLink);

    return {
      success: true,
      message: "Staff invitation sent successfully",
      invitationLink, // Remove this in production
    };
  } catch (error) {
    console.error("Error inviting clinic staff:", error);
    return {
      success: false,
      error: "Failed to send invitation. Please try again.",
    };
  }
}

/**
 * Accept a clinic staff invitation
 *
 * TODO: This feature is shelved for MVP - implement after core features are complete
 * Requires proper Better Auth integration and invitation flow setup
 *
 * @param token - Invitation token
 * @param clinicId - Clinic ID
 * @param password - User password
 */
export async function acceptClinicInvitation(
  token: string,
  clinicId: string,
  password: string
) {
  // Stubbed out - feature shelved for MVP
  // Parameters are intentionally unused until feature is implemented
  void token;
  void clinicId;
  void password;

  return {
    success: false,
    error:
      "Staff invitation feature is not yet available. Contact your administrator.",
  };
}
