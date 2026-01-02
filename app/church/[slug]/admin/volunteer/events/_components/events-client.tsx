"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EventCard,
  getCapacityStatus,
  type CapacityStatus,
} from "./event-card";
import { EventFormDialog } from "./event-form-dialog";
import {
  IconPlus,
  IconCalendar,
  IconCalendarEvent,
  IconFilter,
  IconSettings,
  IconChartBar,
  IconClock,
  IconUsers,
} from "@tabler/icons-react";
import { NavTabs } from "@/components/layout/nav-tabs";
import {
  Toolbar,
  ToolbarAction,
  type ViewMode,
} from "@/components/layout/toolbar";
import type { EventListItem } from "@/lib/event-types";
import type { EventType } from "@/lib/generated/prisma";

// =============================================================================
// Types
// =============================================================================

type DatePeriod = "all" | "upcoming" | "past" | "thisWeek" | "thisMonth";
type CapacityFilter = "all" | "urgent" | "partial" | "full";

interface Location {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface EventTypeOption {
  value: EventType;
  label: string;
}

interface EventsClientProps {
  events: EventListItem[];
  slug: string;
  organizationId: string;
  locations: Location[];
  teamMembers: TeamMember[];
  eventTypes: EventTypeOption[];
  initialEventTypeFilter?: string;
  canDelete: boolean;
}

// =============================================================================
// Date Period Labels
// =============================================================================

const DATE_PERIOD_OPTIONS: { value: DatePeriod; label: string }[] = [
  { value: "all", label: "All Dates" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
];

const CAPACITY_FILTER_OPTIONS: { value: CapacityFilter; label: string }[] = [
  { value: "all", label: "All Capacity" },
  { value: "urgent", label: "Needs Volunteers" },
  { value: "partial", label: "Partially Filled" },
  { value: "full", label: "Fully Staffed" },
];

// =============================================================================
// Date Filter Helpers
// =============================================================================

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday = 0
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date): Date {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0); // Last day of previous month
  d.setHours(23, 59, 59, 999);
  return d;
}

function filterByDatePeriod(
  events: EventListItem[],
  period: DatePeriod
): EventListItem[] {
  if (period === "all") return events;

  const now = new Date();

  return events.filter(event => {
    // Get the earliest session date for this event
    // If no sessions, use createdAt as fallback
    const firstSessionDate =
      event.sessions.length > 0
        ? new Date(
            Math.min(...event.sessions.map(s => new Date(s.date).getTime()))
          )
        : new Date(event.createdAt);

    switch (period) {
      case "upcoming":
        return firstSessionDate >= getStartOfDay(now);
      case "past":
        return firstSessionDate < getStartOfDay(now);
      case "thisWeek":
        return (
          firstSessionDate >= getStartOfWeek(now) &&
          firstSessionDate <= getEndOfWeek(now)
        );
      case "thisMonth":
        return (
          firstSessionDate >= getStartOfMonth(now) &&
          firstSessionDate <= getEndOfMonth(now)
        );
      default:
        return true;
    }
  });
}

/**
 * Get capacity status for an event
 */
function getEventCapacityStatus(event: EventListItem): CapacityStatus {
  const totalSlotsFilled = event.sessions.reduce(
    (sum, s) => sum + s.slotsFilled,
    0
  );
  const totalSlotsNeeded = event.sessions.reduce(
    (sum, s) => sum + s.slotsNeeded,
    0
  );
  return getCapacityStatus(totalSlotsFilled, totalSlotsNeeded).status;
}

/**
 * Filter events by capacity status
 */
