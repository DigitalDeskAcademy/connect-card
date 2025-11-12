import "server-only";

import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import { prisma } from "@/lib/db";
import { getLocationFilter } from "./location-filter";
import type { ShiftStatus } from "@/lib/generated/prisma";

/**
 * Get Shifts for Organization
 *
 * Fetches volunteer shifts with location-based filtering applied per user's DataScope.
 * Includes volunteer, serving opportunity, and location data.
 *
 * @param dataScope - User's data scope (includes organizationId and location permissions)
 * @param filters - Optional filters (status, dateRange, volunteerId, opportunityId)
 * @returns Array of shifts with related data
 */
export async function getShiftsForScope(
  dataScope: DataScope,
  filters?: {
    status?: ShiftStatus[];
    startDate?: Date;
    endDate?: Date;
    volunteerId?: string;
    opportunityId?: string;
    locationId?: string;
  }
) {
  const where = {
    organizationId: dataScope.organizationId,
    ...getLocationFilter(dataScope), // Apply location-based filtering
    ...(filters?.status && { status: { in: filters.status } }),
    ...(filters?.startDate && {
      shiftDate: { gte: filters.startDate },
    }),
    ...(filters?.endDate && {
      shiftDate: { lte: filters.endDate },
    }),
    ...(filters?.volunteerId && { volunteerId: filters.volunteerId }),
    ...(filters?.opportunityId && {
      servingOpportunityId: filters.opportunityId,
    }),
    ...(filters?.locationId && { locationId: filters.locationId }),
  };

  return await prisma.volunteerShift.findMany({
    where,
    include: {
      volunteer: {
        include: {
          churchMember: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      servingOpportunity: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
        },
      },
    },
    orderBy: [
      { shiftDate: "asc" },
      { startTime: "asc" },
      { servingOpportunity: { name: "asc" } },
    ],
  });
}

/**
 * Get Shifts by Date Range (Calendar View)
 *
 * Returns shifts grouped by date for calendar display.
 *
 * @param organizationId - Organization ID
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param locationId - Optional location filter
 * @returns Map of date string to shifts
 */
