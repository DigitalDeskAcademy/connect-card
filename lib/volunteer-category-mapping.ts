/**
 * Volunteer Category Mapping Utility
 *
 * Maps between:
 * - Display names used in team management UI ("Kids Ministry", "Worship Team")
 * - Prisma enum values used in connect cards and volunteers ("KIDS_MINISTRY", "WORSHIP_TEAM")
 *
 * This mapping layer allows the team management UI to use human-readable names
 * while maintaining compatibility with the enum-based volunteer system.
 */

import type { VolunteerCategoryType } from "@/lib/generated/prisma";

/**
 * Mapping from display names to enum values
 */
export const CATEGORY_DISPLAY_TO_ENUM: Record<string, VolunteerCategoryType> = {
  "Kids Ministry": "KIDS_MINISTRY",
  "Worship Team": "WORSHIP_TEAM",
  Hospitality: "HOSPITALITY",
  "Parking & Traffic": "PARKING",
  "Connection Team": "GREETER", // Greeters handle connection/welcome
  "Audio/Visual Tech": "AV_TECH",
  "Prayer Team": "PRAYER_TEAM",
  "Facility Setup": "USHER", // Ushers often handle facility setup
  General: "GENERAL",
};

/**
 * Mapping from enum values to display names
 */
export const CATEGORY_ENUM_TO_DISPLAY: Record<VolunteerCategoryType, string> = {
  KIDS_MINISTRY: "Kids Ministry",
  WORSHIP_TEAM: "Worship Team",
  HOSPITALITY: "Hospitality",
  PARKING: "Parking & Traffic",
  GREETER: "Connection Team",
  AV_TECH: "Audio/Visual Tech",
  PRAYER_TEAM: "Prayer Team",
  USHER: "Facility Setup",
  GENERAL: "General",
  OTHER: "Other",
};

/**
 * Convert display name to enum value
 */
export function displayToEnum(
  displayName: string
): VolunteerCategoryType | null {
  return CATEGORY_DISPLAY_TO_ENUM[displayName] || null;
}

/**
 * Convert enum value to display name
 */
export function enumToDisplay(enumValue: VolunteerCategoryType): string {
  return CATEGORY_ENUM_TO_DISPLAY[enumValue] || enumValue;
}

/**
 * Check if a leader's display-name categories include the enum category
 *
 * Used in the review UI to filter volunteer leaders by category.
 *
 * @param leaderCategories - Array of display names from User.volunteerCategories
 * @param volunteerCategory - Enum value from connect card (e.g., "KIDS_MINISTRY")
 * @returns true if the leader can handle this category
 */
export function leaderMatchesCategory(
  leaderCategories: string[],
  volunteerCategory: string | null
): boolean {
  if (!volunteerCategory) return false;

  // Convert each leader's display name to enum and check for match
  return leaderCategories.some(displayName => {
    const enumValue = displayToEnum(displayName);
    return enumValue === volunteerCategory;
  });
}

/**
 * Get all enum values for a leader's display-name categories
 *
 * @param leaderCategories - Array of display names
 * @returns Array of enum values
 */
export function getLeaderEnumCategories(
  leaderCategories: string[]
): VolunteerCategoryType[] {
  return leaderCategories
    .map(displayToEnum)
    .filter((e): e is VolunteerCategoryType => e !== null);
}
