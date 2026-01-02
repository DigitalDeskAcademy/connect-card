"use client";

import Link from "next/link";
import { format, isToday, isTomorrow, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconUsers,
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconSend,
  IconCircleX,
  IconTrash,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS, type EventListItem } from "@/lib/event-types";
import {
  publishEvent,
  cancelEvent,
  deleteEvent,
} from "@/actions/events/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// =============================================================================
// Types
// =============================================================================

interface EventCardProps {
  event: EventListItem;
  slug: string;
  canDelete: boolean;
}

export type CapacityStatus = "full" | "partial" | "urgent" | "empty";

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get capacity status based on fill percentage
 */
export function getCapacityStatus(
  filled: number,
  needed: number
): {
  label: string;
  status: CapacityStatus;
  percentage: number;
} {
  if (needed === 0) {
    return {
      label: "No slots defined",
      status: "empty",
      percentage: 0,
    };
  }

  const percentage = Math.round((filled / needed) * 100);

  if (percentage >= 100) {
    return {
      label: "Fully staffed",
      status: "full",
      percentage: 100,
    };
  }
  if (percentage >= 50) {
    return {
      label: `${needed - filled} more needed`,
      status: "partial",
      percentage,
    };
  }
  return {
    label: `Needs ${needed - filled} volunteers`,
    status: "urgent",
    percentage,
  };
}

/**
 * Format date for display with relative labels
 */
function formatEventDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

/**
 * Get status configuration
 */
function getStatusConfig(status: string) {
  switch (status) {
    case "DRAFT":
      return {
        label: "Draft",
        className:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      };
    case "PUBLISHED":
      return {
        label: "Published",
        className:
          "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        className: "bg-muted text-muted-foreground border-muted",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className:
          "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      };
    case "ARCHIVED":
      return {
        label: "Archived",
        className: "bg-muted text-muted-foreground border-muted",
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground border-muted",
      };
  }
}

/**
 * Get capacity status colors
 */
function getCapacityColors(status: CapacityStatus) {
  switch (status) {
    case "full":
      return {
        bg: "bg-green-500/20",
        fill: "bg-green-500",
        text: "text-green-600 dark:text-green-400",
        badge:
          "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      };
    case "partial":
      return {
        bg: "bg-yellow-500/20",
        fill: "bg-yellow-500",
        text: "text-yellow-600 dark:text-yellow-400",
        badge:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      };
    case "urgent":
      return {
        bg: "bg-red-500/20",
        fill: "bg-red-500",
        text: "text-red-600 dark:text-red-400",
        badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      };
    case "empty":
      return {
        bg: "bg-muted",
        fill: "bg-muted-foreground",
        text: "text-muted-foreground",
        badge: "bg-muted text-muted-foreground border-muted",
      };
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * Event Card Component
 *
 * Hierarchy-focused card design:
 * 1. Event name + status (what is it?)
 * 2. Date/time/location (when/where?)
 * 3. Volunteer status (how are we doing?)
 * 4. Actions
 */
export function EventCard({ event, slug, canDelete }: EventCardProps) {
  const router = useRouter();

  // Calculate totals from all sessions
  const totalSlotsFilled = event.sessions.reduce(
    (sum, s) => sum + s.slotsFilled,
    0
  );
  const totalSlotsNeeded = event.sessions.reduce(
    (sum, s) => sum + s.slotsNeeded,
    0
  );
  const capacityStatus = getCapacityStatus(totalSlotsFilled, totalSlotsNeeded);
  const statusConfig = getStatusConfig(event.status);
  const capacityColors = getCapacityColors(capacityStatus.status);

  // Get the next upcoming session (or the first session if all are past)
  const upcomingSessions = event.sessions.filter(
    s => isFuture(s.date) || isToday(s.date)
  );
  const nextSession = upcomingSessions[0] || event.sessions[0];

  // Quick action handlers
  const handlePublish = async () => {
    const result = await publishEvent(slug, { id: event.id });
    if (result.status === "success") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleCancel = async () => {
    const result = await cancelEvent(slug, {
      id: event.id,
      notifyVolunteers: true,
    });
    if (result.status === "success") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const result = await deleteEvent(slug, { id: event.id });
    if (result.status === "success") {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Link
      href={`/church/${slug}/admin/volunteer/events/${event.id}`}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card overflow-hidden",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "hover:border-primary/30 cursor-pointer"
      )}
    >
      {/* Header - Title + Badges + Menu */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
          {/* Title */}
          <h3 className="font-semibold text-base leading-tight line-clamp-1 min-w-0 truncate">
            {event.name}
          </h3>

          {/* Badges + Menu - pushed right */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <Badge variant="secondary" className="text-xs font-medium">
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs font-medium", statusConfig.className)}
            >
              {statusConfig.label}
            </Badge>

            {/* 3-dot Menu - stopPropagation prevents card navigation */}
            <div onClick={e => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <IconDotsVertical className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/church/${slug}/admin/volunteer/events/${event.id}`}
                    >
                      <IconEye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/church/${slug}/admin/volunteer/events/${event.id}/edit`}
                    >
                      <IconEdit className="h-4 w-4 mr-2" />
                      Edit Event
                    </Link>
                  </DropdownMenuItem>

                  {event.status === "DRAFT" && (
                    <DropdownMenuItem onClick={handlePublish}>
                      <IconSend className="h-4 w-4 mr-2" />
                      Publish Event
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {["DRAFT", "PUBLISHED", "IN_PROGRESS"].includes(
                    event.status
                  ) && (
                    <DropdownMenuItem
                      onClick={handleCancel}
                      className="text-orange-600 focus:text-orange-600"
                    >
                      <IconCircleX className="h-4 w-4 mr-2" />
                      Cancel Event
                    </DropdownMenuItem>
                  )}

                  {canDelete &&
                    ["DRAFT", "CANCELLED"].includes(event.status) && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600 focus:text-red-600"
                      >
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Date/Time/Location - Below title row */}
        {nextSession && (
          <div className="flex items-center gap-4 text-sm mt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <IconCalendar className="h-4 w-4 text-primary" />
              {formatEventDate(nextSession.date)}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <IconClock className="h-4 w-4" />
              {format(nextSession.startTime, "h:mm a")}
            </span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
            <IconMapPin className="h-4 w-4" />
            <span className="truncate">{event.location.name}</span>
          </div>
        )}
        {event._count.sessions > 1 && (
          <p className="text-xs text-muted-foreground/70 mt-1.5">
            {event._count.sessions} sessions total
          </p>
        )}
      </div>

      {/* Description (if any) */}
      {event.description && (
        <div className="px-4 pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        </div>
      )}

      {/* Volunteer Status - Secondary Info */}
      <div className="px-4 py-3 mt-auto border-t bg-muted/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <IconUsers className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              <span className="font-medium">{totalSlotsFilled}</span>
              <span className="text-muted-foreground">
                {" "}
                / {totalSlotsNeeded}
              </span>
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs font-medium shrink-0", capacityColors.badge)}
          >
            {capacityStatus.label}
          </Badge>
        </div>
        {/* Compact progress bar */}
        <div
          className={cn(
            "h-1.5 rounded-full overflow-hidden mt-2",
            capacityColors.bg
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              capacityColors.fill
            )}
            style={{ width: `${capacityStatus.percentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
