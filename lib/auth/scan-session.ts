/**
 * Scan Session Authentication
 *
 * Lightweight session management for phone-based QR code scanning.
 * This is SEPARATE from Better Auth and used only for scan routes.
 *
 * Security features:
 * - HTTP-only cookie (not accessible via JavaScript)
 * - Secure flag (HTTPS only in production)
 * - SameSite=Strict (prevents CSRF)
 * - HMAC-SHA256 signed payload (prevents tampering)
 * - Short expiry (15 minutes)
 * - Scoped to scan-specific routes only
 *
 * Flow:
 * 1. Phone scans QR code with token
 * 2. Server validates token, creates scan session cookie
 * 3. Subsequent API calls include cookie automatically
 * 4. API routes validate cookie signature and expiry
 */

import { cookies } from "next/headers";
import { createHmac } from "crypto";

const COOKIE_NAME = "scan_session";
const SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// Use BETTER_AUTH_SECRET as signing key (already secure, high entropy)
function getSigningKey(): string {
  const key = process.env.BETTER_AUTH_SECRET;
  if (!key) {
    throw new Error("BETTER_AUTH_SECRET not configured");
  }
  return key;
}

export interface ScanSessionPayload {
  userId: string;
  organizationId: string;
  slug: string;
  expiresAt: number; // Unix timestamp in ms
}

/**
 * Sign payload using HMAC-SHA256
 */
function signPayload(payload: ScanSessionPayload): string {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", getSigningKey())
    .update(data)
    .digest("hex");
  return `${Buffer.from(data).toString("base64")}.${signature}`;
}

/**
 * Verify and decode signed payload
 */
function verifyAndDecode(signed: string): ScanSessionPayload | null {
  try {
    const [encodedData, signature] = signed.split(".");
    if (!encodedData || !signature) return null;

    const data = Buffer.from(encodedData, "base64").toString("utf-8");
    const expectedSignature = createHmac("sha256", getSigningKey())
      .update(data)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return null;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    return JSON.parse(data) as ScanSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Create scan session cookie after token validation
 * Call this from the scan page after validating the QR code token
 */
export async function createScanSession(
  userId: string,
  organizationId: string,
  slug: string
): Promise<void> {
  const payload: ScanSessionPayload = {
    userId,
    organizationId,
    slug,
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
  };

  const signed = signPayload(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/", // Available to all routes (API routes need it)
    maxAge: SESSION_EXPIRY_MS / 1000, // Cookie expiry in seconds
  });
}

/**
 * Validate scan session from cookie
 * Returns session payload if valid, null otherwise
 */
export async function validateScanSession(): Promise<ScanSessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  const payload = verifyAndDecode(cookie.value);
  if (!payload) {
    return null;
  }

  // Check expiry
  if (Date.now() > payload.expiresAt) {
    return null;
  }

  return payload;
}

/**
 * Clear scan session (logout)
 */
export async function clearScanSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get scan session for API routes
 * Returns the validated session or null
 * Use this in API routes that need to accept both session and scan-session auth
 */
export async function getScanSessionForApi(): Promise<{
  userId: string;
  organizationId: string;
  slug: string;
} | null> {
  const session = await validateScanSession();
  if (!session) return null;

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    slug: session.slug,
  };
}
