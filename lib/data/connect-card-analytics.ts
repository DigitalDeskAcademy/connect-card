import "server-only";

import { prisma } from "@/lib/db";

export interface ConnectCardAnalytics {
  totalCards: number;
  firstTimeVisitors: number;
  prayerRequests: number;
  volunteersInterested: number;
  todayCount: number;
  weekCount: number;
}

/**
 * Get Connect Card Analytics
 *
 * Fetches aggregated statistics for connect cards
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @returns Analytics data
 */
export async function getConnectCardAnalytics(
  organizationId: string
): Promise<ConnectCardAnalytics> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  // Get all cards for this organization
  const allCards = await prisma.connectCard.findMany({
    where: {
      organizationId,
      status: "EXTRACTED",
    },
    select: {
      scannedAt: true,
      visitType: true,
      prayerRequest: true,
      interests: true,
      extractedData: true,
    },
  });

  // Calculate metrics
  const totalCards = allCards.length;

  const firstTimeVisitors = allCards.filter(card =>
    card.visitType?.toLowerCase().includes("first")
  ).length;

  const prayerRequests = allCards.filter(
    card => card.prayerRequest && card.prayerRequest.trim().length > 0
  ).length;

  // Check for volunteer interest in various ways
  const volunteersInterested = allCards.filter(card => {
    // Check interests array
    if (
      card.interests.some(interest =>
        interest.toLowerCase().includes("volunteer")
      )
    ) {
      return true;
    }
    // Check extractedData if available
    if (card.extractedData && typeof card.extractedData === "object") {
      const data = card.extractedData as Record<string, unknown>;
      if (data.interests && Array.isArray(data.interests)) {
        return data.interests.some((interest: string) =>
          interest.toLowerCase().includes("volunteer")
        );
      }
    }
    return false;
  }).length;

  const todayCount = allCards.filter(
    card => new Date(card.scannedAt) >= todayStart
  ).length;

  const weekCount = allCards.filter(
    card => new Date(card.scannedAt) >= weekStart
  ).length;

  return {
    totalCards,
    firstTimeVisitors,
    prayerRequests,
    volunteersInterested,
    todayCount,
    weekCount,
  };
}

/**
 * Get Recent Connect Cards
 *
 * Fetches the most recent connect cards for display
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @param limit - Number of cards to return (default: 50)
 * @returns Array of connect cards
 */
export async function getRecentConnectCards(
  organizationId: string,
  limit: number = 50
) {
  return await prisma.connectCard.findMany({
    where: {
      organizationId,
      status: "EXTRACTED",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      visitType: true,
      prayerRequest: true,
      interests: true,
      scannedAt: true,
      createdAt: true,
    },
    orderBy: {
      scannedAt: "desc",
    },
    take: limit,
  });
}
