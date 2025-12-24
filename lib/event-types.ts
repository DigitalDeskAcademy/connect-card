import type {
  EventType,
  EventStatus,
  VolunteerCategoryType,
} from "@/lib/generated/prisma";

// =============================================================================
// Event List Item Type (for client components)
// =============================================================================

/**
 * Event list item type for display in UI components.
 * Mirrors the shape returned by getEventsForScope but defined separately
 * to allow import in client components.
 */
export interface EventListItem {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  eventType: EventType;
  status: EventStatus;
  category: VolunteerCategoryType | null;
  locationId: string | null;
  leaderId: string;
  requiresBackgroundCheck: boolean;
  volunteerPoolScope: string;
  inviteMessage: string | null;
  confirmationMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  location: {
    id: string;
    name: string;
  } | null;
  leader: {
    id: string;
    name: string;
    email: string;
  };
  sessions: {
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    slotsNeeded: number;
    slotsFilled: number;
  }[];
  _count: {
    sessions: number;
  };
}

// =============================================================================
// Event Type Constants
// =============================================================================

/**
 * Event Type Labels
 *
 * Human-readable labels for event types.
 * Shared between client and server components.
 */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  SUNDAY_SERVICE: "Sunday Service",
  MIDWEEK_SERVICE: "Midweek Service",
  YOUTH: "Youth",
  KIDS: "Kids",
  OUTREACH: "Outreach",
  SPECIAL_EVENT: "Special Event",
  HOLIDAY: "Holiday",
  OTHER: "Other",
};

/**
 * All Event Types
 *
 * Array of event types with labels for dropdowns/selects.
 */
export const ALL_EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "SUNDAY_SERVICE", label: "Sunday Service" },
  { value: "MIDWEEK_SERVICE", label: "Midweek Service" },
  { value: "YOUTH", label: "Youth" },
  { value: "KIDS", label: "Kids" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "SPECIAL_EVENT", label: "Special Event" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "OTHER", label: "Other" },
];
