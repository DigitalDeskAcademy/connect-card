import "server-only";

import { prisma } from "@/lib/db";

export interface ConnectCardAnalytics {
  // This week's metrics
  thisWeek: {
    totalCards: number;
    firstTimeVisitors: number;
    prayerRequests: number;
    volunteersInterested: number;
  };

  // 4-week averages for comparison
  fourWeekAverage: {
    totalCards: number;
    firstTimeVisitors: number;
    prayerRequests: number;
    volunteersInterested: number;
  };

  // Trends (percentage change vs 4-week average)
  trends: {
    totalCards: number; // e.g., 12.5 means +12.5%
    firstTimeVisitors: number;
    prayerRequests: number;
    volunteersInterested: number;
  };

  // Top 3 prayer categories
  topPrayerCategories: Array<{
    category: string;
    count: number;
  }>;

  // Legacy fields (kept for backward compatibility)
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
 * @param locationId - Optional location ID to filter by campus (undefined = all locations)
 * @returns Analytics data
 */
export async function getConnectCardAnalytics(
  organizationId: string,
  locationId?: string
): Promise<ConnectCardAnalytics> {
  const now = new Date();

  // Helper: Get Sunday of the current week
  function getSundayOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday is 0
    const sunday = new Date(date);
    sunday.setDate(diff);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  // Get this week's boundaries (Sunday-Saturday)
  const thisWeekStart = getSundayOfWeek(now);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7); // Next Sunday

  // Get 4 weeks ago
  const fourWeeksAgo = new Date(thisWeekStart);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 weeks * 7 days

  // Fetch cards from last 4 weeks (for averaging) + all time (for legacy)
  const [recentCards, allCards] = await Promise.all([
    // Last 4 weeks including this week
    prisma.connectCard.findMany({
      where: {
        organizationId,
        status: "REVIEWED", // Only count reviewed/approved cards
        scannedAt: {
          gte: fourWeeksAgo,
          lt: thisWeekEnd,
        },
        ...(locationId && { locationId }),
      },
      select: {
        scannedAt: true,
        visitType: true,
        prayerRequest: true,
        interests: true,
        extractedData: true,
      },
    }),
    // All time (for legacy compatibility)
    prisma.connectCard.findMany({
      where: {
        organizationId,
        status: "REVIEWED", // Only count reviewed/approved cards
        ...(locationId && { locationId }),
      },
      select: {
        scannedAt: true,
        visitType: true,
        prayerRequest: true,
        interests: true,
        extractedData: true,
      },
    }),
  ]);

  // Helper function to calculate metrics for a set of cards
  function calculateMetrics(cards: typeof recentCards) {
    const totalCards = cards.length;
    const firstTimeVisitors = cards.filter(card =>
      card.visitType?.toLowerCase().includes("first")
    ).length;
    const prayerRequests = cards.filter(
      card => card.prayerRequest && card.prayerRequest.trim().length > 0
    ).length;
    const volunteersInterested = cards.filter(card => {
      if (
        card.interests.some(interest =>
          interest.toLowerCase().includes("volunteer")
        )
      ) {
        return true;
      }
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

    return {
      totalCards,
      firstTimeVisitors,
      prayerRequests,
      volunteersInterested,
    };
  }

  // This week's cards
  const thisWeekCards = recentCards.filter(
    card => card.scannedAt >= thisWeekStart && card.scannedAt < thisWeekEnd
  );

  // Calculate this week's metrics
  const thisWeek = calculateMetrics(thisWeekCards);

  // Calculate 4-week average (divide by 4)
  const allRecentMetrics = calculateMetrics(recentCards);
  const fourWeekAverage = {
    totalCards: Math.round(allRecentMetrics.totalCards / 4),
    firstTimeVisitors: Math.round(allRecentMetrics.firstTimeVisitors / 4),
    prayerRequests: Math.round(allRecentMetrics.prayerRequests / 4),
    volunteersInterested: Math.round(allRecentMetrics.volunteersInterested / 4),
  };

  // Calculate trends (percentage change vs average)
  function calculateTrend(current: number, average: number): number {
    if (average === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - average) / average) * 100);
  }

  const trends = {
    totalCards: calculateTrend(thisWeek.totalCards, fourWeekAverage.totalCards),
    firstTimeVisitors: calculateTrend(
      thisWeek.firstTimeVisitors,
      fourWeekAverage.firstTimeVisitors
    ),
    prayerRequests: calculateTrend(
      thisWeek.prayerRequests,
      fourWeekAverage.prayerRequests
    ),
    volunteersInterested: calculateTrend(
      thisWeek.volunteersInterested,
      fourWeekAverage.volunteersInterested
    ),
  };

