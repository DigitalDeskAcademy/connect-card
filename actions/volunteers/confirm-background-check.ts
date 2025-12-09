"use server";

/**
 * Public Background Check Confirmation Action
 *
 * Allows volunteers to confirm they have completed their background check
 * via a token-based link (no authentication required).
 *
 * Security:
 * - UUID tokens provide 122 bits of cryptographic randomness (2^122 possibilities)
 * - Rate limiting by token prefix prevents targeted brute force attacks
 * - Token lookup is constant-time via unique database index
 * - No sensitive data exposed on invalid tokens
 *
 * Updates status from NOT_STARTED/IN_PROGRESS -> PENDING_REVIEW
 * for staff to verify.
 */

import { prisma } from "@/lib/db";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { RATE_LIMIT_STANDARD } from "@/lib/rate-limits";

// Rate limit: 5 attempts per minute per token prefix (prevents targeted brute force)
const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    ...RATE_LIMIT_STANDARD,
  })
);

interface ConfirmBackgroundCheckResult {
  success: boolean;
  error?: string;
  volunteerName?: string;
  churchName?: string;
  alreadyConfirmed?: boolean;
}

export async function confirmBackgroundCheck(
  token: string
): Promise<ConfirmBackgroundCheckResult> {
  try {
    // Rate limit by token prefix (first 8 chars of UUID)
    // This prevents targeted brute force against a specific volunteer's token
    const tokenPrefix = token.slice(0, 8);
    const req = await request();

    const decision = await aj.protect(req, {
      fingerprint: `bgcheck_confirm_${tokenPrefix}`,
    });

    if (decision.isDenied()) {
      return {
        success: false,
        error: "Too many attempts. Please wait a moment and try again.",
      };
    }
    // Find volunteer by token
    const volunteer = await prisma.volunteer.findUnique({
      where: { bgCheckToken: token },
      include: {
        churchMember: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!volunteer) {
      return {
        success: false,
        error: "Invalid or expired confirmation link.",
      };
    }

    // Get organization name for display
    const organization = await prisma.organization.findUnique({
      where: { id: volunteer.organizationId },
      select: { name: true },
    });

    const churchName = organization?.name || "your church";

    // Check if already confirmed or cleared
    if (
      volunteer.bgCheckConfirmedAt ||
      volunteer.backgroundCheckStatus === "PENDING_REVIEW" ||
      volunteer.backgroundCheckStatus === "CLEARED"
    ) {
      return {
        success: true,
        alreadyConfirmed: true,
        volunteerName: volunteer.churchMember.name || "Volunteer",
        churchName,
      };
    }

    // Update volunteer status to PENDING_REVIEW
    await prisma.volunteer.update({
      where: { id: volunteer.id },
      data: {
        backgroundCheckStatus: "PENDING_REVIEW",
        bgCheckConfirmedAt: new Date(),
      },
    });

    return {
      success: true,
      volunteerName: volunteer.churchMember.name || "Volunteer",
      churchName,
    };
  } catch (error) {
    console.error("Error confirming background check:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
