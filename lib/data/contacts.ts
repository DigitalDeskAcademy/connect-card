"use server";

import { prisma } from "@/lib/db";
import { MemberType, Prisma } from "@/lib/generated/prisma";
import { fromMemberKeywordsJson, MemberKeyword } from "@/lib/prisma/json-types";

// ============================================================================
// TYPES
// ============================================================================

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  memberType: MemberType;
  tags: string[];
  locationName: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Activity summary
  lastActivityAt: Date | null;
  connectCardCount: number;
  // Volunteer info (if applicable)
  isVolunteer: boolean;
  volunteerStatus: string | null;
  // Campaign keywords (for filtering)
  detectedKeywords: MemberKeyword[];
}

export interface ContactsQueryParams {
  organizationId: string;
  locationId?: string | null;
  search?: string;
  memberType?: MemberType;
  tags?: string[];
  keyword?: string; // Filter by campaign keyword
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ContactsResult {
  contacts: Contact[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get paginated contacts for an organization.
 * Supports search, filtering by member type, tags, and location.
 */
export async function getContacts(
  params: ContactsQueryParams
): Promise<ContactsResult> {
  const {
    organizationId,
    locationId,
    search,
    memberType,
    tags,
    keyword,
    page = 1,
    pageSize = 25,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // Build where clause
  const where: Prisma.ChurchMemberWhereInput = {
    organizationId,
    // Filter by location if specified
    ...(locationId && { locationId }),
  };

  // Filter by member type
  if (memberType) {
    where.memberType = memberType;
  }

  // Filter by tags (any match)
  if (tags && tags.length > 0) {
    where.tags = {
      hasSome: tags,
    };
  }

  // Filter by campaign keyword
  // Note: Uses string matching on JSON field. Works well for simple keywords.
  // For complex queries, consider raw SQL with @> JSONB operator.
  if (keyword) {
    where.detectedKeywords = {
      string_contains: `"keyword":"${keyword}"`,
    };
  }

  // Search by name, email, or phone
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      { phone: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;

  // Build orderBy
  const orderBy: Prisma.ChurchMemberOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  // Execute queries in parallel
  // Note: Using unified model fields (isVolunteer, volunteerStatus) instead of JOINs
  const [contacts, totalCount] = await Promise.all([
    prisma.churchMember.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        memberType: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        detectedKeywords: true,
        // Unified model fields (Phase 3)
        isVolunteer: true,
        volunteerStatus: true,
        connectCards: {
          select: { id: true },
        },
        // Get latest activity from messages
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.churchMember.count({ where }),
  ]);

  // Transform to Contact type
  // Using unified model fields (Phase 3) - no longer JOINing to Volunteer
  const transformedContacts: Contact[] = contacts.map(member => ({
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    address: member.address,
    memberType: member.memberType,
    tags: member.tags,
    locationName: null, // TODO: Add location relation if needed
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    lastActivityAt: member.messages[0]?.createdAt ?? member.updatedAt,
    connectCardCount: member.connectCards.length,
    // Unified model: use direct boolean instead of relation check
    isVolunteer: member.isVolunteer,
    // Unified model: use direct field instead of relation
    volunteerStatus: member.volunteerStatus,
    detectedKeywords: fromMemberKeywordsJson(member.detectedKeywords),
  }));

  return {
    contacts: transformedContacts,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Get a single contact by ID with full details.
 */
export async function getContactById(
  organizationId: string,
  contactId: string
) {
  const contact = await prisma.churchMember.findFirst({
    where: {
      id: contactId,
      organizationId,
    },
    include: {
      connectCards: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          visitType: true,
          createdAt: true,
          location: {
            select: { name: true },
          },
        },
      },
      volunteer: {
        include: {
          categories: true,
          skills: true,
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      appointments: {
        orderBy: { startTime: "desc" },
        take: 10,
      },
      tasks: {
        where: {
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return contact;
}

/**
 * Get all unique tags used in an organization's contacts.
 */
export async function getContactTags(
  organizationId: string
): Promise<string[]> {
  const members = await prisma.churchMember.findMany({
    where: { organizationId },
    select: { tags: true },
  });

  const allTags = members.flatMap(m => m.tags);
  const uniqueTags = [...new Set(allTags)].sort();

  return uniqueTags;
}

/**
 * Get all unique campaign keywords used in an organization's contacts.
 * Only returns keywords from the last 30 days (matching cleanup retention).
 */
export async function getContactKeywords(
  organizationId: string
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffIso = cutoffDate.toISOString();

  const members = await prisma.churchMember.findMany({
    where: {
      organizationId,
      // Only query members with non-empty keywords
      NOT: {
        detectedKeywords: {
          equals: [],
        },
      },
    },
    select: { detectedKeywords: true },
  });

  // Extract and deduplicate keywords, filtering by date
  const keywords = new Set<string>();

  for (const member of members) {
    const memberKeywords = fromMemberKeywordsJson(member.detectedKeywords);
    for (const kw of memberKeywords) {
      // Only include keywords from the last 30 days
      if (kw.detectedAt >= cutoffIso) {
        keywords.add(kw.keyword);
      }
    }
  }

  return [...keywords].sort();
}

/**
 * Get contact counts by member type for dashboard stats.
 */
export async function getContactStats(organizationId: string) {
  const stats = await prisma.churchMember.groupBy({
    by: ["memberType"],
    where: { organizationId },
    _count: true,
  });

  const total = await prisma.churchMember.count({
    where: { organizationId },
  });

  return {
    total,
    byType: stats.reduce(
      (acc, stat) => {
        acc[stat.memberType] = stat._count;
        return acc;
      },
      {} as Record<MemberType, number>
    ),
  };
}
