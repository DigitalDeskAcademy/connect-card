import "server-only";

import { prisma } from "@/lib/db";

/**
 * Get Organization Locations
 *
 * Fetches all active locations/campuses for an organization
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @returns Array of active locations
 */
export async function getOrganizationLocations(organizationId: string) {
  return await prisma.location.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
