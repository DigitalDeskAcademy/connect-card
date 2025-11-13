import "server-only";

import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import { prisma } from "@/lib/db";
import { getLocationFilter } from "./location-filter";

/**
 * Get Serving Opportunities for Organization
 *
 * Fetches serving opportunities with location-based filtering applied per user's DataScope.
 * Includes required skills, shift counts, and availability metrics.
 *
 * @param dataScope - User's data scope (includes organizationId and location permissions)
 * @param filters - Optional filters (isActive, category, locationId)
 * @returns Array of serving opportunities with related data
 */
export async function getServingOpportunitiesForScope(
  dataScope: DataScope,
  filters?: {
    isActive?: boolean;
    category?: string;
    locationId?: string;
  }
) {
  const where = {
    organizationId: dataScope.organizationId,
    ...getLocationFilter(dataScope), // Apply location-based filtering
    ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.locationId && { locationId: filters.locationId }),
  };

  return await prisma.servingOpportunity.findMany({
    where,
    include: {
      requiredSkills: {
        select: {
          id: true,
          skillName: true,
          isRequired: true,
        },
        orderBy: {
          skillName: "asc",
        },
      },
      _count: {
        select: {
          shifts: {
            where: {
              status: {
                in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"],
              },
            },
          },
        },
      },
    },
    orderBy: [
      { isActive: "desc" }, // Active opportunities first
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });
}

/**
 * Get Single Serving Opportunity by ID
 *
 * Fetches detailed serving opportunity information with all related data.
 *
 * @param dataScope - User's data scope
 * @param opportunityId - Serving opportunity ID
 * @returns Serving opportunity with full details or null if not found
 */
export async function getServingOpportunityById(
  dataScope: DataScope,
  opportunityId: string
) {
  return await prisma.servingOpportunity.findFirst({
    where: {
      id: opportunityId,
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
    },
    include: {
      requiredSkills: {
        include: {
          servingOpportunity: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          skillName: "asc",
        },
      },
      shifts: {
        where: {
          shiftDate: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
          },
        },
        include: {
          volunteer: {
            include: {
              churchMember: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          shiftDate: "desc",
        },
        take: 50, // Recent shifts for detail view
      },
    },
  });
}

/**
 * Get Serving Opportunities by Category
 *
 * Groups serving opportunities by category for organized display.
 *
 * @param organizationId - Organization ID
 * @param isActiveOnly - Only return active opportunities
 * @returns Map of category to opportunities
 */
export async function getServingOpportunitiesByCategory(
  organizationId: string,
  isActiveOnly = true
) {
  const opportunities = await prisma.servingOpportunity.findMany({
    where: {
      organizationId,
      ...(isActiveOnly && { isActive: true }),
    },
    include: {
      _count: {
        select: {
          requiredSkills: true,
          shifts: {
            where: {
              status: {
                in: ["SCHEDULED", "CONFIRMED"],
              },
              shiftDate: {
                gte: new Date(),
              },
            },
          },
        },
      },
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  // Group by category
  const grouped = new Map<string, typeof opportunities>();
  opportunities.forEach(opp => {
    const category = opp.category || "Other";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(opp);
  });

  return grouped;
}

/**
 * Get Serving Opportunities Needing Volunteers
 *
 * Returns opportunities with upcoming shifts that need more volunteers.
 *
 * @param organizationId - Organization ID
 * @param daysAhead - Look ahead this many days (default: 30)
 * @returns Array of opportunities with staffing needs
 */
export async function getOpportunitiesNeedingVolunteers(
  organizationId: string,
  daysAhead = 30
) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  // Get all active opportunities
  const opportunities = await prisma.servingOpportunity.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      shifts: {
        where: {
          shiftDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ["SCHEDULED", "CONFIRMED"],
          },
        },
        include: {
          volunteer: {
            select: {
              id: true,
              churchMember: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          shiftDate: "asc",
        },
      },
    },
  });

  // Filter to opportunities that need more volunteers
  return opportunities
    .map(opp => {
      // Group shifts by date
      const shiftsByDate = new Map<string, typeof opp.shifts>();
      opp.shifts.forEach(shift => {
        const dateKey = shift.shiftDate.toISOString().split("T")[0];
        if (!shiftsByDate.has(dateKey)) {
          shiftsByDate.set(dateKey, []);
        }
        shiftsByDate.get(dateKey)!.push(shift);
      });

      // Find dates that need more volunteers
      const understaffedDates: Array<{
        date: Date;
        needed: number;
        assigned: number;
        gap: number;
      }> = [];

      shiftsByDate.forEach((shifts, dateKey) => {
        const assigned = shifts.length;
        const needed = opp.volunteersNeeded;
        if (assigned < needed) {
          understaffedDates.push({
            date: new Date(dateKey),
            needed,
            assigned,
            gap: needed - assigned,
          });
        }
      });

      return {
        ...opp,
        understaffedDates,
        totalGap: understaffedDates.reduce((sum, d) => sum + d.gap, 0),
      };
    })
    .filter(opp => opp.understaffedDates.length > 0)
    .sort((a, b) => b.totalGap - a.totalGap); // Most urgent first
}

/**
 * Get Serving Opportunity Statistics
 *
 * Returns aggregate statistics for serving opportunities dashboard.
 *
 * @param organizationId - Organization ID
 * @param locationId - Optional location filter
 * @returns Statistics object
 */
export async function getServingOpportunityStats(
  organizationId: string,
  locationId?: string
) {
  const where = {
    organizationId,
    ...(locationId && { locationId }),
  };

  const [
    totalOpportunities,
    activeOpportunities,
    inactiveOpportunities,
    totalPositionsNeeded,
    upcomingShifts,
  ] = await Promise.all([
    // Total opportunities
    prisma.servingOpportunity.count({ where }),

    // Active opportunities
    prisma.servingOpportunity.count({
      where: { ...where, isActive: true },
    }),

    // Inactive opportunities
    prisma.servingOpportunity.count({
      where: { ...where, isActive: false },
    }),

    // Total positions needed across all active opportunities
    prisma.servingOpportunity.aggregate({
      where: { ...where, isActive: true },
      _sum: {
        volunteersNeeded: true,
      },
    }),

    // Upcoming shifts (next 30 days)
    prisma.volunteerShift.count({
      where: {
        organizationId,
        ...(locationId && { locationId }),
        shiftDate: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + 30)),
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED"],
        },
      },
    }),
  ]);

  return {
    totalOpportunities,
    activeOpportunities,
    inactiveOpportunities,
    totalPositionsNeeded: totalPositionsNeeded._sum.volunteersNeeded || 0,
    upcomingShifts,
  };
}

/**
 * Get Unique Categories
 *
 * Returns all unique category names used in serving opportunities.
 *
 * @param organizationId - Organization ID
 * @returns Array of category names
 */
export async function getServingOpportunityCategories(
  organizationId: string
): Promise<string[]> {
  const opportunities = await prisma.servingOpportunity.findMany({
    where: {
      organizationId,
      category: {
        not: null,
      },
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return opportunities
    .map(o => o.category)
    .filter((c): c is string => c !== null);
}
