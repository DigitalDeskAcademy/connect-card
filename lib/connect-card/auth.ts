/**
 * Connect Card Authentication Utilities
 *
 * Shared authentication logic for connect card operations.
 * Supports two authentication methods:
 * 1. Better Auth session (standard logged-in users)
 * 2. Scan session cookie (phone QR code scanning)
 *
 * DRY: This module eliminates duplicate auth patterns across:
 * - /api/s3/upload
 * - /api/connect-cards/extract
 * - saveConnectCard server action
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getScanSessionForApi } from "@/lib/auth/scan-session";

export interface ConnectCardAuthResult {
  userId: string;
  organizationId?: string;
  userRole: string;
  isScanSession: boolean;
}

/**
 * Allowed roles for connect card operations
 */
const ALLOWED_ROLES = [
  "platform_admin",
  "church_owner",
  "church_admin",
  "user",
  "scan_session",
];

/**
 * Authenticate request for connect card operations
 *
 * Supports dual authentication:
 * - Better Auth session (logged-in dashboard users)
 * - Scan session cookie (phone QR code flow)
 *
 * @returns Authentication result with userId and role
 * @throws Error if no valid authentication found
 */
export async function authenticateConnectCardRequest(): Promise<ConnectCardAuthResult> {
  // Try Better Auth session first (standard authentication)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    return {
      userId: session.user.id,
      userRole: session.user.role ?? "user",
      isScanSession: false,
    };
  }

  // Fall back to scan session cookie (phone QR code flow)
  const scanSession = await getScanSessionForApi();

  if (scanSession) {
    return {
      userId: scanSession.userId,
      organizationId: scanSession.organizationId,
      userRole: "scan_session",
      isScanSession: true,
    };
  }

  throw new Error("Authentication required");
}

/**
 * Check if user role is allowed for connect card operations
 */
export function isRoleAllowed(role: string): boolean {
  return ALLOWED_ROLES.includes(role);
}

/**
 * Authenticate and validate role in one call
 *
 * Convenience function that combines authentication and role validation.
 *
 * @returns Authentication result if valid
 * @throws Error if not authenticated or role not allowed
 */
export async function requireConnectCardAuth(): Promise<ConnectCardAuthResult> {
  const authResult = await authenticateConnectCardRequest();

  if (!isRoleAllowed(authResult.userRole)) {
    throw new Error("Insufficient permissions");
  }

  return authResult;
}
