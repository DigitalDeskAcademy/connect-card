/**
 * Prayer Request Type Definitions
 *
 * Shared types for prayer request management across the application.
 * Used by prayer list UI, assignment workflow, and follow-up tracking.
 */

import type {
  PrayerRequest,
  PrayerRequestStatus,
} from "@/lib/generated/prisma";

/**
 * Prayer request category options
 *
 * Used for filtering and organizing prayer requests by type.
 * Categories align with common church prayer ministry needs.
 */
export const PRAYER_CATEGORY_OPTIONS = [
  "Health",
  "Family",
  "Salvation",
  "Financial",
  "Relationships",
  "Spiritual Growth",
  "Work/Career",
  "Other",
] as const;

export type PrayerCategory = (typeof PRAYER_CATEGORY_OPTIONS)[number];

/**
 * Prayer request with relations for UI display
 *
 * Includes related data needed for the prayer request table and detail views.
 */
export interface PrayerRequestWithRelations extends PrayerRequest {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  location?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  connectCard?: {
    id: string;
    name: string | null;
    email: string | null;
    scannedAt: Date;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * Prayer request list item for table display
 *
 * Flattened structure optimized for table rendering with only essential fields.
 */
export interface PrayerRequestListItem {
  id: string;
  request: string;
  category: string | null;
  status: PrayerRequestStatus;
  isPrivate: boolean;
  isUrgent: boolean;
  submittedBy: string | null;
  assignedToName: string | null;
  locationName: string | null;
  createdAt: Date;
  followUpDate: Date | null;
  answeredDate: Date | null;
}

/**
 * Prayer request filter options
 *
 * Used for filtering the prayer request list.
 */
export interface PrayerRequestFilters {
  status?: PrayerRequestStatus;
  locationId?: string;
  category?: string;
  isPrivate?: boolean;
  assignedToId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Prayer request creation input
 *
 * Data required to create a new prayer request.
 */
export interface CreatePrayerRequestInput {
  request: string;
  category?: string;
  isPrivate?: boolean;
  isUrgent?: boolean;
  locationId?: string;
  connectCardId?: string;
  submittedBy?: string;
  submitterEmail?: string;
  submitterPhone?: string;
}

/**
 * Prayer request update input
 *
 * Data that can be updated on an existing prayer request.
 */
export interface UpdatePrayerRequestInput {
  request?: string;
  category?: string;
  isPrivate?: boolean;
  isUrgent?: boolean;
  status?: PrayerRequestStatus;
  assignedToId?: string;
  followUpDate?: Date;
  answeredDate?: Date;
  answeredNotes?: string;
}

/**
 * Prayer request assignment input
 *
 * Data required to assign a prayer request to a team member.
 */
export interface AssignPrayerRequestInput {
  prayerRequestId: string;
  assignedToId: string;
  assignedToName: string;
}

/**
 * Mark prayer as answered input
 *
 * Data required to mark a prayer request as answered.
 */
export interface MarkAnsweredInput {
  prayerRequestId: string;
  answeredDate: Date;
  answeredNotes?: string;
}

/**
 * Prayer request statistics
 *
 * Aggregate data for analytics dashboard.
 */
export interface PrayerRequestStats {
  total: number;
  pending: number;
  assigned: number;
  praying: number;
  answered: number;
  private: number;
  urgent: number;
  thisWeek: number;
  answeredThisMonth: number;
}
