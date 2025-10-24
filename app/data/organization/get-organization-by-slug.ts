/**
 * Organization Data Access Layer
 *
 * Fetches organization data by slug for agency portal routing.
 * Used by the dynamic agency routes to load organization-specific
 * branding and configuration.
 */

import { prisma } from "@/lib/db";

/**
 * Get organization by slug
 *
 * Fetches organization details for white-label agency portals.
 * Returns null if organization doesn't exist.
 *
 * @param slug - The organization slug (e.g., "digitaldesk")
 * @returns Organization object or null
 */
export async function getOrganizationBySlug(slug: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: {
        slug: slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    return organization;
  } catch {
    // Error fetching organization - return null
    return null;
  }
}
