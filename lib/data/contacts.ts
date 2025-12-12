"use server";

import { prisma } from "@/lib/db";
import { MemberType, Prisma } from "@/lib/generated/prisma";

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
}

export interface ContactsQueryParams {
  organizationId: string;
  locationId?: string | null;
  search?: string;
  memberType?: MemberType;
  tags?: string[];
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
  const [contacts, totalCount] = await Promise.all([
    prisma.churchMember.findMany({
      where,
      include: {
        connectCards: {
          select: { id: true },
        },
        volunteer: {
          select: { status: true },
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
    isVolunteer: member.volunteer !== null,
    volunteerStatus: member.volunteer?.status ?? null,
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
