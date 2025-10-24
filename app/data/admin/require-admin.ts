/**
 * Admin Authentication & Authorization Guard
 *
 * This module provides role-based access control for admin-only routes and functions.
 * Uses React's cache() to memoize session lookups within a single request for optimal performance.
 *
 * Security Model:
 * - Requires valid authentication session (user must be logged in)
 * - Requires user.role === "platform_admin" (role-based access control)
 * - Redirects unauthenticated users to login page
 * - Redirects authenticated non-admin users to not-admin page
 *
 * Performance:
 * - cache() ensures session is fetched only once per request, even if called multiple times
 * - Prevents duplicate Better Auth API calls within the same request lifecycle
 *
 * Usage: Call `await requireAdmin()` at the start of any admin function
 *
 * @returns Promise<Session> - The authenticated admin user's session
 * @throws Redirects to appropriate page if authentication/authorization fails
 */

import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Cached admin authentication and authorization guard
 *
 * Validates that the current user is authenticated and has admin role.
 * Results are cached per request to avoid redundant session lookups.
 */
export const requireAdmin = cache(async () => {
  // Fetch current user session from Better Auth
  // Uses Next.js headers() to access request context
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect unauthenticated users to login page
  // User needs to sign in before accessing admin functions
  if (!session) {
    return redirect("/login");
  }

  // Enforce role-based access control
  // Only users with 'platform_admin' role can proceed
  if (session.user.role !== "platform_admin") {
    return redirect("/not-admin");
  }

  // Return session for authenticated admin users
  // This allows consuming functions to access user data if needed
  return session;
});
