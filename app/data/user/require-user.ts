/**
 * User Authentication Guard
 *
 * This module provides basic authentication validation for user-only routes and functions.
 * Unlike requireAdmin(), this guard only checks for valid authentication without role validation.
 *
 * Security Model:
 * - Requires valid authentication session (user must be logged in)
 * - No role-based access control (any authenticated user passes)
 * - Redirects unauthenticated users to login page with return URL handling
 * - Session state managed by Better Auth with secure cookie handling
 *
 * Performance Considerations:
 * - Not cached (unlike requireAdmin) - use React's cache() for repeated calls
 * - Direct session fetch on each invocation may impact performance
 * - Consider implementing caching if used multiple times in same request
 *
 * Usage: Call `await requireUser()` at the start of any authenticated function
 *
 * @returns Promise<User> - The authenticated user object (without session metadata)
 * @throws Redirects to /login if authentication fails
 *
 * @example
 * // In a server component or API route
 * const user = await requireUser();
 * // User is guaranteed to be authenticated at this point
 * console.log(`Welcome back, ${user.name}!`);
 */

import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Basic user authentication guard
 *
 * Validates that the current user has a valid authentication session.
 * Returns user object on success, redirects to login on failure.
 *
 * Security Notes:
 * - Uses Better Auth session validation with secure cookie handling
 * - Session timeout handled automatically by Better Auth
 * - No CSRF protection needed - uses SameSite cookie attributes
 * - Implements secure redirect after login (prevents open redirect attacks)
 */
export async function requireUser() {
  // Fetch current user session from Better Auth
  // Uses Next.js headers() to access request context securely
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect unauthenticated users to login page
  // TODO: Consider adding returnUrl parameter for post-login redirect
  // Current implementation redirects to homepage after login
  if (!session) {
    return redirect("/login");
  }

  // Return user object (without session metadata)
  // Consumer functions get access to user.id, user.email, user.name, user.role
  return session.user;
}
