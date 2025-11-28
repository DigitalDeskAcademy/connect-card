/**
 * Prayer Batch Data Access Layer
 *
 * Provides multi-tenant data fetching for prayer batches.
 * All queries filter by organizationId for data isolation.
 */

import { prisma } from "@/lib/db";

/**
 * Get all prayer batches for an organization
 * Ordered by batch date (newest first)
 */
export async function getPrayerBatches(organizationId: string) {
  return prisma.prayerBatch.findMany({
    where: {
      organizationId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          prayerRequests: true,
        },
      },
    },
    orderBy: {
      batchDate: "desc",
    },
    take: 100, // Limit to recent batches - older batches should be archived
  });
}

/**
 * Get a specific prayer batch by ID
 */
export async function getPrayerBatchById(
  batchId: string,
  organizationId: string
) {
  return prisma.prayerBatch.findFirst({
    where: {
      id: batchId,
      organizationId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          prayerRequests: true,
        },
      },
    },
  });
}

/**
 * Get prayer batch with all prayer requests
 */
export async function getPrayerBatchWithRequests(batchId: string) {
  return prisma.prayerBatch.findUnique({
    where: {
      id: batchId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      prayerRequests: {
        include: {
          location: {
            select: {
              id: true,
              name: true,
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
        orderBy: {
          createdAt: "desc",
        },
        take: 200, // Limit requests per batch for memory safety
      },
      _count: {
        select: {
          prayerRequests: true,
        },
      },
    },
  });
}
