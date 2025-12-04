/**
 * Prayer Request Data Access Layer
 *
 * Scoped query helpers for prayer request management with multi-tenant isolation.
 * All queries enforce organizationId filtering and location-based access control.
 *
 * Usage:
 * ```typescript
 * const { dataScope } = await requireDashboardAccess(slug);
 * const requests = await getPrayerRequestsForScope(dataScope);
 * ```
 */

import { prisma } from "@/lib/db";
import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import type { Prisma } from "@/lib/generated/prisma";
import { getLocationFilter } from "./location-filter";
import type {
  PrayerRequestWithRelations,
  PrayerRequestFilters,
  PrayerRequestStats,
  PaginatedResult,
} from "@/lib/types/prayer-request";

/**
 * Get prayer requests for user's data scope
 *
 * Returns prayer requests filtered by organization and location permissions.
 * Private requests are only visible to admins, owners, and assigned team members.
 *
 * @param dataScope - User's data scope from requireDashboardAccess
 * @param userId - Current user ID for privacy filtering
 * @param filters - Optional filters for status, category, pagination, etc.
 * @returns Paginated result with prayer requests and total count
 */
export async function getPrayerRequestsForScope(
  dataScope: DataScope,
  userId?: string,
  filters?: PrayerRequestFilters
): Promise<PaginatedResult<PrayerRequestWithRelations>> {
  // Pagination defaults
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
  const skip = (page - 1) * limit;
  // Build where clause with organization and location filtering
  const where: Prisma.PrayerRequestWhereInput = {
    organizationId: dataScope.organizationId,
    ...getLocationFilter(dataScope),
  };

  // Apply status filter
  if (filters?.status) {
    where.status = filters.status;
  }

  // Apply category filter
  if (filters?.category) {
    where.category = filters.category;
  }

  // Apply location filter (overrides dataScope if provided)
  if (filters?.locationId) {
    where.locationId = filters.locationId;
  }

  // Apply assigned user filter
  if (filters?.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }

  // Apply date range filter
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.createdAt.lte = filters.dateTo;
    }
  }

  // Apply search filter (searches request text and submitter name)
  if (filters?.search) {
    where.OR = [
      { request: { contains: filters.search, mode: "insensitive" } },
      { submittedBy: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Privacy filtering - positive logic for clarity
  if (dataScope.filters.canManageUsers) {
    // Admins and owners see everything (already filtered by organizationId)
    // If explicitly filtering for private requests, apply that filter
    if (filters?.isPrivate === true) {
      where.isPrivate = true;
    } else if (filters?.isPrivate === false) {
      where.isPrivate = false;
    }
    // If no privacy filter specified, show all requests
  } else {
    // Staff: only see public requests OR requests assigned to them
    if (filters?.isPrivate === true && userId) {
      // Explicitly filtering for private - staff can only see assigned ones
      where.AND = [{ isPrivate: true }, { assignedToId: userId }];
    } else if (filters?.isPrivate === false) {
      // Explicitly filtering for public
      where.isPrivate = false;
    } else if (userId) {
      // No explicit privacy filter - show public OR assigned to them
      where.OR = [
        { isPrivate: false }, // Public requests
        { assignedToId: userId }, // Requests assigned to user
      ];
    } else {
      // Staff without userId - should only see public
      where.isPrivate = false;
    }
  }

  // Run count and data queries in parallel for efficiency
  const [total, requests] = await Promise.all([
    prisma.prayerRequest.count({ where }),
    prisma.prayerRequest.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        connectCard: {
          select: {
            id: true,
            name: true,
            email: true,
            scannedAt: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isUrgent: "desc" }, // Urgent requests first
        { status: "asc" }, // Then by status (PENDING first)
        { createdAt: "desc" }, // Then by date (newest first)
      ],
      take: limit,
      skip,
    }),
  ]);

  return {
    data: requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get single prayer request by ID
 *
 * Validates user has access to this prayer request based on organization and privacy.
 *
 * @param id - Prayer request ID
 * @param dataScope - User's data scope
 * @param userId - Current user ID for privacy filtering
 * @returns Prayer request with relations, or null if not found or no access
 */
export async function getPrayerRequestById(
  id: string,
  dataScope: DataScope,
  userId?: string
): Promise<PrayerRequestWithRelations | null> {
  const request = await prisma.prayerRequest.findFirst({
    where: {
      id,
      organizationId: dataScope.organizationId,
      ...getLocationFilter(dataScope),
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      connectCard: {
        select: {
          id: true,
          name: true,
          email: true,
          scannedAt: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Privacy check: if private, user must be admin/owner or assigned team member
  if (
    request?.isPrivate &&
    !dataScope.filters.canManageUsers &&
    request.assignedToId !== userId
  ) {
    return null; // Access denied
  }

  return request;
}

/**
 * Get prayer request statistics for dashboard
 *
 * Returns aggregate counts for various prayer request categories.
 * Optimized: Uses groupBy + Promise.all to reduce from 9 sequential queries
 * to 5 parallel queries (effectively 1 round-trip latency).
 *
 * @param dataScope - User's data scope
 * @param userId - Current user ID for privacy filtering
 * @returns Prayer request statistics
 */
export async function getPrayerRequestStats(
  dataScope: DataScope,
  userId?: string
): Promise<PrayerRequestStats> {
  const where: Prisma.PrayerRequestWhereInput = {
    organizationId: dataScope.organizationId,
    ...getLocationFilter(dataScope),
  };

  // Privacy filtering for staff
  if (!dataScope.filters.canManageUsers && userId) {
    where.OR = [{ isPrivate: false }, { assignedToId: userId }];
  }

  // Calculate date thresholds once
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Run all queries in parallel for optimal performance
  const [statusCounts, privateCount, urgent, thisWeek, answeredThisMonth] =
    await Promise.all([
      // Status counts via groupBy (1 query for all status values)
      prisma.prayerRequest.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      // Private count
      prisma.prayerRequest.count({ where: { ...where, isPrivate: true } }),
      // Urgent count
      prisma.prayerRequest.count({ where: { ...where, isUrgent: true } }),
      // This week's count
      prisma.prayerRequest.count({
        where: { ...where, createdAt: { gte: oneWeekAgo } },
      }),
      // Answered this month
      prisma.prayerRequest.count({
        where: {
          ...where,
          status: "ANSWERED",
          answeredDate: { gte: oneMonthAgo },
        },
      }),
    ]);

  // Parse status counts from groupBy result
  const statusMap = new Map(statusCounts.map(s => [s.status, s._count._all]));

  const pending = statusMap.get("PENDING") ?? 0;
  const assigned = statusMap.get("ASSIGNED") ?? 0;
  const praying = statusMap.get("PRAYING") ?? 0;
  const answered = statusMap.get("ANSWERED") ?? 0;
  const archived = statusMap.get("ARCHIVED") ?? 0;

  // Total is sum of all statuses
  const total = pending + assigned + praying + answered + archived;

  return {
    total,
    pending,
    assigned,
    praying,
    answered,
    private: privateCount,
    urgent,
    thisWeek,
    answeredThisMonth,
  };
}

/**
 * Create prayer request from connect card
 *
 * Extracts prayer request data from a connect card's extracted data.
 * Automatically detects privacy needs and categorizes the request.
 *
 * @param connectCardId - Connect card ID
 * @param organizationId - Organization ID
 * @param locationId - Location ID (optional)
 * @param prayerRequestText - Prayer request text from card
 * @returns Created prayer request
 */
export async function createPrayerRequestFromConnectCard(
  connectCardId: string,
  organizationId: string,
  locationId: string | null,
  prayerRequestText: string
): Promise<PrayerRequestWithRelations> {
  // Get connect card details for submitter info
  const connectCard = await prisma.connectCard.findUnique({
    where: { id: connectCardId },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

  // Detect if request should be private (sensitive content)
  const isPrivate = hasSensitiveKeywords(prayerRequestText);

  // Detect category from request text
  const category = detectPrayerCategory(prayerRequestText);

  const request = await prisma.prayerRequest.create({
    data: {
      organizationId,
      locationId,
      connectCardId,
      request: prayerRequestText,
      category,
      submittedBy: connectCard?.name || null,
      submitterEmail: connectCard?.email || null,
      submitterPhone: connectCard?.phone || null,
      status: "PENDING",
      isPrivate, // Auto-detected based on sensitive keywords
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      connectCard: {
        select: {
          id: true,
          name: true,
          email: true,
          scannedAt: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return request;
}

/**
 * Check if prayer request text contains sensitive keywords
 *
 * Suggests marking request as private if sensitive language detected.
 *
 * @param requestText - Prayer request text to analyze
 * @returns true if sensitive keywords found
 */
export function hasSensitiveKeywords(requestText: string): boolean {
  const sensitiveKeywords = [
    "confidential",
    "private",
    "don't share",
    "dont share",
    "between us",
    "secret",
    "personal",
    "sensitive",
    "abuse",
    "addiction",
    "affair",
    "divorce",
    "depression",
    "suicide",
    "mental health",
    "legal",
    "court",
  ];

  const lowerText = requestText.toLowerCase();
  return sensitiveKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Detect prayer request category from text content
 *
 * Uses keyword matching to automatically categorize prayer requests.
 * Returns most specific category match, or null if no match found.
 *
 * @param requestText - Prayer request text to analyze
 * @returns Detected category or null
 */
export function detectPrayerCategory(requestText: string): string | null {
  const lowerText = requestText.toLowerCase();

  // Health keywords (most specific first)
  const healthKeywords = [
    "surgery",
    "doctor",
    "hospital",
    "cancer",
    "disease",
    "illness",
    "sick",
    "pain",
    "healing",
    "health",
    "medical",
    "treatment",
    "diagnosis",
    "recovery",
    "chronic",
    "mental health",
    "depression",
    "anxiety",
    "addiction",
  ];
  if (healthKeywords.some(keyword => lowerText.includes(keyword))) {
    return "Health";
  }

  // Salvation keywords
  const salvationKeywords = [
    "salvation",
    "saved",
    "accept christ",
    "accept jesus",
    "gospel",
    "born again",
    "unsaved",
    "non-believer",
    "doesn't know jesus",
    "doesnt know jesus",
    "not a christian",
    "come to christ",
    "come to faith",
  ];
  if (salvationKeywords.some(keyword => lowerText.includes(keyword))) {
    return "Salvation";
  }

  // Family keywords
  const familyKeywords = [
    "child",
    "children",
    "kids",
    "son",
    "daughter",
    "parent",
    "mother",
    "father",
    "mom",
    "dad",
    "family",
    "marriage",
    "husband",
    "wife",
    "spouse",
    "sibling",
    "brother",
    "sister",
    "grandparent",
    "grandmother",
    "grandfather",
  ];
  if (familyKeywords.some(keyword => lowerText.includes(keyword))) {
    return "Family";
  }

  // Financial keywords
  const financialKeywords = [
    "financial",
    "money",
    "job",
    "employment",
    "laid off",
    "unemployed",
    "debt",
    "bills",
    "provision",
    "finances",
    "income",
    "paycheck",
  ];
  if (financialKeywords.some(keyword => lowerText.includes(keyword))) {
    return "Financial";
  }

  // Work/Career keywords
  const careerKeywords = [
    "work",
    "career",
    "job search",
    "interview",
    "business",
    "promotion",
    "coworker",
    "workplace",
    "boss",
  ];
  if (careerKeywords.some(keyword => lowerText.includes(keyword))) {
    return "Work/Career";
  }

  // Relationships keywords
  const relationshipKeywords = [
    "relationship",
    "dating",
    "boyfriend",
    "girlfriend",
    "fiance",
    "engaged",
    "marriage counseling",
    "separation",
    "divorce",
    "affair",
    "friendship",
  ];
  if (relationshipKeywords.some(keyword => lowerText.includes(keyword))) {
    return "Relationships";
  }

  // Spiritual Growth keywords
  const spiritualKeywords = [
    "faith",
    "doubt",
    "spiritual",
    "bible study",
    "prayer",
    "worship",
    "ministry",
    "calling",
    "purpose",
    "discipleship",
    "grow",
    "closer to god",
  ];
  if (spiritualKeywords.some(keyword => lowerText.includes(keyword))) {
    return "Spiritual Growth";
  }

  // No category match
  return null;
}

/**
 * Get prayer team members for assignment dropdown
 *
 * Returns users who can be assigned prayer requests (admins and staff).
 *
 * @param organizationId - Organization ID
 * @param locationId - Optional location filter for staff
 * @returns Array of users suitable for prayer team assignment
 */
export async function getPrayerTeamMembers(
  organizationId: string,
  locationId?: string | null
) {
  const where: Prisma.UserWhereInput = {
    organizationId,
    // Only church admins and staff (not platform admins or owners)
    role: {
      in: ["church_admin", "user"],
    },
  };

  // Filter by location if provided
  if (locationId) {
    where.defaultLocationId = locationId;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      defaultLocationId: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 100, // Reasonable limit for dropdown - most churches have <100 staff
  });

  return users;
}
