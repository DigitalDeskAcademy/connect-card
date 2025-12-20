import "server-only";

import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import { prisma } from "@/lib/db";
import { getLocationFilter } from "./location-filter";
import type {
  VolunteerStatus,
  VolunteerCategoryType,
} from "@/lib/generated/prisma";

/**
 * Get Volunteers for Organization
 *
 * Fetches volunteers with location-based filtering applied per user's DataScope.
 * Includes related church member data, categories, and skills.
 * NOTE: Shift scheduling moved to Planning Center (Dec 2025)
 *
 * @param dataScope - User's data scope (includes organizationId and location permissions)
 * @param filters - Optional filters (status, search, location)
 * @returns Array of volunteers with related data
 */
export async function getVolunteersForScope(
  dataScope: DataScope,
  filters?: {
    status?: VolunteerStatus[];
    search?: string;
    locationId?: string;
  }
) {
  const where = {
    organizationId: dataScope.organizationId,
    ...getLocationFilter(dataScope), // Apply location-based filtering
    ...(filters?.status && { status: { in: filters.status } }),
    ...(filters?.locationId && { locationId: filters.locationId }),
    ...(filters?.search && {
      churchMember: {
        name: {
          contains: filters.search,
          mode: "insensitive" as const,
        },
      },
    }),
  };

  return await prisma.volunteer.findMany({
    where,
    include: {
      churchMember: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      categories: {
        select: {
          id: true,
          category: true,
        },
        orderBy: {
          category: "asc",
        },
      },
      skills: {
        select: {
          id: true,
          skillName: true,
          proficiency: true,
          isVerified: true,
          expiryDate: true,
        },
        orderBy: {
          skillName: "asc",
        },
      },
      // REMOVED: availability, shifts (Dec 2025) - Shift scheduling moved to Planning Center
    },
    orderBy: [
      { status: "asc" }, // ACTIVE volunteers first
      { churchMember: { name: "asc" } },
    ],
    take: 200, // Limit for memory safety - most churches have <200 volunteers
  });
}

/**
 * Get Single Volunteer by ID
 *
 * Fetches detailed volunteer information with related data.
 * NOTE: Shift scheduling moved to Planning Center (Dec 2025)
 *
 * @param dataScope - User's data scope
 * @param volunteerId - Volunteer ID
 * @returns Volunteer with full details or null if not found
 */
export async function getVolunteerById(
  dataScope: DataScope,
  volunteerId: string
) {
  return await prisma.volunteer.findFirst({
    where: {
      id: volunteerId,
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
    },
    include: {
      churchMember: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      skills: {
        orderBy: {
          skillName: "asc",
        },
      },
      categories: {
        select: {
          id: true,
          category: true,
        },
        orderBy: {
          category: "asc",
        },
      },
      // REMOVED: availability, shifts (Dec 2025) - Shift scheduling moved to Planning Center
    },
  });
}

/**
 * Get Volunteers Needing Background Checks
 *
 * Returns volunteers with expired or missing background checks.
 * NOTE: Shift-based detection removed (Dec 2025) - now checks by volunteer categories
 *
 * @param organizationId - Organization ID
 * @returns Array of volunteers needing attention
 */
export async function getVolunteersNeedingBackgroundCheck(
  organizationId: string
) {
  const today = new Date();

  return await prisma.volunteer.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      OR: [
        {
          // No background check at all for volunteers in kids categories
          backgroundCheckStatus: "NOT_STARTED",
          categories: {
            some: {
              category: {
                in: ["KIDS_MINISTRY"],
              },
            },
          },
        },
        {
          // Expired background check
          backgroundCheckStatus: "CLEARED",
          backgroundCheckExpiry: {
            lt: today,
          },
        },
      ],
    },
    include: {
      churchMember: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      categories: {
        select: {
          category: true,
        },
      },
      // REMOVED: shifts (Dec 2025) - Shift scheduling moved to Planning Center
    },
    orderBy: {
      backgroundCheckExpiry: "asc", // Most urgent first
    },
    take: 50, // Limit for dashboard view - shows most urgent cases
  });
}

/**
 * Get Volunteer Statistics
 *
 * Returns aggregate statistics for volunteer management dashboard.
 * NOTE: Shift statistics removed (Dec 2025) - Shift scheduling moved to Planning Center
 *
 * @param organizationId - Organization ID
 * @param locationId - Optional location filter
 * @returns Statistics object
 */
