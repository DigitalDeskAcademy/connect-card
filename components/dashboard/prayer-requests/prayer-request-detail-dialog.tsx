"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconCircleCheck,
  IconEyeOff,
  IconEye,
  IconAlertCircle,
  IconCalendar,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";
import { format } from "date-fns";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";

interface PrayerRequestDetailDialogProps {
  prayerRequest: PrayerRequestListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onMarkAnswered?: () => void;
  onTogglePrivacy?: () => void;
}

/**
 * Prayer Request Detail Dialog Component
 *
 * Shows full prayer request details with action buttons.
 *
 * Features:
 * - Full prayer text display
 * - Status, category, privacy, urgency badges
 * - Submitter information
 * - Location and assignment details
 * - Dates (created, follow-up, answered)
 * - Action buttons (Edit, Assign, Mark Answered, Delete, Toggle Privacy)
 */
export function PrayerRequestDetailDialog({
  prayerRequest,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onAssign,
  onMarkAnswered,
  onTogglePrivacy,
}: PrayerRequestDetailDialogProps) {
  // Status badge variants
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "ASSIGNED":
        return "default";
      case "PRAYING":
        return "default";
      case "ANSWERED":
        return "default";
      case "ARCHIVED":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prayer Request Details</DialogTitle>
          <DialogDescription>
            View and manage this prayer request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prayer Request Text */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Prayer Request
            </div>
            <div className="rounded-md bg-muted p-4 text-sm">
              {prayerRequest.request}
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2">
            {/* Status Badge */}
            <Badge variant={getStatusBadgeVariant(prayerRequest.status)}>
              {prayerRequest.status}
            </Badge>

            {/* Category Badge */}
            {prayerRequest.category && (
              <Badge variant="outline">{prayerRequest.category}</Badge>
            )}

            {/* Privacy Badge */}
            {prayerRequest.isPrivate && (
              <Badge variant="secondary">
                <IconEyeOff className="mr-1 h-3 w-3" />
                Private
              </Badge>
            )}

            {/* Urgency Badge */}
            {prayerRequest.isUrgent && (
              <Badge variant="destructive">
                <IconAlertCircle className="mr-1 h-3 w-3" />
                Urgent
              </Badge>
            )}
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Submitter Information */}
            {prayerRequest.submittedBy && (
              <div className="space-y-1">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <IconUser className="mr-2 h-4 w-4" />
                  Submitted By
                </div>
                <div className="text-sm">{prayerRequest.submittedBy}</div>
              </div>
            )}

            {/* Location */}
            {prayerRequest.locationName && (
              <div className="space-y-1">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <IconMapPin className="mr-2 h-4 w-4" />
                  Location
                </div>
                <div className="text-sm">{prayerRequest.locationName}</div>
              </div>
            )}

            {/* Assigned To */}
            {prayerRequest.assignedToName && (
              <div className="space-y-1">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <IconUserCheck className="mr-2 h-4 w-4" />
                  Assigned To
                </div>
                <div className="text-sm">{prayerRequest.assignedToName}</div>
              </div>
            )}

            {/* Created Date */}
            <div className="space-y-1">
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <IconCalendar className="mr-2 h-4 w-4" />
                Created
              </div>
              <div className="text-sm">
                {format(new Date(prayerRequest.createdAt), "PPP")}
              </div>
            </div>

            {/* Follow-up Date */}
            {prayerRequest.followUpDate && (
              <div className="space-y-1">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <IconCalendar className="mr-2 h-4 w-4" />
                  Follow-up Date
                </div>
                <div className="text-sm">
                  {format(new Date(prayerRequest.followUpDate), "PPP")}
                </div>
              </div>
            )}

            {/* Answered Date */}
            {prayerRequest.answeredDate && (
              <div className="space-y-1">
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                  <IconCircleCheck className="mr-2 h-4 w-4" />
                  Answered
                </div>
                <div className="text-sm">
                  {format(new Date(prayerRequest.answeredDate), "PPP")}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {onEdit && (
              <Button variant="default" size="sm" onClick={onEdit}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            {onAssign && !prayerRequest.assignedToName && (
              <Button variant="outline" size="sm" onClick={onAssign}>
                <IconUserCheck className="mr-2 h-4 w-4" />
                Assign
              </Button>
            )}

            {onMarkAnswered && prayerRequest.status !== "ANSWERED" && (
              <Button variant="outline" size="sm" onClick={onMarkAnswered}>
                <IconCircleCheck className="mr-2 h-4 w-4" />
                Mark Answered
              </Button>
            )}

            {onTogglePrivacy && (
              <Button variant="outline" size="sm" onClick={onTogglePrivacy}>
                {prayerRequest.isPrivate ? (
                  <>
                    <IconEye className="mr-2 h-4 w-4" />
                    Make Public
                  </>
                ) : (
                  <>
                    <IconEyeOff className="mr-2 h-4 w-4" />
                    Make Private
                  </>
                )}
              </Button>
            )}

            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
