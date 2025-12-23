/**
 * Connect Card Normalization Utilities
 *
 * Pure functions for normalizing AI Vision extracted data.
 * Extracted for testability and reuse.
 */

/**
 * Normalize Visit Status
 *
 * Intelligently maps AI-extracted visit status text to our standard options.
 * Handles variations in terminology across different church connect cards.
 *
 * Standard options: "First Visit", "Second Visit", "Regular attendee", "Other"
 *
 * @param visitStatus - Raw text extracted by AI from connect card
 * @returns Normalized visit status or null if unrecognized/not marked
 */
export function normalizeVisitStatus(
  visitStatus: string | null
): string | null {
  if (!visitStatus) return null;

  const normalized = visitStatus.toLowerCase().trim();

  // First Visit variations (common checkbox labels across churches)
  if (
    normalized.includes("first") ||
    normalized.includes("i'm new") ||
    normalized.includes("im new") ||
    normalized.includes("new here") ||
    normalized.includes("new guest") ||
    (normalized.includes("guest") && !normalized.includes("return"))
  ) {
    return "First Visit";
  }

  // Second Visit variations
  if (normalized.includes("second") || normalized.includes("2nd")) {
    return "Second Visit";
  }

  // Regular attendee variations
  if (
    normalized.includes("regular") ||
    normalized.includes("member") ||
    normalized.includes("returning") ||
    normalized.includes("frequent") ||
    normalized.includes("attend")
  ) {
    return "Regular attendee";
  }

  // If we can't confidently map it, store the original text
  // Staff will correct it during review
  return visitStatus;
}

/**
 * Normalize Interests
 *
 * Maps AI-extracted interest checkbox labels to our standard interest options.
 * Different churches use different labels for similar interests.
 *
 * @param interests - Raw array of checkbox labels from AI extraction
 * @returns Normalized array of interests matching our standard options
 */
export function normalizeInterests(interests: string[] | null): string[] {
  if (!interests || interests.length === 0) return [];

  const normalized: string[] = [];

  for (const interest of interests) {
    const lower = interest.toLowerCase().trim();

    // Volunteering variations
    if (
      lower.includes("volunteer") ||
      lower.includes("serve") ||
      lower.includes("serving") ||
      lower.includes("get involved") ||
      lower.includes("help out")
    ) {
      if (!normalized.includes("Volunteering")) {
        normalized.push("Volunteering");
      }
      continue;
    }

    // Small Groups variations
    if (
      lower.includes("small group") ||
      lower.includes("life group") ||
      lower.includes("connect group") ||
      lower.includes("community group") ||
      lower.includes("bible study")
    ) {
      if (!normalized.includes("Small Groups")) {
        normalized.push("Small Groups");
      }
      continue;
    }

    // Youth Ministry variations
    if (
      lower.includes("youth") ||
      lower.includes("student") ||
      lower.includes("teen")
    ) {
      if (!normalized.includes("Youth Ministry")) {
        normalized.push("Youth Ministry");
      }
      continue;
    }

    // Kids Ministry variations
    if (
      lower.includes("kid") ||
      lower.includes("child") ||
      lower.includes("nursery")
    ) {
      if (!normalized.includes("Kids Ministry")) {
        normalized.push("Kids Ministry");
      }
      continue;
    }

    // Worship variations
    if (
      lower.includes("worship") ||
      lower.includes("music") ||
      lower.includes("band") ||
      lower.includes("choir")
    ) {
      if (!normalized.includes("Worship")) {
        normalized.push("Worship");
      }
      continue;
    }

    // Missions variations
    if (lower.includes("mission") || lower.includes("outreach")) {
      if (!normalized.includes("Missions")) {
        normalized.push("Missions");
      }
      continue;
    }

    // If we can't map it, keep the original (staff can review)
    // But only if it's not already in the list
    if (!normalized.includes(interest)) {
      normalized.push(interest);
    }
  }

  return normalized;
}

/**
 * Normalize Keywords
 *
 * Ensures all detected campaign keywords are stored in lowercase.
 * Keywords are standalone words/phrases visitors write on cards
 * (e.g., "impacted", "coffee oasis", "next steps").
 *
 * @param keywords - Raw array of keywords from AI extraction
 * @returns Normalized array of lowercase keywords
 */
export function normalizeKeywords(keywords: string[] | null): string[] {
  if (!keywords || keywords.length === 0) return [];

  return keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0);
}
