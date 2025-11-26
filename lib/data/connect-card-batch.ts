/**
 * Connect Card Batch Data Layer
 * Handles batch creation, retrieval, and status management
 */

import { prisma } from "@/lib/db";
import type { BatchStatus } from "@/lib/generated/prisma";

/**
 * Format batch name: "{Location} - {Mon DD, YYYY}"
 */
function formatBatchName(locationName: string, date: Date): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${locationName} - ${month} ${day}, ${year}`;
}

/**
 * Get or create active batch for user's location
 * Used during upload to auto-assign cards to current batch
 */
export async function getOrCreateActiveBatch(
  userId: string,
  organizationId: string
): Promise<{
  id: string;
  name: string;
  locationId: string | null;
  cardCount: number;
}> {
  // Get user's location
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      defaultLocationId: true,
      defaultLocation: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user?.defaultLocationId || !user.defaultLocation) {
    throw new Error("User must have a default location to upload cards");
  }

  // Check for existing active batch for this location today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let batch = await prisma.connectCardBatch.findFirst({
    where: {
      organizationId,
      locationId: user.defaultLocationId,
      status: "PENDING",
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  // Create new batch if none exists
  if (!batch) {
    const batchName = formatBatchName(user.defaultLocation.name, new Date());

    batch = await prisma.connectCardBatch.create({
      data: {
        organizationId,
        locationId: user.defaultLocationId,
        uploadedBy: userId,
        name: batchName,
        status: "PENDING",
        cardCount: 0,
      },
    });
  }

  return {
    id: batch.id,
    name: batch.name,
    locationId: batch.locationId,
    cardCount: batch.cardCount,
  };
}

/**
 * Get batches for review with location-based access control
 * Staff see only their location, admins see all
 */
export async function getBatchesForReview(
  userId: string,
  organizationId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      canSeeAllLocations: true,
      defaultLocationId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Build where clause based on permissions
  const where: {
    organizationId: string;
    locationId?: string;
  } = { organizationId };

  // Restrict to user's location unless they have multi-location access
  const isOwner = user.role === "church_owner";
  const isMultiCampusAdmin = user.canSeeAllLocations;

  if (!isOwner && !isMultiCampusAdmin && user.defaultLocationId) {
    where.locationId = user.defaultLocationId;
  }

  // Fetch batches with card counts (only EXTRACTED cards awaiting review)
  return prisma.connectCardBatch.findMany({
    where,
    include: {
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          cards: {
            where: {
              status: "EXTRACTED", // Only count cards awaiting review
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get single batch with all cards
 */
export async function getBatchWithCards(batchId: string) {
  return prisma.connectCardBatch.findUnique({
    where: { id: batchId },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      cards: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

/**
 * Update batch status
 */
export async function updateBatchStatus(
  batchId: string,
  status: BatchStatus
): Promise<void> {
  await prisma.connectCardBatch.update({
    where: { id: batchId },
    data: { status },
  });
}

/**
 * Increment batch card count
 */
export async function incrementBatchCardCount(batchId: string): Promise<void> {
  await prisma.connectCardBatch.update({
    where: { id: batchId },
    data: {
      cardCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Get batch statistics for dashboard
 */
export async function getBatchStats(organizationId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      canSeeAllLocations: true,
      defaultLocationId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const where: {
    organizationId: string;
    locationId?: string;
  } = { organizationId };

  const isOwner = user.role === "church_owner";
  const isMultiCampusAdmin = user.canSeeAllLocations;

  if (!isOwner && !isMultiCampusAdmin && user.defaultLocationId) {
    where.locationId = user.defaultLocationId;
  }

  const [pending, inReview, completed] = await Promise.all([
    prisma.connectCardBatch.count({
      where: { ...where, status: "PENDING" },
    }),
    prisma.connectCardBatch.count({
      where: { ...where, status: "IN_REVIEW" },
    }),
    prisma.connectCardBatch.count({
      where: { ...where, status: "COMPLETED" },
    }),
  ]);

  return {
    pending,
    inReview,
    completed,
    total: pending + inReview + completed,
  };
}
