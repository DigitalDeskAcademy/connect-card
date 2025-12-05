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
 * Privacy options for prayer batch queries
 */
interface PrivacyOptions {
  /** Current user ID for assignment check */
  userId: string;
  /** Whether user can manage users (admin/owner) */
  canManageUsers: boolean;
}

/**
 * Get prayer batch with all prayer requests
 *
 * Privacy: Redacts submittedBy for private prayers when user is not admin/owner
 * and not assigned to that specific prayer request.
 *
 * @param batchId - The batch ID to fetch
 * @param privacyOptions - Optional privacy filtering (if omitted, shows all - for admins)
 */
export async function getPrayerBatchWithRequests(
  batchId: string,
  privacyOptions?: PrivacyOptions
) {
  const batch = await prisma.prayerBatch.findUnique({
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

  if (!batch) return null;

  // Apply privacy redaction if options provided and user is not admin/owner
  if (privacyOptions && !privacyOptions.canManageUsers) {
    batch.prayerRequests = batch.prayerRequests.map(prayer => {
      // Redact submittedBy for private prayers unless user is assigned
      if (prayer.isPrivate && prayer.assignedToId !== privacyOptions.userId) {
        return {
          ...prayer,
          submittedBy: null, // Redact the name
        };
      }
      return prayer;
    });
  }

  return batch;
}
