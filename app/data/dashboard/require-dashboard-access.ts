/**
 * Universal Dashboard Access Control
 *
 * Handles access for all three tiers of users:
 * 1. Platform admins - can access any organization's dashboard
 * 2. Church admins - can access their own organization's dashboard
 * 3. End users (church staff) - can access their assigned organization's dashboard
 *
 * All users see the same UI, but data is scoped based on their role.
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

  // Get full user details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      organizationId: true,
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

  // Church owners and admins
  if (member.role === "owner" || member.role === "admin") {
    const dataScope: AgencyScope = {
      type: "agency",
      organizationId: organization.id,
      filters: {
        canSeeAllOrganizations: false,
        canEditData: true,
        canDeleteData: true,
        canExportData: true,
        canManageUsers: member.role === "owner",
      },
    };

    return { session, organization, dataScope, member };
  }

  // Church staff and volunteers

  // End users - using "member" role (church members/volunteers)
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
      },
    };

    return { session, organization, dataScope, member };
  }

  // Check subscription status for all users
  const activeStatuses = ["ACTIVE", "TRIAL"];
  if (
    !organization.subscriptionStatus ||
    !activeStatuses.includes(organization.subscriptionStatus)
  ) {
    return redirect(`/church/${slug}/subscription-expired`);
  }

  // Unknown role
  return redirect("/unauthorized");
});
