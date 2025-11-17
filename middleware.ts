import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import arcjet, { createMiddleware, detectBot, fixedWindow } from "@arcjet/next";
import { isValidSlug } from "./lib/tenant-utils";

// Configure Arcjet with bot detection and rate limiting
const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  rules: [
    // Bot detection - block malicious bots, allow legitimate crawlers
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, DuckDuckGo
        "CATEGORY:MONITOR", // Uptime monitoring services
        "CATEGORY:PREVIEW", // Link previews (Slack, Discord, etc.)
        "STRIPE_WEBHOOK", // Stripe webhook requests
      ],
    }),
    // Rate limiting - prevent API abuse on church admin routes
    // Middleware auto-tracks by IP address (no manual characteristics needed)
    fixedWindow({
      mode: "LIVE",
      window: "60s", // 60 second sliding window
      max: 100, // Max 100 requests per minute per IP
    }),
  ],
});

// Your existing authentication middleware
async function authMiddleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets, but auth check only on admin routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

// Combine Arcjet with your existing middleware
export default createMiddleware(aj, async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  // Add pathname to headers for server components to access
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Extract and validate org slug if in church route
  const churchMatch = pathname.match(/^\/church\/([^\/]+)/);
  if (churchMatch) {
    const orgSlug = churchMatch[1];
    // Only add header if slug passes validation
    if (isValidSlug(orgSlug)) {
      requestHeaders.set("x-org-slug", orgSlug);
    } else {
      // Log invalid slug attempts for security monitoring
      console.warn(`Invalid organization slug attempted: ${orgSlug}`);
    }
  }

  // Apply auth middleware to all platform routes (admin and learning preview)
  if (pathname.startsWith("/platform/")) {
    return authMiddleware(request);
  }

  // For all routes, pass the modified headers to server components
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});
