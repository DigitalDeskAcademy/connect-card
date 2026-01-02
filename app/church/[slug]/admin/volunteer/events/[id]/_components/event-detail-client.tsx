"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Shield,
  Globe,
  Edit,
  Send,
  XCircle,
  Trash2,
  Mail,
  Phone,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventWithDetails } from "@/lib/data/events";
import {
  publishEvent,
  cancelEvent,
  deleteEvent,
} from "@/actions/events/events";
import { removeAssignment } from "@/actions/events/assignments";
import { AssignModal } from "./assign-modal";
// TODO: Uncomment when EventResource schema is pushed to DB
// import { ResourcesSection } from "./resources-section";

// =============================================================================
// Types
// =============================================================================

interface EventDetailClientProps {
  event: EventWithDetails;
  slug: string;
  canDelete: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  KIDS_MINISTRY: "Kids Ministry",
  WORSHIP: "Worship",
  HOSPITALITY: "Hospitality",
  PARKING: "Parking",
  PRODUCTION: "Production (AV/Tech)",
  PRAYER: "Prayer",
  OUTREACH: "Outreach",
  GROUPS: "Small Groups",
  CARE: "Care/Pastoral",
};

function getStatusConfig(status: string): { label: string; className: string } {
  switch (status) {
    case "DRAFT":
      return {
        label: "Draft",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      };
    case "PUBLISHED":
      return {
        label: "Published",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
    case "ARCHIVED":
      return {
        label: "Archived",
        className:
          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      };
    default:
      return { label: status, className: "" };
  }
}

function formatSessionDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d, yyyy");
}

function getAssignmentStatusBadge(status: string): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  switch (status) {
    case "CONFIRMED":
      return { label: "Confirmed", variant: "default" };
    case "ASSIGNED":
      return { label: "Assigned", variant: "secondary" };
    case "INVITED":
      return { label: "Invited", variant: "outline" };
    case "DECLINED":
      return { label: "Declined", variant: "destructive" };
    case "NO_RESPONSE":
      return { label: "No Response", variant: "outline" };
    case "ATTENDED":
      return { label: "Attended", variant: "default" };
    case "NO_SHOW":
      return { label: "No Show", variant: "destructive" };
    default:
      return { label: status, variant: "secondary" };
  }
}

// =============================================================================
// Component
// =============================================================================

// Session info type for the assign modal
interface SessionInfo {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  slotsNeeded: number;
  slotsFilled: number;
}

