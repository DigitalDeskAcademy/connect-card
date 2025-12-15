/**
 * Prayer Priority Detection Utilities
 *
 * Automatically detects critical/urgent prayer requests based on keywords.
 * Used to surface the most pressing prayer needs to the prayer team.
 */

/**
 * Keywords that indicate a critical/urgent prayer need.
 * These prayers should be surfaced at the top of prayer sessions.
 */
export const CRITICAL_KEYWORDS = [
  // Life-threatening conditions
  "cancer",
  "tumor",
  "terminal",
  "hospice",
  "dying",
  "life support",
  "intensive care",
  "icu",
  "stage 4",
  "stage four",
  "metastatic",
  "palliative",

  // Death and grief
  "passed away",
  "death",
  "died",
  "funeral",
  "passing",
  "lost my",
  "lost her",
  "lost his",
  "grieving",

  // Emergency situations
  "emergency",
  "critical condition",
  "accident",
  "crash",
  "trauma",
  "surgery today",
  "surgery tomorrow",
  "urgent surgery",

  // Mental health crisis
  "suicide",
  "suicidal",
  "self-harm",
  "overdose",
  "crisis",

  // Serious trauma
  "abuse",
  "assault",
  "violence",
  "attacked",
];

/**
 * Category display configuration for prayer sections
 */
export const PRAYER_CATEGORIES = {
  CRITICAL: {
    label: "Critical",
    icon: "AlertTriangle",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
  },
  Health: {
    label: "Health",
    icon: "Heart",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  Family: {
    label: "Family",
    icon: "Users",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  Salvation: {
    label: "Salvation",
    icon: "Sparkles",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  Financial: {
    label: "Financial",
    icon: "DollarSign",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  "Work/Career": {
    label: "Work & Career",
    icon: "Briefcase",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  Relationships: {
    label: "Relationships",
    icon: "HeartHandshake",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  "Spiritual Growth": {
    label: "Spiritual Growth",
    icon: "BookOpen",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  Other: {
    label: "General",
    icon: "MessageCircle",
    color: "text-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
  PRIVATE: {
    label: "Private",
    icon: "Lock",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
  },
} as const;

export type PrayerCategoryKey = keyof typeof PRAYER_CATEGORIES;

/**
 * Check if prayer request text contains critical keywords
 *
 * @param requestText - The prayer request text to analyze
 * @returns true if the prayer contains critical keywords
 */
export function isCriticalPrayer(requestText: string): boolean {
  const lowerText = requestText.toLowerCase();
  return CRITICAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Get the display category for a prayer request
 *
 * Priority order:
 * 1. Critical (based on keywords, regardless of category)
 * 2. Private (shown in separate section)
 * 3. Detected category
 * 4. "Other" fallback
 *
 * @param prayer - Prayer request with category, isPrivate, and request text
 * @returns The display category key
 */
export function getPrayerDisplayCategory(prayer: {
  request: string;
  category: string | null;
  isPrivate: boolean;
}): PrayerCategoryKey {
  // Critical prayers always go to critical section (unless private)
  if (!prayer.isPrivate && isCriticalPrayer(prayer.request)) {
    return "CRITICAL";
  }

  // Private prayers go to private section
  if (prayer.isPrivate) {
    return "PRIVATE";
  }

  // Use detected category or fall back to "Other"
  if (prayer.category && prayer.category in PRAYER_CATEGORIES) {
    return prayer.category as PrayerCategoryKey;
  }

  return "Other";
}

/**
 * Group prayers by display category
 *
 * Returns prayers organized by category, with critical first and private last.
 *
 * @param prayers - Array of prayer requests
 * @returns Object with prayers grouped by category key
 */
export function groupPrayersByCategory<
  T extends { request: string; category: string | null; isPrivate: boolean },
>(prayers: T[]): Record<PrayerCategoryKey, T[]> {
  const groups: Record<PrayerCategoryKey, T[]> = {
    CRITICAL: [],
    Health: [],
    Family: [],
    Salvation: [],
    Financial: [],
    "Work/Career": [],
    Relationships: [],
    "Spiritual Growth": [],
    Other: [],
    PRIVATE: [],
  };

  for (const prayer of prayers) {
    const category = getPrayerDisplayCategory(prayer);
    groups[category].push(prayer);
  }

  return groups;
}

/**
 * Get category display order (Critical first, Private last)
 */
export const CATEGORY_ORDER: PrayerCategoryKey[] = [
  "CRITICAL",
  "Health",
  "Family",
  "Salvation",
  "Financial",
  "Work/Career",
  "Relationships",
  "Spiritual Growth",
  "Other",
  "PRIVATE",
];

/**
 * Get stats for a group of prayers
 */
export function getPrayerStats(
  prayers: Array<{
    request: string;
    category: string | null;
    isPrivate: boolean;
    status: string;
  }>
) {
  const critical = prayers.filter(
    p => !p.isPrivate && isCriticalPrayer(p.request)
  ).length;
  const prayed = prayers.filter(p => p.status === "ANSWERED").length;

  return {
    total: prayers.length,
    critical,
    prayed,
    remaining: prayers.length - prayed,
  };
}
