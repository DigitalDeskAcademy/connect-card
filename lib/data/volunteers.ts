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
 * Includes related church member data, skills, availability, and shift counts.
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
      availability: {
        select: {
          id: true,
          availabilityType: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          startDate: true,
          endDate: true,
          isAvailable: true,
        },
        orderBy: [{ availabilityType: "asc" }, { dayOfWeek: "asc" }],
      },
      _count: {
        select: {
          shifts: {
            where: {
              status: {
                notIn: ["CANCELLED", "NO_SHOW"],
              },
            },
          },
        },
      },
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
 * Fetches detailed volunteer information with all related data.
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
      availability: {
        orderBy: [
          { availabilityType: "asc" },
          { dayOfWeek: "asc" },
          { startDate: "desc" },
        ],
      },
      shifts: {
        include: {
          servingOpportunity: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: {
          shiftDate: "desc",
        },
        take: 20, // Recent shifts only for detail view
      },
    },
  });
}

/**
 * Get Volunteers Needing Background Checks
 *
 * Returns volunteers with expired or missing background checks who are
 * scheduled for kids ministry or other sensitive roles.
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
          // No background check at all
          backgroundCheckStatus: "NOT_STARTED",
          shifts: {
            some: {
              servingOpportunity: {
                category: {
                  in: ["Kids Ministry", "Children", "Youth", "Nursery"],
                },
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
      shifts: {
        where: {
          shiftDate: {
            gte: today,
          },
          status: {
            in: ["SCHEDULED", "CONFIRMED"],
          },
        },
        include: {
          servingOpportunity: {
            select: {
              name: true,
              category: true,
            },
          },
        },
        orderBy: {
          shiftDate: "asc",
        },
        take: 5, // Upcoming shifts
      },
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

  const [
    totalVolunteers,
    activeVolunteers,
    inactiveVolunteers,
    needingBackgroundCheck,
    scheduledShiftsThisMonth,
  ] = await Promise.all([
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

    // Volunteers needing background checks
    prisma.volunteer.count({
      where: {
        ...where,
        status: "ACTIVE",
        OR: [
          { backgroundCheckStatus: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
          {
            backgroundCheckStatus: "CLEARED",
            backgroundCheckExpiry: { lt: new Date() },
          },
        ],
      },
    }),

    // Shifts scheduled this month
    prisma.volunteerShift.count({
      where: {
        organizationId,
        ...(locationId && { locationId }),
        shiftDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"],
        },
      },
    }),
  ]);

  return {
    totalVolunteers,
    activeVolunteers,
    inactiveVolunteers,
    needingBackgroundCheck,
    scheduledShiftsThisMonth,
  };
}

/**
 * Get Available Volunteers for Opportunity
 *
 * Returns volunteers who:
 * - Are ACTIVE
 * - Have required skills for the opportunity
 * - Have valid background check (if needed)
 * - Don't have time conflicts on the shift date
 * - Aren't on blackout for the date
 *
 * @param organizationId - Organization ID
 * @param servingOpportunityId - Serving opportunity ID
 * @param shiftDate - Date of the shift
 * @param startTime - Start time (HH:MM format)
 * @param endTime - End time (HH:MM format)
 * @returns Array of available volunteers
 */
export async function getAvailableVolunteersForShift(
  organizationId: string,
  servingOpportunityId: string,
  shiftDate: Date,
  startTime: string,
  endTime: string
) {
  // Get opportunity with required skills
  const opportunity = await prisma.servingOpportunity.findFirst({
    where: {
      id: servingOpportunityId,
      organizationId,
    },
    include: {
      requiredSkills: true,
    },
  });

  if (!opportunity) return [];

  const kidsMinistryCategories = [
    "Kids Ministry",
    "Children",
    "Youth",
    "Nursery",
  ];
  const requiresBackgroundCheck =
    opportunity.category &&
    kidsMinistryCategories.some(cat => opportunity.category?.includes(cat));

  // Get active volunteers with limit for memory safety
  const volunteers = await prisma.volunteer.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      // Background check filter (if required)
      ...(requiresBackgroundCheck && {
        backgroundCheckStatus: "CLEARED",
        OR: [
          { backgroundCheckExpiry: null },
          { backgroundCheckExpiry: { gte: new Date() } },
        ],
      }),
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
      skills: {
        select: {
          skillName: true,
          proficiency: true,
        },
      },
      availability: true,
      shifts: {
        where: {
          shiftDate,
          status: {
            notIn: ["CANCELLED", "NO_SHOW"],
          },
        },
      },
    },
    take: 200, // Limit candidates - filter further in memory
  });

  // Filter volunteers based on requirements
  return volunteers.filter(volunteer => {
    // Check for time conflicts
    const hasTimeConflict = volunteer.shifts.some(shift => {
      const shiftStart = shift.startTime;
      const shiftEnd = shift.endTime;

      // Time overlap logic
      return (
        (startTime >= shiftStart && startTime < shiftEnd) || // New shift starts during existing
        (endTime > shiftStart && endTime <= shiftEnd) || // New shift ends during existing
        (startTime <= shiftStart && endTime >= shiftEnd) // New shift contains existing
      );
    });

    if (hasTimeConflict) return false;

    // Check blackout dates
    const isBlackedOut = volunteer.availability.some(avail => {
      return (
        avail.availabilityType === "BLACKOUT" &&
        !avail.isAvailable &&
        avail.startDate &&
        avail.startDate <= shiftDate &&
        (avail.endDate === null || avail.endDate >= shiftDate)
      );
    });

    if (isBlackedOut) return false;

    // Check required skills
    const requiredSkills = opportunity.requiredSkills.filter(s => s.isRequired);
    if (requiredSkills.length > 0) {
      const volunteerSkillNames = volunteer.skills.map(s => s.skillName);
      const hasAllRequiredSkills = requiredSkills.every(reqSkill =>
        volunteerSkillNames.includes(reqSkill.skillName)
      );
      if (!hasAllRequiredSkills) return false;
    }

    return true;
  });
}

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
