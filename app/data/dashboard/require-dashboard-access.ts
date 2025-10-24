/**
 * Universal Dashboard Access Control
 *
 * Handles access for all three tiers of users:
 * 1. Platform admins - can access any organization's dashboard
 * 2. Agency admins - can access their own organization's dashboard
 * 3. End users (clinics) - can access their assigned organization's dashboard
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
import type {
  DataScope,
  PlatformScope,
  AgencyScope,
  ClinicScope,
} from "./data-scope-types";

// Re-export types and type guards for convenience
export type { DataScope, PlatformScope, AgencyScope, ClinicScope };
export {
  isPlatformScope,
  isAgencyScope,
  isClinicScope,
} from "./data-scope-types";

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
    return redirect(`/agency/${slug}/login`);
  }

  // Get full user details including clinicId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      clinicId: true,
      organizationId: true,
    },
  });

  if (!user) {
    return redirect(`/agency/${slug}/login`);
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

  // For agency admins and end users, check membership
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

  // Agency owners and admins
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

  // Clinic admins and staff
  if (userRole === "clinic_admin" || userRole === "clinic_staff") {
    // Ensure user has a clinicId
    if (!user.clinicId) {
      console.error("Clinic user without clinicId:", session.user.id);
      return redirect("/unauthorized");
    }

    // Verify the clinic belongs to this organization
    const clinic = await prisma.contact.findFirst({
      where: {
        id: user.clinicId,
        organizationId: organization.id,
        contactType: "CLINIC",
      },
    });

    if (!clinic) {
      return redirect("/unauthorized");
    }

    const dataScope: ClinicScope = {
      type: "clinic",
      organizationId: organization.id,
      clinicId: user.clinicId,
      filters: {
        canSeeAllOrganizations: false,
        canEditData: userRole === "clinic_admin",
        canDeleteData: userRole === "clinic_admin",
        canExportData: true,
        canManageUsers: userRole === "clinic_admin",
      },
    };

    return { session, organization, dataScope, member };
  }

  // End users (clinics) - using "member" role (backward compatibility)
  if (member.role === "member") {
    // For backward compatibility, allow missing clinicId
    // but require it for new clinic scope
    if (!user.clinicId) {
      console.warn("Member role user without clinicId:", session.user.id);
      // Create an agency scope as fallback for backward compatibility
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

    const dataScope: ClinicScope = {
      type: "clinic",
      organizationId: organization.id,
      clinicId: user.clinicId,
      filters: {
        canSeeAllOrganizations: false,
        canEditData: true, // Can edit their own data
        canDeleteData: false, // Cannot delete
        canExportData: true, // Can export their own data
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
    return redirect(`/agency/${slug}/subscription-expired`);
  }

  // Unknown role
  return redirect("/unauthorized");
});
