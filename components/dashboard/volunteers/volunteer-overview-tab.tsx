"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconPhone,
  IconMail,
  IconMapPin,
  IconSend,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTransition } from "react";
import { useParams } from "next/navigation";
import type {
  VolunteerDetail,
  BackgroundCheckStatusDisplay,
} from "@/lib/data/volunteers";
import { updateBackgroundCheckStatus } from "@/actions/volunteers/volunteers";

/**
 * Volunteer Overview Tab
 *
 * Displays volunteer profile information in read-only cards with edit capability.
 *
 * Sections:
 * - Profile Info: Status, start date, church member link (with Edit button)
 * - Background Check: Status badge with verification details (with Start Background Check button)
 * - Emergency Contact: Name and phone
 * - Contact Info: From church member record
 *
 * Actions:
 * - Edit button: Opens EditVolunteerDialog with optimistic locking
 * - Start Background Check button: Triggers automated background check workflow (placeholder)
 *   - Will send SMS to volunteer with required documents and instructions
 *   - Tracks status updates throughout the process
 *
 * Phase 3 (Dec 2025): Updated to use unified ChurchMember model types.
 */

interface VolunteerOverviewTabProps {
  volunteer: VolunteerDetail;
}

export function VolunteerOverviewTab({ volunteer }: VolunteerOverviewTabProps) {
  const params = useParams();
  const slug = params.slug as string;
  const [isPending, startTransition] = useTransition();

  // Background check status color mapping - exhaustive Record ensures all cases handled
  // TypeScript will error if any BackgroundCheckStatusDisplay value is missing
  const bgCheckStatusColor: Record<
    BackgroundCheckStatusDisplay,
    "secondary" | "default" | "outline" | "destructive"
  > = {
    NOT_STARTED: "secondary",
    IN_PROGRESS: "default",
    PENDING_REVIEW: "outline",
    CLEARED: "default",
    FLAGGED: "destructive",
    EXPIRED: "destructive",
  };

  // No fallback needed - type system guarantees valid value
  const statusColor = bgCheckStatusColor[volunteer.backgroundCheckStatus];
  const isPendingReview = volunteer.backgroundCheckStatus === "PENDING_REVIEW";

  // Placeholder function for starting background check process
  const handleStartBackgroundCheck = () => {
    toast.info(
      "Background check automation coming soon! This will send SMS to member with links to required documents and information."
    );
    // TODO: Implement background check automation workflow
    // - Send SMS to volunteer with background check instructions
    // - Include links to required documents
    // - Track status updates
    // - Send reminders if not completed
  };

  // Approve background check (set to CLEARED)
  const handleApproveBackgroundCheck = () => {
    startTransition(async () => {
      const result = await updateBackgroundCheckStatus(
        slug,
        volunteer.id,
        "CLEARED"
      );
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  // Flag background check for issues
  const handleFlagBackgroundCheck = () => {
    startTransition(async () => {
      const result = await updateBackgroundCheckStatus(
        slug,
        volunteer.id,
        "FLAGGED"
      );
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline" className="mt-1">
              {volunteer.status}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium">
              {volunteer.startDate
                ? format(new Date(volunteer.startDate), "MMMM d, yyyy")
                : "Not set"}
            </p>
          </div>

          {volunteer.endDate && (
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="text-sm font-medium">
                {format(new Date(volunteer.endDate), "MMMM d, yyyy")}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Church Member</p>
            <p className="text-sm font-medium">
              {volunteer.churchMember.name || "Unknown"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Background Check Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Background Check
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={statusColor} className="mt-1">
              {volunteer.backgroundCheckStatus.replace("_", " ")}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Completed Date</p>
            {volunteer.backgroundCheckDate ? (
              <p className="text-sm font-medium">
                {format(
                  new Date(volunteer.backgroundCheckDate),
                  "MMMM d, yyyy"
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Not yet completed
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Expiration Date</p>
            {volunteer.backgroundCheckExpiry ? (
              <p className="text-sm font-medium">
                {format(
                  new Date(volunteer.backgroundCheckExpiry),
                  "MMMM d, yyyy"
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No expiration set
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {isPendingReview ? (
            <div className="flex w-full gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleApproveBackgroundCheck}
                disabled={isPending}
              >
                <IconCheck className="mr-2 h-4 w-4" />
                {isPending ? "Processing..." : "Approve"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleFlagBackgroundCheck}
                disabled={isPending}
              >
                <IconAlertTriangle className="mr-2 h-4 w-4" />
                Flag
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              className="w-full"
              onClick={handleStartBackgroundCheck}
            >
              <IconSend className="mr-2 h-4 w-4" />
              Start Background Check
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Emergency Contact Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {volunteer.emergencyContactName ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium">
                  {volunteer.emergencyContactName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {volunteer.emergencyContactPhone || "Not provided"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No emergency contact on file
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {volunteer.churchMember.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <IconMail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {volunteer.churchMember.email}
                </p>
              </div>
            </div>
          )}

          {volunteer.churchMember.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <div className="flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {volunteer.churchMember.phone}
                </p>
              </div>
            </div>
          )}

          {volunteer.churchMember.address && (
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <div className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{volunteer.churchMember.address}</p>
              </div>
            </div>
          )}

          {!volunteer.churchMember.email &&
            !volunteer.churchMember.phone &&
            !volunteer.churchMember.address && (
              <p className="text-sm text-muted-foreground">
                No contact information on file
              </p>
            )}
        </CardContent>
      </Card>

      {/* Notes Card - Full Width */}
      {volunteer.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{volunteer.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