export function EventDetailClient({
  event,
  slug,
  canDelete,
}: EventDetailClientProps) {
  const router = useRouter();
  const statusConfig = getStatusConfig(event.status);

  // State for assign modal
  const [assignSession, setAssignSession] = useState<SessionInfo | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Calculate overall capacity
  const totalSlotsFilled = event.sessions.reduce(
    (sum, s) => sum + s.slotsFilled,
    0
  );
  const totalSlotsNeeded = event.sessions.reduce(
    (sum, s) => sum + s.slotsNeeded,
    0
  );
  const fillPercentage =
    totalSlotsNeeded > 0 ? (totalSlotsFilled / totalSlotsNeeded) * 100 : 0;

  // Action handlers
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
    if (
      !confirm(
        "Are you sure you want to cancel this event? Assigned volunteers will be notified."
      )
    )
      return;

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
    if (
      !confirm(
        "Are you sure you want to delete this event? This cannot be undone."
      )
    )
      return;

    const result = await deleteEvent(slug, { id: event.id });
    if (result.status === "success") {
      toast.success(result.message);
      router.push(`/church/${slug}/admin/volunteer/events`);
    } else {
      toast.error(result.message);
    }
  };

  const handleRemoveAssignment = async (
    assignmentId: string,
    volunteerName: string
  ) => {
    if (!confirm(`Remove ${volunteerName} from this session?`)) return;

    setRemovingId(assignmentId);
    try {
      const result = await removeAssignment(slug, assignmentId);
      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/church/${slug}/admin/volunteer/events`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <Badge className={cn("ml-2", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
          </div>
          {event.description && (
            <p className="text-muted-foreground pl-10">{event.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pl-10 sm:pl-0">
          <Link
            href={`/church/${slug}/admin/volunteer/events/${event.id}/edit`}
          >
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </Link>

          {event.status === "DRAFT" && (
            <Button size="sm" onClick={handlePublish}>
              <Send className="h-4 w-4 mr-1.5" />
              Publish
            </Button>
          )}

          {["DRAFT", "PUBLISHED", "IN_PROGRESS"].includes(event.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-orange-600 hover:text-orange-700"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
          )}

          {canDelete && ["DRAFT", "CANCELLED"].includes(event.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {event.location?.name || "No location set"}
                </p>
              </div>
            </div>

            {/* Leader */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Event Leader</p>
                <p className="text-sm text-muted-foreground">
                  {event.leader?.name || "Not assigned"}
                </p>
                {event.leader?.email && (
                  <p className="text-xs text-muted-foreground">
                    {event.leader.email}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            {event.category && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Volunteer Category</p>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[event.category] || event.category}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Requirements */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Requirements</p>
              <div className="flex items-center gap-2">
                <Shield
                  className={cn(
                    "h-4 w-4",
                    event.requiresBackgroundCheck
                      ? "text-green-600"
                      : "text-muted-foreground"
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  Background check{" "}
                  {event.requiresBackgroundCheck ? "required" : "not required"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {event.volunteerPoolScope === "all"
                    ? "All locations"
                    : "Same location only"}
                </span>
              </div>
            </div>

            <Separator />

            {/* Capacity Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Overall Capacity</p>
                <span className="text-sm text-muted-foreground">
                  {totalSlotsFilled} / {totalSlotsNeeded}
                </span>
              </div>
              <Progress value={fillPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round(fillPercentage)}% filled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">
            Sessions ({event.sessions.length})
          </h2>

          {event.sessions.map(session => {
            const sessionFillPercentage =
              session.slotsNeeded > 0
                ? (session.slotsFilled / session.slotsNeeded) * 100
                : 0;
            const isSessionPast = isPast(session.date);

            return (
              <Card
                key={session.id}
                className={cn(isSessionPast && "opacity-60")}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatSessionDate(session.date)}
                        {isSessionPast && (
                          <Badge variant="outline" className="ml-2">
                            Past
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(session.startTime, "h:mm a")} -{" "}
                        {format(session.endTime, "h:mm a")}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {session.slotsFilled} / {session.slotsNeeded} volunteers
                      </p>
                      <Progress
                        value={sessionFillPercentage}
                        className="h-1.5 w-24 mt-1"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {session.assignments.length > 0 ? (
                    <div className="space-y-2">
                      {session.assignments.map(assignment => {
                        const member = assignment.volunteer?.churchMember;
                        const statusBadge = getAssignmentStatusBadge(
                          assignment.status
                        );

                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {member?.name || "Unknown"}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {member?.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {member.email}
                                    </span>
                                  )}
                                  {member?.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {member.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.label}
                              </Badge>
                              {!isSessionPast &&
                                ["PUBLISHED", "IN_PROGRESS"].includes(
                                  event.status
                                ) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      handleRemoveAssignment(
                                        assignment.id,
                                        member?.name || "this volunteer"
                                      )
                                    }
                                    disabled={removingId === assignment.id}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      No volunteers assigned yet
                    </p>
                  )}

                  {/* Add Volunteers Button - only for active events */}
                  {!isSessionPast &&
                    ["PUBLISHED", "IN_PROGRESS"].includes(event.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() =>
                          setAssignSession({
                            id: session.id,
                            date: session.date,
                            startTime: session.startTime,
                            endTime: session.endTime,
                            slotsNeeded: session.slotsNeeded,
                            slotsFilled: session.slotsFilled,
                          })
                        }
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Assign Volunteers
                      </Button>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* TODO: Uncomment when EventResource schema is pushed to DB */}
      {/* <ResourcesSection
        eventId={event.id}
        resources={event.resources.map(r => ({
          id: r.id,
          name: r.name,
          quantity: r.quantity,
          notes: r.notes,
          status: r.status,
          isCommon: r.isCommon,
        }))}
        slug={slug}
        isEditable={["DRAFT", "PUBLISHED"].includes(event.status)}
      /> */}

      {/* Assign Modal */}
      {assignSession && (
        <AssignModal
          open={!!assignSession}
          onOpenChange={open => !open && setAssignSession(null)}
          session={assignSession}
          eventId={event.id}
          eventName={event.name}
          slug={slug}
        />
      )}
    </div>
  );
}
