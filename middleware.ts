import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { isValidSlug } from "./lib/tenant-utils";

// Configure Arcjet
const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  rules: [
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:MONITOR",
        "CATEGORY:PREVIEW",
        "STRIPE_WEBHOOK",

        // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
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

  // Extract and validate org slug if in agency route
  const agencyMatch = pathname.match(/^\/agency\/([^\/]+)/);
  if (agencyMatch) {
    const orgSlug = agencyMatch[1];
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
