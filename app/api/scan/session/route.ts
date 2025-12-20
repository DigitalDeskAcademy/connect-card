/**
 * Scan Session API - Cookie Creation for Phone QR Scanning
 *
 * Creates a scan session cookie after token validation.
 * This is needed because Server Components cannot modify cookies in Next.js 15.
 *
 * Flow:
 * 1. Scan page validates token and renders UI
 * 2. Client component calls this API to establish session cookie
 * 3. Cookie enables subsequent API calls (S3 uploads, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";

const COOKIE_NAME = "scan_session";
const SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function getSigningKey(): string {
  const key = process.env.BETTER_AUTH_SECRET;
  if (!key) {
    throw new Error("BETTER_AUTH_SECRET not configured");
  }
  return key;
}

interface ScanSessionPayload {
  userId: string;
  organizationId: string;
  slug: string;
  expiresAt: number;
}

function signPayload(payload: ScanSessionPayload): string {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", getSigningKey())
    .update(data)
    .digest("hex");
  return `${Buffer.from(data).toString("base64")}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { token, slug } = await request.json();

    if (!token || !slug) {
      return NextResponse.json(
        { error: "Missing token or slug" },
        { status: 400 }
      );
    }

    // Validate token against database
    const scanToken = await prisma.scanToken.findUnique({
      where: { token },
      include: {
        organization: { select: { id: true, slug: true } },
      },
    });

    if (!scanToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (scanToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    if (scanToken.organization.slug !== slug) {
      return NextResponse.json(
        { error: "Organization mismatch" },
        { status: 401 }
      );
    }

    // Create signed session payload
    const payload: ScanSessionPayload = {
      userId: scanToken.userId,
      organizationId: scanToken.organizationId,
      slug,
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
    };

    const signed = signPayload(payload);

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_EXPIRY_MS / 1000,
    });

    return response;
  } catch (error) {
    console.error("Scan session error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
