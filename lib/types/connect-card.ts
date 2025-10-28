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
 * @property first_time_visitor - Boolean flag for first-time church visitors
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
  first_time_visitor: boolean | null;
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
  "Volunteer",
] as const;

export type InterestOption = (typeof INTEREST_OPTIONS)[number];