  // Extract top 3 prayer categories from this week's cards
  const prayerCategoryCount = new Map<string, number>();
  thisWeekCards.forEach(card => {
    if (card.extractedData && typeof card.extractedData === "object") {
      const data = card.extractedData as Record<string, unknown>;
      const category = data.prayerCategory as string | undefined;
      if (category && category !== "N/A" && category.trim().length > 0) {
        prayerCategoryCount.set(
          category,
          (prayerCategoryCount.get(category) || 0) + 1
        );
      }
    }
  });

  const topPrayerCategories = Array.from(prayerCategoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));

  // Legacy calculations (all time)
  const legacyMetrics = calculateMetrics(allCards);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCount = allCards.filter(
    card => new Date(card.scannedAt) >= todayStart
  ).length;

  return {
    thisWeek,
    fourWeekAverage,
    trends,
    topPrayerCategories,
    // Legacy fields
    totalCards: legacyMetrics.totalCards,
    firstTimeVisitors: legacyMetrics.firstTimeVisitors,
    prayerRequests: legacyMetrics.prayerRequests,
    volunteersInterested: legacyMetrics.volunteersInterested,
    todayCount,
    weekCount: thisWeek.totalCards,
  };
}

/**
 * Get Recent Connect Cards
 *
 * Fetches the most recent connect cards for display
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @param limit - Number of cards to return (default: 50)
 * @param locationId - Optional location ID to filter by campus (undefined = all locations)
 * @returns Array of connect cards
 */
export async function getRecentConnectCards(
  organizationId: string,
  limit: number = 50,
  locationId?: string
) {
  return await prisma.connectCard.findMany({
    where: {
      organizationId,
      status: "REVIEWED", // Only show reviewed/approved cards
      // Only filter by locationId if provided (undefined means all locations)
      ...(locationId && { locationId }),
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

export interface ConnectCardChartDataPoint {
  weekStart: string; // YYYY-MM-DD format (Sunday)
  weekEnd: string; // YYYY-MM-DD format (Saturday)
  weekLabel: string; // "Jan 5 - Jan 11" for display
  totalCards: number;
  firstTimeVisitors: number;
  prayerRequests: number;
}

/**
 * Get Connect Card Chart Data
 *
 * Fetches weekly aggregated connect card data for charting
 * Returns data points for each week in the last 12 weeks
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @param locationId - Optional location ID to filter by campus (undefined = all locations)
 * @returns Array of weekly data points for chart visualization
 */
export async function getConnectCardChartData(
  organizationId: string,
  locationId?: string
): Promise<ConnectCardChartDataPoint[]> {
  // Calculate date range (last 52 weeks = 1 year, UI filters as needed)
  const now = new Date();
  const weeksToShow = 52;

  // Helper: Get Sunday of the week containing a given date
  function getSundayOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday is 0
    const sunday = new Date(date);
    sunday.setDate(diff);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  // Get the most recent Sunday (start of current week)
  const currentWeekStart = getSundayOfWeek(now);

  // Fetch all cards from 12 weeks ago until now
  const startDate = new Date(currentWeekStart);
  startDate.setDate(startDate.getDate() - weeksToShow * 7);

  const cards = await prisma.connectCard.findMany({
    where: {
      organizationId,
      status: "REVIEWED", // Only chart reviewed/approved cards
      scannedAt: {
        gte: startDate,
        lte: now,
      },
      ...(locationId && { locationId }),
    },
    select: {
      scannedAt: true,
      visitType: true,
      prayerRequest: true,
    },
  });

  // Create week buckets
  const weekMap = new Map<string, ConnectCardChartDataPoint>();

  for (let i = 0; i < weeksToShow; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - (weeksToShow - 1 - i) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Saturday

    const weekStartKey = weekStart.toISOString().split("T")[0];
    const weekEndKey = weekEnd.toISOString().split("T")[0];

    // Format week label: "Jan 5 - Jan 11"
    const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    weekMap.set(weekStartKey, {
      weekStart: weekStartKey,
      weekEnd: weekEndKey,
      weekLabel,
      totalCards: 0,
      firstTimeVisitors: 0,
      prayerRequests: 0,
    });
  }

  // Aggregate cards into weekly buckets
  cards.forEach(card => {
    const cardSunday = getSundayOfWeek(card.scannedAt);
    const weekKey = cardSunday.toISOString().split("T")[0];
    const dataPoint = weekMap.get(weekKey);

    if (dataPoint) {
      dataPoint.totalCards += 1;

      // Count first-time visitors
      if (card.visitType?.toLowerCase().includes("first")) {
        dataPoint.firstTimeVisitors += 1;
      }

      // Count prayer requests
      if (card.prayerRequest && card.prayerRequest.trim().length > 0) {
        dataPoint.prayerRequests += 1;
      }
    }
  });

  // Convert map to sorted array
  return Array.from(weekMap.values()).sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  );
}
