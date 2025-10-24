/**
 * Navigation Hook
 *
 * Provides context-aware navigation URLs based on user role and organization context.
 * This ensures that navigation links always point to the correct admin area without
 * hardcoding URLs in components.
 *
 * Uses the existing OrganizationContext to determine if user is in agency context,
 * and auth session to determine user role for platform admins.
 *
 * Pattern followed:
 * - Agency admins: /agency/[slug]/admin/*
 * - Platform admins: /platform/admin/*
 * - Regular users: Public routes
 * - All users: /home for smart routing
 */

import { useOrganizationSafe } from "@/app/providers/organization-context";
import { authClient } from "@/lib/auth-client";

export function useNavigation() {
  // Get organization context (will be null outside agency routes)
  const organization = useOrganizationSafe();

  // Get current user session for role detection
  const { data: session } = authClient.useSession();

  // Smart routing - always use /home for role-based redirect
  // This route automatically redirects users to their appropriate dashboard
  const homeUrl = "/home";

  // Context-aware dashboard URL
  // Priority: Agency context > Platform admin > Default dashboard
  const dashboardUrl = organization
    ? `/agency/${organization.slug}/admin`
    : session?.user?.role === "platform_admin"
      ? "/platform/admin"
      : "/dashboard";

  // Context-aware courses URL
  // Agency admins see their courses, platform admins see all courses
  const coursesUrl = organization
    ? `/agency/${organization.slug}/admin/courses`
    : session?.user?.role === "platform_admin"
      ? "/platform/admin/courses"
      : "/courses";

  // Context-aware analytics URL
  const analyticsUrl = organization
    ? `/agency/${organization.slug}/admin/analytics`
    : session?.user?.role === "platform_admin"
      ? "/platform/admin/analytics"
      : null;

  // Context-aware users URL
  const usersUrl = organization
    ? `/agency/${organization.slug}/admin/users`
    : session?.user?.role === "platform_admin"
      ? "/platform/admin/users"
      : null;

  // Context-aware profile URL
  const profileUrl = organization
    ? `/agency/${organization.slug}/admin/profile`
    : session?.user?.role === "platform_admin"
      ? "/platform/admin/profile"
      : "/profile";

  // Role checks for conditional rendering
  const isAdmin =
    session?.user?.role === "platform_admin" ||
    session?.user?.role === "agency_admin" ||
    session?.user?.role === "agency_owner";

  const isPlatformAdmin = session?.user?.role === "platform_admin";

  const isAgencyAdmin =
    session?.user?.role === "agency_admin" ||
    session?.user?.role === "agency_owner";

  return {
    // URLs
    homeUrl,
    dashboardUrl,
    coursesUrl,
    analyticsUrl,
    usersUrl,
    profileUrl,

    // Role flags
    isAdmin,
    isPlatformAdmin,
    isAgencyAdmin,

    // Context data
    organization,
    session,
  };
}
