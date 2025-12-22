"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { env } from "@/lib/env";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 10,
  })
);

/**
 * Create Scan Token
 *
 * Generates a secure token for QR code scanning.
 * Token expires in 15 minutes and can only be used once.
 *
 * Security:
 * - Requires dashboard access
 * - Rate limiting via Arcjet
 * - Token is cryptographically random
 */
export async function createScanTokenAction(slug: string): Promise<
  ApiResponse<{
    token: string;
    scanUrl: string;
    expiresAt: Date;
  }>
> {
  const { session, organization } = await requireDashboardAccess(slug);

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_create_scan_token`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Rate limit exceeded",
    };
  }

  try {
    // Generate secure random token
    const token = randomBytes(32).toString("hex");

    // Token expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing unused OR expired tokens for this user (lazy cleanup)
    // This prevents token accumulation over time without needing a cron job
    await prisma.scanToken.deleteMany({
      where: {
        userId: session.user.id,
        organizationId: organization.id,
        OR: [
          { usedAt: null }, // unused tokens
          { expiresAt: { lt: new Date() } }, // expired tokens
        ],
      },
    });

    // Create new token
    await prisma.scanToken.create({
      data: {
        token,
        userId: session.user.id,
        organizationId: organization.id,
        expiresAt,
      },
    });

    // Build scan URL (public route, not under /admin)
    const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const scanUrl = `${baseUrl}/church/${slug}/scan?token=${token}`;

    return {
      status: "success",
      message: "Scan token created",
      data: {
        token,
        scanUrl,
        expiresAt,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to create scan token",
    };
  }
}

/**
 * Validate Scan Token
 *
 * Validates a token from QR code scan and returns session info.
 * Marks token as used (single-use enforcement).
 *
 * Security:
 * - Token must exist and not be expired
 * - Token must not have been used before
 * - Returns user and organization info for session creation
 */
export async function validateScanTokenAction(token: string): Promise<
  ApiResponse<{
    userId: string;
    organizationId: string;
    slug: string;
  }>
> {
  try {
    // Find token
    const scanToken = await prisma.scanToken.findUnique({
      where: { token },
      include: {
        organization: {
          select: { slug: true },
        },
      },
    });

    if (!scanToken) {
      return {
        status: "error",
        message: "Invalid or expired link. Please scan a new QR code.",
      };
    }

    // Check if expired
    if (scanToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.scanToken.delete({ where: { id: scanToken.id } });
      return {
        status: "error",
        message: "This link has expired. Please scan a new QR code.",
      };
    }

    // Check if already used
    if (scanToken.usedAt) {
      return {
        status: "error",
        message: "This link has already been used. Please scan a new QR code.",
      };
    }

    // Mark as used
    await prisma.scanToken.update({
      where: { id: scanToken.id },
      data: { usedAt: new Date() },
    });

    return {
      status: "success",
      message: "Token validated",
      data: {
        userId: scanToken.userId,
        organizationId: scanToken.organizationId,
        slug: scanToken.organization.slug,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to validate token",
    };
  }
}

/**
 * Get Scan URL for SMS
 *
 * Creates a scan token and returns just the URL for SMS sending.
 * Used by the "Text Me" button.
 *
 * Security:
 * - Requires dashboard access
 * - Rate limiting via Arcjet
 */
export async function getScanUrlForSmsAction(slug: string): Promise<
  ApiResponse<{
    scanUrl: string;
  }>
> {
  const result = await createScanTokenAction(slug);

  if (result.status === "error") {
    return result;
  }

  return {
    status: "success",
    message: "Scan URL ready",
    data: {
      scanUrl: result.data!.scanUrl,
    },
  };
}

/**
 * Cleanup Expired Tokens
 *
 * Removes expired tokens from the database.
 * Called periodically or on-demand.
 */
export async function cleanupExpiredTokensAction(): Promise<
  ApiResponse<{ deleted: number }>
> {
  try {
    const result = await prisma.scanToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return {
      status: "success",
      message: `Cleaned up ${result.count} expired tokens`,
      data: { deleted: result.count },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to cleanup tokens",
    };
  }
}
