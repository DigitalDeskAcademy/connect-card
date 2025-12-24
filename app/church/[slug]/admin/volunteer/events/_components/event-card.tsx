"use client";

import Link from "next/link";
import { format, isToday, isTomorrow, isFuture } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
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
  IconUserPlus,
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

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get capacity status based on fill percentage
 */
function getCapacityStatus(filled: number, needed: number) {
  if (needed === 0) {
    return {
      label: "No slots defined",
      percentage: 0,
      variant: "muted" as const,
      urgent: false,
    };
  }

  const percentage = Math.round((filled / needed) * 100);

  if (percentage >= 100) {
    return {
      label: "Fully staffed",
      percentage: 100,
      variant: "success" as const,
      urgent: false,
    };
  }
  if (percentage >= 50) {
    return {
      label: `${needed - filled} more needed`,
      percentage,
      variant: "warning" as const,
      urgent: false,
    };
  }
  return {
    label: `Needs ${needed - filled} volunteers`,
    percentage,
    variant: "destructive" as const,
    urgent: true,
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
 * Get status dot configuration
 */
function getStatusConfig(status: string) {
  switch (status) {
    case "DRAFT":
      return { label: "Draft", color: "bg-yellow-500" };
    case "PUBLISHED":
      return { label: "Published", color: "bg-green-500" };
    case "IN_PROGRESS":
      return { label: "In Progress", color: "bg-blue-500" };
    case "COMPLETED":
      return { label: "Completed", color: "bg-muted-foreground" };
    case "CANCELLED":
      return { label: "Cancelled", color: "bg-red-500" };
    case "ARCHIVED":
      return { label: "Archived", color: "bg-muted-foreground" };
    default:
      return { label: status, color: "bg-muted-foreground" };
  }
}

/**
 * Get progress bar color class based on capacity variant
 */
function getProgressColor(
  variant: "success" | "warning" | "destructive" | "muted"
) {
  switch (variant) {
    case "success":
      return "[&>[data-slot=progress-indicator]]:bg-green-500";
    case "warning":
      return "[&>[data-slot=progress-indicator]]:bg-yellow-500";
    case "destructive":
      return "[&>[data-slot=progress-indicator]]:bg-red-500";
    case "muted":
      return "[&>[data-slot=progress-indicator]]:bg-muted-foreground";
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * Event Card Component
 *
 * Modern card design with:
 * - Progress bar showing volunteer fill status
 * - Clear visual hierarchy
 * - Action-oriented CTA for events needing volunteers
 * - Inline metadata for compact display
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
    <Card className="group relative overflow-hidden flex flex-col">
      {/* Progress Bar Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1.5">
            <IconUsers className="h-3.5 w-3.5" />
            {totalSlotsFilled} / {totalSlotsNeeded}
          </span>
          <span
            className={cn(
              "font-medium",
              capacityStatus.variant === "success" && "text-green-600",
              capacityStatus.variant === "warning" && "text-yellow-600",
              capacityStatus.variant === "destructive" && "text-red-600"
            )}
          >
            {capacityStatus.label}
          </span>
        </div>
        <Progress
          value={capacityStatus.percentage}
          className={cn("h-2", getProgressColor(capacityStatus.variant))}
        />
      </div>

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight">
              {event.name}
            </CardTitle>
            <span className="text-xs font-medium text-muted-foreground">
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
            </span>
          </div>
          {/* Status Dot + Menu */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn("h-2 w-2 rounded-full", statusConfig.color)}
              />
              <span>{statusConfig.label}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2">
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

                {canDelete && ["DRAFT", "CANCELLED"].includes(event.status) && (
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
        {event.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-3 pt-0">
        {/* Metadata */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {nextSession && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <IconCalendar className="h-4 w-4 shrink-0" />
                {formatEventDate(nextSession.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <IconClock className="h-4 w-4 shrink-0" />
                {format(nextSession.startTime, "h:mm a")}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5">
              <IconMapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.location.name}</span>
            </div>
          )}
          {event._count.sessions > 1 && (
            <p className="text-xs text-muted-foreground/70">
              {event._count.sessions} sessions total
            </p>
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-2 border-t">
          {capacityStatus.urgent ? (
            <Button asChild className="w-full" size="sm">
              <Link href={`/church/${slug}/admin/volunteer/events/${event.id}`}>
                <IconUserPlus className="h-4 w-4 mr-1.5" />
                Fill Volunteer Slots
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href={`/church/${slug}/admin/volunteer/events/${event.id}`}>
                <IconEye className="h-4 w-4 mr-1.5" />
                View Details
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
