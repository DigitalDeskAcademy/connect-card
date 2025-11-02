/**
 * Church Admin Authentication & Authorization Guard
 *
 * Provides enterprise-grade multi-tenant security using Better Auth's organization plugin:
 * 1. Organization validation (exists and active)
 * 2. Session and active organization verification
 * 3. Member role-based access control
 * 4. Subscription status validation
 *
 * Security Model:
 * - Validates organization exists and is active
 * - Verifies session has activeOrganizationId matching the requested org
 * - Checks user's member role in the organization
 * - Validates subscription status
 * - Returns session, organization, and member data for context
 */

import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { cache } from "react";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { prisma } from "@/lib/db";

/**
 * Cached church admin authentication and authorization guard
 *
 * Uses Better Auth's organization plugin for proper multi-tenant isolation.
 * Results are cached per request to avoid redundant lookups.
 *
 * @param slug - Organization slug from URL
 * @returns Promise with session, organization, and member data
 * @throws Redirects if any validation fails
 */
export const requireChurchAdmin = cache(async (slug: string) => {
  // Layer 1: Validate organization exists
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound(); // Return 404 if organization doesn't exist
  }

  // Layer 2: Get and validate session with activeOrganizationId
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to church-specific login if not authenticated
  if (!session) {
    return redirect(`/church/${slug}/login`);
  }

  // Layer 3: Check if user has an active organization set
  // The activeOrganizationId is managed by Better Auth's organization plugin
  if (!session.session.activeOrganizationId) {
    // User needs to set an active organization
    // This can happen when a user belongs to multiple organizations
    // Try to set the requested organization as active if user is a member
    const member = await prisma.member.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organization.id,
        },
      },
    });

    if (!member) {
      // User is not a member of this organization
      return redirect("/unauthorized");
    }

    // Set the organization as active for future requests
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationId: organization.id,
      },
    });
  } else if (session.session.activeOrganizationId !== organization.id) {
    // User has a different organization active
    // Cross-tenant access attempt detected
    return redirect("/unauthorized");
  }

  // Layer 4: Get member data and validate admin role
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

  // Check if user has admin or owner role in the organization
  const allowedRoles = ["owner", "admin"];
  if (!allowedRoles.includes(member.role)) {
    // Redirect non-admin users to their learning portal
    return redirect(`/church/${slug}/learning`);
  }

  // Layer 5: Check subscription status
  const activeStatuses = ["ACTIVE", "TRIAL"];
  if (
    !organization.subscriptionStatus ||
    !activeStatuses.includes(organization.subscriptionStatus)
  ) {
    return redirect(`/church/${slug}/subscription-expired`);
  }

  // Return session, organization, and member data for use in components
  return {
    session,
    organization,
    member,
  };
});

/**
 * Check if user is church owner specifically
 * Used for sensitive operations like billing management
 */
export const requireChurchOwner = cache(async (slug: string) => {
  const { session, organization, member } = await requireChurchAdmin(slug);

  if (member.role !== "owner") {
    return redirect(`/church/${slug}/admin`);
  }

  return { session, organization, member };
});