export async function getVolunteerStats(
  organizationId: string,
  locationId?: string
) {
  const where = {
    organizationId,
    ...(locationId && { locationId }),
  };

  const [totalVolunteers, activeVolunteers, inactiveVolunteers, pendingReview] =
    await Promise.all([
      // Total volunteers
      prisma.volunteer.count({ where }),

      // Active volunteers
      prisma.volunteer.count({
        where: { ...where, status: "ACTIVE" },
      }),

      // Inactive volunteers
      prisma.volunteer.count({
        where: { ...where, status: "INACTIVE" },
      }),

      // Pending BG check review
      prisma.volunteer.count({
        where: {
          ...where,
          backgroundCheckStatus: "PENDING_REVIEW",
        },
      }),
    ]);

  return {
    totalVolunteers,
    activeVolunteers,
    inactiveVolunteers,
    pendingReview,
    // REMOVED: scheduledShiftsThisMonth, needingBackgroundCheck (Dec 2025)
  };
}

// REMOVED: getAvailableVolunteersForShift (Dec 2025)
// Shift scheduling moved to Planning Center. This function referenced:
// - requiredSkills (ServingOpportunitySkill model - removed)
// - availability (VolunteerAvailability model - removed)
// - shifts (VolunteerShift model - removed)
// If needed in future, implement via Planning Center API integration.

// ============================================================================
// VOLUNTEER EXPORT FUNCTIONS
// ============================================================================

/**
 * Exportable volunteer type for ChMS export
 * Used by integrations worktree to build CSV exports
 */
export type ExportableVolunteer = {
  id: string;
  category: string;
  backgroundCheckStatus: string;
  readyForExport: boolean;
  readyForExportDate: Date | null;
  exportedAt: Date | null;
  documentsSentAt: Date | null;
  // From churchMember relation
  name: string;
  email: string | null;
  phone: string | null;
  location: { name: string } | null;
};

/**
 * Get Exportable Volunteers
 *
 * Returns volunteers that are ready for export to ChMS.
 * Used by the integrations worktree to populate the Volunteers export tab.
 *
 * @param organizationId - Organization ID
 * @param filters - Optional filters
 * @returns Array of exportable volunteers
 */
export async function getExportableVolunteers(
  organizationId: string,
  filters?: {
    locationId?: string;
    category?: VolunteerCategoryType;
    onlyNew?: boolean; // Not yet exported (exportedAt is null)
  }
): Promise<ExportableVolunteer[]> {
  const volunteers = await prisma.volunteer.findMany({
    where: {
      organizationId,
      readyForExport: true,
      ...(filters?.locationId && { locationId: filters.locationId }),
      ...(filters?.onlyNew && { exportedAt: null }),
    },
    include: {
      churchMember: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      categories: {
        where: filters?.category ? { category: filters.category } : undefined,
        select: {
          category: true,
        },
        orderBy: {
          category: "asc",
        },
      },
    },
    orderBy: [
      { readyForExportDate: "desc" },
      { churchMember: { name: "asc" } },
    ],
    take: 500, // Limit for memory safety
  });

  // Filter out volunteers that don't have the requested category (if filtering by category)
  const filtered = filters?.category
    ? volunteers.filter(v => v.categories.length > 0)
    : volunteers;

  // Get location info separately to avoid N+1
  const locationIds = [
    ...new Set(filtered.map(v => v.locationId).filter(Boolean)),
  ] as string[];
  const locations = locationIds.length
    ? await prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, name: true },
      })
    : [];
  const locationMap = new Map(locations.map(l => [l.id, l]));

  return filtered.map(v => ({
    id: v.id,
    category: v.categories.map(c => c.category).join(", ") || "GENERAL",
    backgroundCheckStatus: v.backgroundCheckStatus,
    readyForExport: v.readyForExport,
    readyForExportDate: v.readyForExportDate,
    exportedAt: v.exportedAt,
    documentsSentAt: v.documentsSentAt,
    name: v.churchMember.name,
    email: v.churchMember.email,
    phone: v.churchMember.phone,
    location: v.locationId ? (locationMap.get(v.locationId) ?? null) : null,
  }));
}

/**
 * Get Exportable Volunteers Count
 *
 * Returns count of volunteers ready for export (for sync status display).
 *
 * @param organizationId - Organization ID
 * @param onlyNew - Only count not-yet-exported volunteers
 * @returns Count of exportable volunteers
 */
export async function getExportableVolunteersCount(
  organizationId: string,
  onlyNew: boolean = true
): Promise<number> {
  return await prisma.volunteer.count({
    where: {
      organizationId,
      readyForExport: true,
      ...(onlyNew && { exportedAt: null }),
    },
  });
}

/**
 * Mark Volunteers as Exported
 *
 * Updates exportedAt timestamp for volunteers that were included in an export.
 * Called by integrations worktree after successful CSV generation.
 *
 * @param volunteerIds - Array of volunteer IDs to mark as exported
 * @returns Number of volunteers updated
 */
export async function markVolunteersExported(
  volunteerIds: string[]
): Promise<number> {
  if (volunteerIds.length === 0) return 0;

  const result = await prisma.volunteer.updateMany({
    where: {
      id: { in: volunteerIds },
    },
    data: {
      exportedAt: new Date(),
    },
  });

  return result.count;
}