export async function getShiftsByDateRange(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  locationId?: string
) {
  const shifts = await prisma.volunteerShift.findMany({
    where: {
      organizationId,
      ...(locationId && { locationId }),
      shiftDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        notIn: ["CANCELLED", "NO_SHOW"],
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
      servingOpportunity: {
        select: {
          id: true,
          name: true,
          category: true,
          volunteersNeeded: true,
        },
      },
    },
    orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
  });

  // Group by date
  const grouped = new Map<string, typeof shifts>();
  shifts.forEach(shift => {
    const dateKey = shift.shiftDate.toISOString().split("T")[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(shift);
  });

  return grouped;
}

/**
 * Get Upcoming Shifts
 *
 * Returns shifts scheduled in the near future.
 *
 * @param organizationId - Organization ID
 * @param daysAhead - Look ahead this many days (default: 14)
 * @param locationId - Optional location filter
 * @returns Array of upcoming shifts
 */
export async function getUpcomingShifts(
  organizationId: string,
  daysAhead = 14,
  locationId?: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  return await prisma.volunteerShift.findMany({
    where: {
      organizationId,
      ...(locationId && { locationId }),
      shiftDate: {
        gte: today,
        lte: endDate,
      },
      status: {
        in: ["SCHEDULED", "CONFIRMED"],
      },
    },
    include: {
      volunteer: {
        include: {
          churchMember: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      servingOpportunity: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }],
  });
}

/**
 * Get Shifts Needing Confirmation
 *
 * Returns scheduled shifts that haven't been confirmed by volunteers.
 *
 * @param organizationId - Organization ID
 * @param daysAhead - Look ahead this many days (default: 7)
 * @returns Array of unconfirmed shifts
 */
export async function getShiftsNeedingConfirmation(
  organizationId: string,
  daysAhead = 7
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  return await prisma.volunteerShift.findMany({
    where: {
      organizationId,
      shiftDate: {
        gte: today,
        lte: endDate,
      },
      status: "SCHEDULED",
      isConfirmed: false,
      reminderSent: false, // Haven't sent reminder yet
    },
    include: {
      volunteer: {
        include: {
          churchMember: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      servingOpportunity: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: {
      shiftDate: "asc",
    },
  });
}

/**
 * Get Volunteer's Schedule
 *
 * Returns all shifts for a specific volunteer.
 *
 * @param dataScope - User's data scope
 * @param volunteerId - Volunteer ID
 * @param includeCompleted - Include completed/past shifts (default: false)
 * @returns Array of shifts for the volunteer
 */
export async function getVolunteerSchedule(
  dataScope: DataScope,
  volunteerId: string,
  includeCompleted = false
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.volunteerShift.findMany({
    where: {
      volunteerId,
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
      ...(includeCompleted
        ? {}
        : {
            shiftDate: { gte: today },
            status: {
              in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"],
            },
          }),
    },
    include: {
      servingOpportunity: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
        },
      },
    },
    orderBy: [
      { shiftDate: includeCompleted ? "desc" : "asc" },
      { startTime: "asc" },
    ],
    ...(includeCompleted ? {} : { take: 50 }), // Limit upcoming shifts
  });
}

/**
 * Get Shift Statistics
 *
 * Returns aggregate statistics for shift management dashboard.
 *
 * @param organizationId - Organization ID
 * @param locationId - Optional location filter
 * @returns Statistics object
 */
export async function getShiftStats(
  organizationId: string,
  locationId?: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thirtyDaysAhead = new Date(today);
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  const where = {
    organizationId,
    ...(locationId && { locationId }),
  };

  const [
    upcomingShifts,
    unconfirmedShifts,
    completedShiftsLast30Days,
    noShowsLast30Days,
    totalVolunteersScheduled,
  ] = await Promise.all([
    // Upcoming shifts (next 30 days)
    prisma.volunteerShift.count({
      where: {
        ...where,
        shiftDate: {
          gte: today,
          lte: thirtyDaysAhead,
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"],
        },
      },
    }),

    // Unconfirmed shifts (next 7 days)
    prisma.volunteerShift.count({
      where: {
        ...where,
        shiftDate: {
          gte: today,
          lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: "SCHEDULED",
        isConfirmed: false,
      },
    }),

    // Completed shifts (last 30 days)
    prisma.volunteerShift.count({
      where: {
        ...where,
        shiftDate: {
          gte: thirtyDaysAgo,
          lt: today,
        },
        status: "COMPLETED",
      },
    }),

    // No-shows (last 30 days)
    prisma.volunteerShift.count({
      where: {
        ...where,
        shiftDate: {
          gte: thirtyDaysAgo,
          lt: today,
        },
        status: "NO_SHOW",
      },
    }),

    // Unique volunteers with upcoming shifts
    prisma.volunteerShift.findMany({
      where: {
        ...where,
        shiftDate: {
          gte: today,
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"],
        },
      },
      select: {
        volunteerId: true,
      },
      distinct: ["volunteerId"],
    }),
  ]);

  return {
    upcomingShifts,
    unconfirmedShifts,
    completedShiftsLast30Days,
    noShowsLast30Days,
    totalVolunteersScheduled: totalVolunteersScheduled.length,
    reliabilityRate:
      completedShiftsLast30Days + noShowsLast30Days > 0
        ? Math.round(
            (completedShiftsLast30Days /
              (completedShiftsLast30Days + noShowsLast30Days)) *
              100
          )
        : 100,
  };
}

/**
 * Get Service Schedule (Sunday/Service Day View)
 *
 * Returns all shifts for a specific service day, grouped by serving opportunity.
 *
 * @param organizationId - Organization ID
 * @param serviceDate - Date of the service
 * @param locationId - Optional location filter
 * @returns Map of serving opportunity to shifts
 */
export async function getServiceSchedule(
  organizationId: string,
  serviceDate: Date,
  locationId?: string
) {
  const shifts = await prisma.volunteerShift.findMany({
    where: {
      organizationId,
      ...(locationId && { locationId }),
      shiftDate: serviceDate,
      status: {
        notIn: ["CANCELLED"],
      },
    },
    include: {
      volunteer: {
        include: {
          churchMember: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      servingOpportunity: {
        select: {
          id: true,
          name: true,
          category: true,
          volunteersNeeded: true,
        },
      },
    },
    orderBy: [
      { servingOpportunity: { category: "asc" } },
      { servingOpportunity: { name: "asc" } },
      { startTime: "asc" },
    ],
  });

  // Group by serving opportunity
  const grouped = new Map<string, typeof shifts>();
  shifts.forEach(shift => {
    const oppId = shift.servingOpportunityId;
    if (!grouped.has(oppId)) {
      grouped.set(oppId, []);
    }
    grouped.get(oppId)!.push(shift);
  });

  return grouped;
}

/**
 * Get Volunteer Attendance History
 *
 * Returns attendance statistics for a volunteer.
 *
 * @param volunteerId - Volunteer ID
 * @param months - Number of months to look back (default: 6)
 * @returns Attendance statistics
 */
export async function getVolunteerAttendanceHistory(
  volunteerId: string,
  months = 6
) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  const shifts = await prisma.volunteerShift.findMany({
    where: {
      volunteerId,
      shiftDate: {
        gte: startDate,
      },
    },
    select: {
      id: true,
      shiftDate: true,
      status: true,
      checkInTime: true,
      checkOutTime: true,
    },
    orderBy: {
      shiftDate: "desc",
    },
  });

  const totalShifts = shifts.length;
  const completedShifts = shifts.filter(s => s.status === "COMPLETED").length;
  const noShows = shifts.filter(s => s.status === "NO_SHOW").length;
  const cancelled = shifts.filter(s => s.status === "CANCELLED").length;

  return {
    totalShifts,
    completedShifts,
    noShows,
    cancelled,
    reliabilityRate:
      totalShifts > 0
        ? Math.round((completedShifts / (totalShifts - cancelled)) * 100)
        : 100,
    shifts: shifts.slice(0, 10), // Last 10 shifts for detail
  };
}
