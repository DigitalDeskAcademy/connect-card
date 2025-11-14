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
} from "@/lib/types/prayer-request";

/**
 * Get prayer requests for user's data scope
 *
 * Returns prayer requests filtered by organization and location permissions.
 * Private requests are only visible to admins, owners, and assigned team members.
 *
 * @param dataScope - User's data scope from requireDashboardAccess
 * @param userId - Current user ID for privacy filtering
 * @param filters - Optional filters for status, category, etc.
 * @returns Array of prayer requests with relations
 */
export async function getPrayerRequestsForScope(
  dataScope: DataScope,
  userId?: string,
  filters?: PrayerRequestFilters
): Promise<PrayerRequestWithRelations[]> {
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

  // Privacy filtering
  // Staff can only see public requests unless they're assigned
  // Admins and owners can see all requests
  if (
    !dataScope.filters.canManageUsers &&
    filters?.isPrivate !== true &&
    userId
  ) {
    where.OR = [
      { isPrivate: false }, // Public requests
      { assignedToId: userId }, // Requests assigned to user
    ];
  }

  // If explicitly filtering for private requests only
  if (filters?.isPrivate === true) {
    // Only allow if user has permission
    if (dataScope.filters.canManageUsers) {
      where.isPrivate = true;
    } else if (userId) {
      // Staff can only see their assigned private requests
      where.AND = [{ isPrivate: true }, { assignedToId: userId }];
    }
  }

  const requests = await prisma.prayerRequest.findMany({
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
  });

  return requests;
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

  // Get total count
  const total = await prisma.prayerRequest.count({ where });

  // Get status counts
  const pending = await prisma.prayerRequest.count({
    where: { ...where, status: "PENDING" },
  });

  const assigned = await prisma.prayerRequest.count({
    where: { ...where, status: "ASSIGNED" },
  });

  const praying = await prisma.prayerRequest.count({
    where: { ...where, status: "PRAYING" },
  });

  const answered = await prisma.prayerRequest.count({
    where: { ...where, status: "ANSWERED" },
  });

  // Get privacy and urgency counts
  const privateCount = await prisma.prayerRequest.count({
    where: { ...where, isPrivate: true },
  });

  const urgent = await prisma.prayerRequest.count({
    where: { ...where, isUrgent: true },
  });

  // Get this week's count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeek = await prisma.prayerRequest.count({
    where: { ...where, createdAt: { gte: oneWeekAgo } },
  });

  // Get answered this month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const answeredThisMonth = await prisma.prayerRequest.count({
    where: {
      ...where,
      status: "ANSWERED",
      answeredDate: { gte: oneMonthAgo },
    },
  });

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
  });

  return users;
}