function filterByCapacity(
  events: EventListItem[],
  capacityFilter: CapacityFilter
): EventListItem[] {
  if (capacityFilter === "all") return events;

  return events.filter(event => {
    const status = getEventCapacityStatus(event);
    return status === capacityFilter;
  });
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Events Client Component
 *
 * Clean, filterable view for volunteer events with:
 * - Toolbar with search, filters, and view toggles
 * - Card/List/Calendar view options
 * - NavTabs for different event views
 */
export function EventsClient({
  events,
  slug,
  organizationId,
  locations,
  teamMembers,
  eventTypes,
  initialEventTypeFilter,
  canDelete,
}: EventsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // View mode state (card, list, calendar)
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Event type filter state
  const [eventTypeFilter, setEventTypeFilter] = useState<string>(
    initialEventTypeFilter ?? "all"
  );

  // Date period filter state
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("upcoming");

  // Capacity filter state
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>("all");

  // Filter events by type, date period, capacity, and search
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by event type
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter(e => e.eventType === eventTypeFilter);
    }

    // Filter by date period
    filtered = filterByDatePeriod(filtered, datePeriod);

    // Filter by capacity status
    filtered = filterByCapacity(filtered, capacityFilter);

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.name.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.location?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, eventTypeFilter, datePeriod, capacityFilter, searchQuery]);

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setEventTypeFilter(value);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`/church/${slug}/admin/volunteer/events?${params.toString()}`);
  };

  // Check if any events exist
  const hasAnyEvents = events.length > 0;
  const hasFilteredEvents = filteredEvents.length > 0;

  // Placeholder NavTabs - will be used for different views/purposes later
  const tabs = [
    {
      label: "All Events",
      value: "all",
      icon: IconCalendarEvent,
      count: events.length > 0 ? events.length : undefined,
    },
    {
      label: "Analytics",
      value: "analytics",
      icon: IconChartBar,
    },
    {
      label: "Settings",
      value: "settings",
      icon: IconSettings,
    },
  ];

  return (
    <>
      {/* Navigation Tabs */}
      <NavTabs baseUrl={`/church/${slug}/admin/volunteer/events`} tabs={tabs} />

      {/* Toolbar */}
      <Toolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search events..."
        activeView={viewMode}
        onViewChange={setViewMode}
        showViewToggle={true}
        className="mb-6"
        filters={
          <>
            {/* Date Period Filter */}
            <Select
              value={datePeriod}
              onValueChange={v => setDatePeriod(v as DatePeriod)}
            >
              <SelectTrigger className="min-w-[140px] w-auto h-9 bg-background shrink-0">
                <IconClock className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                {DATE_PERIOD_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Event Type Filter */}
            <Select value={eventTypeFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="min-w-[120px] w-auto h-9 bg-background shrink-0">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
                <div className="-mx-1 my-1 h-px bg-primary opacity-100" />
                <button
                  type="button"
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  onClick={() => {
                    // TODO: Open add type dialog
                  }}
                >
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add New Type
                </button>
              </SelectContent>
            </Select>

            {/* Capacity Filter */}
            <Select
              value={capacityFilter}
              onValueChange={v => setCapacityFilter(v as CapacityFilter)}
            >
              <SelectTrigger className="min-w-[140px] w-auto h-9 bg-background shrink-0">
                <IconUsers className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Capacity" />
              </SelectTrigger>
              <SelectContent>
                {CAPACITY_FILTER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <ToolbarAction
            icon={IconPlus}
            label="Create Event"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Content */}
      {!hasAnyEvents ? (
        <EmptyState onCreateClick={() => setIsCreateOpen(true)} />
      ) : !hasFilteredEvents ? (
        <NoMatchesState
          eventTypeFilter={eventTypeFilter}
          datePeriod={datePeriod}
          eventTypes={eventTypes}
          onClearFilters={() => {
            handleFilterChange("all");
            setDatePeriod("all");
            setCapacityFilter("all");
          }}
        />
      ) : (
        <EventsContent
          events={filteredEvents}
          viewMode={viewMode}
          slug={slug}
          canDelete={canDelete}
        />
      )}

      {/* Create Event Dialog */}
      <EventFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        slug={slug}
        organizationId={organizationId}
        locations={locations}
        teamMembers={teamMembers}
      />
    </>
  );
}

// =============================================================================
// Events Content - Renders based on view mode
// =============================================================================

interface EventsContentProps {
  events: EventListItem[];
  viewMode: ViewMode;
  slug: string;
  canDelete: boolean;
}

function EventsContent({
  events,
  viewMode,
  slug,
  canDelete,
}: EventsContentProps) {
  // TODO: Implement list and calendar views
  // For now, all views show the card grid

  switch (viewMode) {
    case "list":
      // Placeholder for list view
      return (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p>List view coming soon</p>
          <p className="text-sm mt-1">Showing card view for now</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                slug={slug}
                canDelete={canDelete}
              />
            ))}
          </div>
        </div>
      );

    case "calendar":
      // Placeholder for calendar view
      return (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p>Calendar view coming soon</p>
          <p className="text-sm mt-1">Showing card view for now</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                slug={slug}
                canDelete={canDelete}
              />
            ))}
          </div>
        </div>
      );

    case "card":
    default:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              slug={slug}
              canDelete={canDelete}
            />
          ))}
        </div>
      );
  }
}

// =============================================================================
// Empty States
// =============================================================================

interface EmptyStateProps {
  onCreateClick: () => void;
}

function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/30">
      <div className="rounded-full bg-muted p-4 mb-4">
        <IconCalendar className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No events yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Create your first event to start coordinating volunteers.
      </p>
      <Button onClick={onCreateClick} className="mt-4">
        <IconPlus className="h-4 w-4 mr-2" />
        Create Event
      </Button>
    </div>
  );
}

interface NoMatchesStateProps {
  eventTypeFilter: string;
  datePeriod: DatePeriod;
  eventTypes: EventTypeOption[];
  onClearFilters: () => void;
}

function NoMatchesState({
  eventTypeFilter,
  datePeriod,
  eventTypes,
  onClearFilters,
}: NoMatchesStateProps) {
  const typeLabel =
    eventTypeFilter !== "all"
      ? (eventTypes.find(t => t.value === eventTypeFilter)?.label ??
        eventTypeFilter)
      : null;
  const dateLabel =
    datePeriod !== "all"
      ? DATE_PERIOD_OPTIONS.find(o => o.value === datePeriod)?.label
      : null;

  // Build descriptive message
  const filterParts: string[] = [];
  if (typeLabel) filterParts.push(typeLabel.toLowerCase());
  if (dateLabel) filterParts.push(dateLabel.toLowerCase());
  const filterDescription =
    filterParts.length > 0 ? filterParts.join(" ") : "matching";

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/30">
      <div className="rounded-full bg-muted p-4 mb-4">
        <IconFilter className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No {filterDescription} events</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        There are no events matching your filters.
      </p>
      <Button variant="outline" onClick={onClearFilters} className="mt-4">
        Clear Filters
      </Button>
    </div>
  );
}
