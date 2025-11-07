/**
 * Post-Login Redirect Handler - Smart role-based redirection
 *
 * This page handles post-authentication redirects by determining the user's
 * role and sending them to the appropriate dashboard or area.
 *
 * Flow:
 * 1. User completes authentication (OAuth or email)
 * 2. Gets redirected here instead of directly to "/"
 * 3. Server-side logic determines their role and organization
 * 4. Redirects to appropriate dashboard based on role and context
 *
 * Dashboard Routing:
 * - platform_admin → /platform/admin
 * - agency_owner/agency_admin → /church/[slug]/admin
 * - user (with org) → /church/[slug]/learning
 * - Regular users → /my-learning
 *
 * Benefits:
 * - Role-based redirect without client-side logic
 * - Works with all auth methods (OAuth, email OTP, etc.)
 * - Consistent experience regardless of auth method
 * - Multi-tenant aware routing
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export default async function AuthCallbackPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // No session, redirect to login
    redirect("/login");
  }

  // Fetch user with organization details for proper routing
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      organization: {
        select: { slug: true },
      },
    },
  });

  // Auto-promote platform admin if email matches env variable
  if (
    env.PLATFORM_ADMIN_EMAIL &&
    user?.email === env.PLATFORM_ADMIN_EMAIL &&
    user.role !== "platform_admin"
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "platform_admin" },
    });
    // Update the user object to reflect the new role
    user.role = "platform_admin";
  }

  // Check if user needs to complete organization setup
  // Platform admins don't need organizations
  if (!user?.organizationId && user?.role !== "platform_admin") {
    // New user without organization - show welcome page first
    redirect("/setup/welcome");
  }

  // For users with organizations, ensure activeOrganizationId is set
  if (user?.organizationId && !session.session?.activeOrganizationId) {
    try {
      // Set the user's organization as active in their session
      await auth.api.setActiveOrganization({
        headers: await headers(),
        body: {
          organizationId: user.organizationId,
        },
      });
    } catch {
      // Silent fail - continue with navigation
      // Better Auth will handle on next request if needed
    }
  }

  // Determine redirect based on role and organization context
  let redirectTo = "/"; // Default fallback to home page

  if (user?.role === "platform_admin") {
    // Platform administrators go to platform admin dashboard
    redirectTo = "/platform/admin";
  } else if (user?.organizationId && user.organization?.slug) {
    // Organization users - check their role within the organization
    const agencySlug = user.organization.slug;

    if (user.role === "church_owner" || user.role === "church_admin") {
      // Church administrators go to church admin dashboard
      redirectTo = `/church/${agencySlug}/admin`;
    } else if (user.role === "user") {
      // End users go to church learning dashboard
      redirectTo = `/church/${agencySlug}/learning`;
    }
  }
  // Regular platform users without organization go to /my-learning (default)

  redirect(redirectTo);
}
