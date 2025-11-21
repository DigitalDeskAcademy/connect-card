/**
 * Connect Card Type Definitions
 *
 * Shared types for connect card processing across the application.
 * Used by upload, extraction, review, and analytics features.
 */

/**
 * Extracted data structure from Claude Vision API
 *
 * Represents the structured JSON data extracted from a handwritten connect card.
 * All fields are nullable since OCR may fail to extract certain information.
 *
 * @property name - Visitor's full name
 * @property email - Email address for follow-up communication
 * @property phone - Phone number for SMS and call follow-up
 * @property prayer_request - Prayer requests or spiritual needs
 * @property visit_status - Actual text of marked visit status option (e.g., "First Visit", "New Guest", "Returning")
 * @property first_time_visitor - (Legacy) Boolean flag for first-time church visitors - kept for backwards compatibility
 * @property interests - Array of ministry interests (Membership, Baptism, Service, Volunteer)
 * @property address - Physical mailing address
 * @property age_group - Age range or demographic category
 * @property family_info - Family members, children, or household information
 * @property additional_notes - Any other information extracted from the card
 */
export interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request: string | null;
  visit_status?: string | null; // NEW: Extract actual text from card
  first_time_visitor?: boolean | null; // Legacy field
  interests: string[] | null;
  address: string | null;
  age_group: string | null;
  family_info: string | null;
  additional_notes?: unknown;
}

/**
 * Visit status options for connect card review
 *
 * Used in the review queue UI for staff to categorize visitors.
 */
export const VISIT_STATUS_OPTIONS = [
  "First Visit",
  "Second Visit",
  "Regular attendee",
  "Other",
] as const;

export type VisitStatus = (typeof VISIT_STATUS_OPTIONS)[number];

/**
 * Ministry interest options for connect card review
 *
 * Used in the review queue UI for checkbox selections.
 */
export const INTEREST_OPTIONS = [
  "Membership",
  "Baptism",
  "Service",
  "Volunteering",
] as const;

export type InterestOption = (typeof INTEREST_OPTIONS)[number];

/**
 * Volunteer category options
 *
 * IMPORTANT: This imports from the volunteer management schema (zodSchemas.ts)
 * to maintain a single source of truth across the application.
 *
 * The enum values (e.g., "GENERAL", "KIDS_MINISTRY") are formatted for display
 * using the formatVolunteerCategoryLabel() helper function below.
 */
import { volunteerCategoryTypes } from "@/lib/zodSchemas";

export const VOLUNTEER_CATEGORY_OPTIONS = volunteerCategoryTypes;

export type VolunteerCategory = (typeof VOLUNTEER_CATEGORY_OPTIONS)[number];

/**
 * Format volunteer category enum for display
 *
 * Converts database enum format to human-readable labels:
 * - GENERAL → General
 * - KIDS_MINISTRY → Kids Ministry
 * - AV_TECH → AV Tech
 *
 * @param category - Enum value from VOLUNTEER_CATEGORY_OPTIONS
 * @returns Formatted display label
 */
export function formatVolunteerCategoryLabel(category: string): string {
  return category
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
