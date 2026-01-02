import "server-only";

import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import { prisma } from "@/lib/db";
import { getLocationFilter } from "./location-filter";
import type {
  EventStatus,
  EventType,
  VolunteerCategoryType,
  Prisma,
} from "@/lib/generated/prisma";

/**
 * Get Events for Organization
 *
 * Fetches volunteer events with location-based filtering applied per user's DataScope.
 * Includes sessions with slot counts for capacity display.
 *
 * @param dataScope - User's data scope (includes organizationId and location permissions)
 * @param filters - Optional filters (status, category, location, dateRange)
 * @returns Array of events with sessions and slot counts
 */
export async function getEventsForScope(
  dataScope: DataScope,
  filters?: {
    status?: EventStatus[];
    eventType?: EventType;
    category?: VolunteerCategoryType;
    locationId?: string;
    upcoming?: boolean; // Only future events
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where = {
    organizationId: dataScope.organizationId,
    ...getLocationFilter(dataScope),
    ...(filters?.status && { status: { in: filters.status } }),
    ...(filters?.eventType && { eventType: filters.eventType }),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.locationId && { locationId: filters.locationId }),
    ...(filters?.upcoming && {
      sessions: {
        some: {
          date: { gte: today },
        },
      },
    }),
  };

  return await prisma.volunteerEvent.findMany({
    where,
    include: {
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sessions: {
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          slotsNeeded: true,
          slotsFilled: true,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // DRAFT first, then PUBLISHED, etc.
      { createdAt: "desc" },
    ],
    take: 100, // Limit for memory safety
  });
}

/**
 * Get Single Event by ID
 *
 * Fetches detailed event information with sessions and assignments.
 *
 * @param dataScope - User's data scope
 * @param eventId - Event ID
 * @returns Event with full details or null if not found
 */
export async function getEventById(dataScope: DataScope, eventId: string) {
  return await prisma.volunteerEvent.findFirst({
    where: {
      id: eventId,
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      sessions: {
        include: {
          assignments: {
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
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
      // TODO: Uncomment when EventResource schema is pushed to DB
      // resources: {
      //   orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
      // },
    },
  });
}

/**
 * Get Event Statistics for Dashboard
 *
 * Returns counts of events by status for quick overview.
 *
 * @param dataScope - User's data scope
 * @returns Object with counts per status
 */
export async function getEventStats(dataScope: DataScope) {
  const where = {
    organizationId: dataScope.organizationId,
    ...getLocationFilter(dataScope),
  };

  const [draft, published, inProgress, completed, cancelled] =
    await Promise.all([
      prisma.volunteerEvent.count({
        where: { ...where, status: "DRAFT" },
      }),
      prisma.volunteerEvent.count({
        where: { ...where, status: "PUBLISHED" },
      }),
      prisma.volunteerEvent.count({
        where: { ...where, status: "IN_PROGRESS" },
      }),
      prisma.volunteerEvent.count({
        where: { ...where, status: "COMPLETED" },
      }),
      prisma.volunteerEvent.count({
        where: { ...where, status: "CANCELLED" },
      }),
    ]);

  return {
    draft,
    published,
    inProgress,
    completed,
    cancelled,
    total: draft + published + inProgress + completed + cancelled,
  };
}

/**
 * Get Upcoming Events
 *
 * Returns events with sessions in the next N days.
 * Useful for dashboard "coming up" section.
 *
 * @param dataScope - User's data scope
 * @param days - Number of days to look ahead (default: 7)
 * @returns Array of upcoming events with session details
 */
export async function getUpcomingEvents(
  dataScope: DataScope,
  days: number = 7
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  return await prisma.volunteerEvent.findMany({
    where: {
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
      status: { in: ["PUBLISHED", "IN_PROGRESS"] },
      sessions: {
        some: {
          date: {
            gte: today,
            lte: futureDate,
          },
        },
      },
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          name: true,
        },
      },
      sessions: {
        where: {
          date: {
            gte: today,
            lte: futureDate,
          },
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          slotsNeeded: true,
          slotsFilled: true,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
    orderBy: {
      sessions: {
        _count: "desc",
      },
    },
    take: 10,
  });
}

/**
 * Get Events Needing Volunteers
 *
 * Returns published events where sessions are not fully filled.
 * Sorted by most urgent (closest date with fewest filled slots).
 *
 * @param dataScope - User's data scope
 * @returns Array of events needing volunteers
 */
export async function getEventsNeedingVolunteers(dataScope: DataScope) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.volunteerEvent.findMany({
    where: {
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
      status: "PUBLISHED",
      sessions: {
        some: {
          date: { gte: today },
        },
      },
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
        },
      },
      sessions: {
        where: {
          date: { gte: today },
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          slotsNeeded: true,
          slotsFilled: true,
        },
        orderBy: { date: "asc" },
      },
    },
    take: 20,
  });

  // Filter to events with unfilled sessions and calculate fill percentage
  return events
    .map(event => {
      const totalNeeded = event.sessions.reduce(
        (sum, s) => sum + s.slotsNeeded,
        0
      );
      const totalFilled = event.sessions.reduce(
        (sum, s) => sum + s.slotsFilled,
        0
      );
      const fillPercentage =
        totalNeeded > 0 ? (totalFilled / totalNeeded) * 100 : 100;

      return {
        ...event,
        totalNeeded,
        totalFilled,
        fillPercentage,
        spotsRemaining: totalNeeded - totalFilled,
      };
    })
    .filter(event => event.spotsRemaining > 0)
    .sort((a, b) => {
      // Sort by earliest session date, then by fill percentage (lowest first)
      const aDate = a.sessions[0]?.date ?? new Date();
      const bDate = b.sessions[0]?.date ?? new Date();
      if (aDate.getTime() !== bDate.getTime()) {
        return aDate.getTime() - bDate.getTime();
      }
      return a.fillPercentage - b.fillPercentage;
    });
}

/**
 * Get Available Volunteers for a Session
 *
 * Returns volunteers who can be assigned to a session, filtered by:
 * - Organization match
 * - Active status
 * - Not already assigned to this session
 * - Category match (if event has category)
 * - Background check cleared (if event requires it)
 * - Location match (if event volunteerPoolScope = "location")
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @param sessionId - Session ID to check assignments against
 * @param eventId - Event ID for category/requirements lookup
 * @returns Array of available volunteers with basic info
 */
export async function getAvailableVolunteersForSession(
  organizationId: string,
  sessionId: string,
  eventId: string
) {
  // Get event details for filtering
  const event = await prisma.volunteerEvent.findFirst({
    where: {
      id: eventId,
      organizationId,
    },
    select: {
      category: true,
      requiresBackgroundCheck: true,
      volunteerPoolScope: true,
      locationId: true,
    },
  });

  if (!event) {
    return [];
  }

  // Get volunteers already assigned to this session
  const existingAssignments = await prisma.eventAssignment.findMany({
    where: { sessionId },
    select: { volunteerId: true },
  });
  const assignedIds = existingAssignments.map(a => a.volunteerId);

  // Build volunteer filter
  const volunteerFilter: Prisma.VolunteerWhereInput = {
    organizationId,
    status: "ACTIVE",
    ...(assignedIds.length > 0 && { id: { notIn: assignedIds } }),
    // Category filter (if event has a category, match volunteers in that category)
    ...(event.category && {
      categories: {
        some: {
          category: event.category,
        },
      },
    }),
    // Background check filter
    ...(event.requiresBackgroundCheck && {
      backgroundCheckStatus: "CLEARED",
    }),
    // Location filter (if scope is "location" and event has location)
    ...(event.volunteerPoolScope === "location" &&
      event.locationId && {
        locationId: event.locationId,
      }),
  };

  return await prisma.volunteer.findMany({
    where: volunteerFilter,
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
    orderBy: [
      // Sort by last served date (oldest first = hasn't served recently)
      { lastServedDate: "asc" },
      { churchMember: { name: "asc" } },
    ],
    take: 50, // Limit for performance
  });
}

/**
 * Get distinct event types used in organization
 *
 * Returns unique event types for filter dropdown.
 *
 * @param dataScope - User's data scope
 * @returns Array of event types in use
 */
export async function getEventTypesInUse(
  dataScope: DataScope
): Promise<EventType[]> {
  const result = await prisma.volunteerEvent.findMany({
    where: {
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
    },
    select: {
      eventType: true,
    },
    distinct: ["eventType"],
  });

  return result.map(r => r.eventType);
}

/**
 * Event Type Display Labels
 *
 * Human-readable labels for event types.
 */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SUNDAY_SERVICE: "Sunday Service",
  MIDWEEK_SERVICE: "Midweek Service",
  YOUTH: "Youth",
  KIDS: "Kids",
  OUTREACH: "Outreach",
  SPECIAL_EVENT: "Special Event",
  HOLIDAY: "Holiday",
  OTHER: "Other",
};

/**
 * All event types for form dropdowns
 */
export const ALL_EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "SUNDAY_SERVICE", label: "Sunday Service" },
  { value: "MIDWEEK_SERVICE", label: "Midweek Service" },
  { value: "YOUTH", label: "Youth" },
  { value: "KIDS", label: "Kids" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "SPECIAL_EVENT", label: "Special Event" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "OTHER", label: "Other" },
];

/**
 * Type exports for use in components
 */
export type EventWithDetails = NonNullable<
  Awaited<ReturnType<typeof getEventById>>
>;
export type EventListItem = Awaited<
  ReturnType<typeof getEventsForScope>
>[number];
export type EventNeedingVolunteers = Awaited<
  ReturnType<typeof getEventsNeedingVolunteers>
>[number];
export type AvailableVolunteer = Awaited<
  ReturnType<typeof getAvailableVolunteersForSession>
>[number];
