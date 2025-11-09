/**
 * Test Auth Bypass Route
 *
 * ⚠️ DEV-ONLY ENDPOINT FOR AUTOMATED TESTING
 *
 * This route allows Playwright and other E2E tests to bypass authentication
 * by using Better Auth's anonymous authentication plugin.
 *
 * How it works:
 * - Uses Better Auth's anonymous plugin to create properly signed session tokens
 * - Anonymous plugin creates real sessions without requiring credentials
 * - Tokens are cryptographically signed and validated by Better Auth
 *
 * Security:
 * - ONLY works in development mode (NODE_ENV === 'development')
 * - Returns 404 in production to prevent security risks
 * - Anonymous plugin is only enabled in development (see lib/auth.ts)
 *
 * Usage (Playwright):
 * ```typescript
 * // Navigate to bypass route - cookie is automatically set and redirects
 * await page.goto('http://localhost:3000/api/test/auth/bypass');
 *
 * // Now authenticated and can access protected routes
 * // Default redirect: /church/test-org/admin/connect-cards
 *
 * // Or specify custom redirect:
 * await page.goto('http://localhost:3000/api/test/auth/bypass?redirect=/custom/path');
 * ```
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    // Get redirect URL from query params (optional)
    const { searchParams, origin } = new URL(request.url);
    const redirectTo =
      searchParams.get("redirect") || "/church/test-org/admin/connect-cards";

    console.log("🔐 Creating anonymous test session...");

    // Use Better Auth's anonymous sign-in to create a properly signed session
    // This calls the /sign-in/anonymous endpoint provided by the anonymous plugin
    const authResponse = await fetch(`${origin}/api/auth/sign-in/anonymous`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // Send empty JSON object
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error("❌ Anonymous sign-in failed:", {
        status: authResponse.status,
        statusText: authResponse.statusText,
        error,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create anonymous session",
          status: authResponse.status,
          statusText: authResponse.statusText,
          details: error || "No error details returned",
          endpoint: `${origin}/api/auth/sign-in/anonymous`,
          help: "Make sure the anonymous plugin is enabled in lib/auth.ts (dev mode only)",
        },
        { status: 500 }
      );
    }

    // Extract session cookie from auth response
    const setCookieHeader = authResponse.headers.get("set-cookie");

    if (!setCookieHeader) {
      console.error("❌ No session cookie returned from anonymous sign-in");
      return NextResponse.json(
        {
          success: false,
          error: "No session cookie in auth response",
        },
        { status: 500 }
      );
    }

    const sessionData = await authResponse.json();

    console.log("✅ Anonymous session created:", {
      userId: sessionData.user?.id,
      hasSession: !!sessionData.session,
    });

    // Create redirect response
    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    // Forward the session cookie from Better Auth
    // Parse cookie to extract token value and attributes
    const cookieMatch = setCookieHeader.match(
      /better-auth\.session_token=([^;]+)/
    );

    if (cookieMatch) {
      const tokenValue = cookieMatch[1];

      response.cookies.set("better-auth.session_token", tokenValue, {
        httpOnly: true,
        secure: false, // localhost uses HTTP
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      console.log("✅ Session cookie set, redirecting to:", redirectTo);
    } else {
      console.error("❌ Could not parse session token from cookie");
    }

    return response;
  } catch (error) {
    console.error("❌ Test auth bypass failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
