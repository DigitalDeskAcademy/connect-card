/**
 * Universal Dashboard Access Control
 *
 * Handles access for all user tiers with granular location-based permissions:
 * 1. Platform admins - can access any organization's dashboard, all locations
 * 2. Church admins - can access their own organization's dashboard
 *    - Multi-campus admins: see all locations (canSeeAllLocations = true)
 *    - Campus admins: see only their assigned location (canSeeAllLocations = false, default)
 * 3. Church staff - can access their assigned organization's dashboard, restricted to their location
 *
 * All users see the same UI, but data is scoped based on their role and location permissions.
 *
 * Location Access Model:
 * - Platform Admin: sees all organizations, all locations
 * - Account Owner (church_owner): always sees all locations in their org (non-negotiable)
 * - Multi-Campus Admin (church_admin + canSeeAllLocations): sees all locations in their org
 * - Campus Admin (church_admin): sees ONLY their assigned location
 * - Staff (user): sees ONLY their assigned location (dataScope.filters.locationId)
 *
 * The canSeeAllLocations flag allows churches to selectively grant multi-campus access
 * to specific admins (typically 1-2 people) while keeping most admins campus-specific.
 */

import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { cache } from "react";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { prisma } from "@/lib/db";
import type { DataScope, PlatformScope, AgencyScope } from "./data-scope-types";

// Re-export types and type guards for convenience
export type { DataScope, PlatformScope, AgencyScope };
export { isPlatformScope, isAgencyScope } from "./data-scope-types";

/**
 * Universal dashboard access control
 *
 * @param slug - Organization slug from URL
 * @returns Session, organization, and data scope for the user
 */
export const requireDashboardAccess = cache(async (slug: string) => {
  // Get the organization
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound();
  }

  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect(`/church/${slug}/login`);
  }

  // Get full user details including location assignment and permissions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      organizationId: true,
      defaultLocationId: true,
      canSeeAllLocations: true,
    },
  });

  if (!user) {
    return redirect(`/church/${slug}/login`);
  }

  const userRole = user.role;

  // Platform admins can access any organization
  if (userRole === "platform_admin") {
    const dataScope: PlatformScope = {
      type: "platform",
      organizationId: organization.id,
      filters: {
        canSeeAllOrganizations: true,
        canEditData: true,
        canDeleteData: true,
        canExportData: true,
        canManageUsers: true,
        canSeeAllLocations: true, // Platform admins see everything
        locationId: null, // No location restriction
      },
    };

    return { session, organization, dataScope, member: null };
  }

  // For church admins and end users, check membership
  const member = await prisma.member.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: organization.id,
      },
    },
    select: {
      role: true,
    },
  });

  if (!member) {
    // User is not a member of this organization
    return redirect("/unauthorized");
  }

  // CRITICAL: Check subscription status BEFORE granting any access
  // This prevents churches with expired subscriptions from using the platform
  const activeStatuses = ["ACTIVE", "TRIAL"];
  if (
    !organization.subscriptionStatus ||
    !activeStatuses.includes(organization.subscriptionStatus)
  ) {
    return redirect(`/church/${slug}/subscription-expired`);
  }

  // Account Owner (church_owner) - sees all locations
  if (member.role === "owner") {
    const dataScope: AgencyScope = {
      type: "agency",
      organizationId: organization.id,
      filters: {
        canSeeAllOrganizations: false,
        canEditData: true,
        canDeleteData: true,
        canExportData: true,
        canManageUsers: true,
        canSeeAllLocations: true, // Owner sees all locations
        locationId: null, // No location restriction
      },
    };

    return { session, organization, dataScope, member };
  }

  // Admin (church_admin) - may be multi-campus or campus-specific
  if (member.role === "admin") {
    // Check if this admin has multi-campus access permission
    const hasMultiCampusAccess = user.canSeeAllLocations;

    const dataScope: AgencyScope = {
      type: "agency",
      organizationId: organization.id,
      filters: {
        canSeeAllOrganizations: false,
        canEditData: true,
        canDeleteData: true,
        canExportData: true,
        canManageUsers: true, // Admins can manage users (assign roles, locations, volunteer categories)
        canSeeAllLocations: hasMultiCampusAccess, // Based on permission flag
        locationId: hasMultiCampusAccess ? null : user.defaultLocationId, // Restricted if campus-specific
      },
    };

    return { session, organization, dataScope, member };
  }

  // Staff (member) - location-restricted access
  if (member.role === "member") {
    const dataScope: AgencyScope = {
      type: "agency",
      organizationId: organization.id,
      filters: {
        canSeeAllOrganizations: false,
        canEditData: true,
        canDeleteData: false,
        canExportData: true,
        canManageUsers: false,
        canSeeAllLocations: false, // Staff only see their location
        locationId: user.defaultLocationId, // Restricted to assigned location
      },
    };

    return { session, organization, dataScope, member };
  }

  // Unknown role - should not reach here if member exists with valid role
  return redirect("/unauthorized");
});
