"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  FileText,
  UserCheck,
  Calendar,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { VolunteerOnboardingStatus } from "@/lib/generated/prisma";

interface OnboardingChecklistProps {
  volunteerCategory: string;
  assignedLeaderName?: string;
  smsAutomationEnabled: boolean;
  onboardingStatus?: VolunteerOnboardingStatus | null;
  orientationDate?: Date | null;
  onboardingNotes?: string | null;
}

/**
 * Volunteer Onboarding Checklist
 *
 * Shows the complete onboarding pipeline from inquiry to Planning Center ready.
 * Displays automation preview for demo purposes.
 *
 * Pipeline stages:
 * 1. Inquiry - Volunteer interest expressed
 * 2. Welcome Sent - Automated welcome message
 * 3. Documents Shared - Background check, policies, forms
 * 4. Leader Connected - Introduced to ministry leader
 * 5. Orientation Set - Orientation scheduled
 * 6. Ready - Ready for Planning Center
 * 7. Added to PCO - Final state
 */
export function VolunteerOnboardingChecklist({
  volunteerCategory,
  assignedLeaderName,
  smsAutomationEnabled,
  onboardingStatus = "INQUIRY",
  orientationDate,
  onboardingNotes,
}: OnboardingChecklistProps) {
  // Define onboarding stages with completion status
  const stages: Array<{
    id: VolunteerOnboardingStatus;
    label: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      id: "INQUIRY",
      label: "Inquiry Received",
      description: "Volunteer interest expressed on connect card",
      icon: Circle,
    },
    {
      id: "WELCOME_SENT",
      label: "Welcome Message Sent",
      description: "Automated welcome SMS and email delivered",
      icon: Mail,
    },
    {
      id: "DOCUMENTS_SHARED",
      label: "Documents Shared",
      description: "Background check, policies, and forms sent",
      icon: FileText,
    },
    {
      id: "LEADER_CONNECTED",
      label: "Leader Introduction",
      description: `Connected with ${assignedLeaderName || "ministry leader"}`,
      icon: UserCheck,
    },
    {
      id: "ORIENTATION_SET",
      label: "Orientation Scheduled",
      description: orientationDate
        ? `Scheduled for ${format(orientationDate, "MMM d, yyyy")}`
        : "Awaiting orientation date",
      icon: Calendar,
    },
    {
      id: "READY",
      label: "Ready for Planning Center",
      description:
        "Volunteer completed onboarding, ready to add to Planning Center",
      icon: CheckCircle2,
    },
    {
      id: "ADDED_TO_PCO",
      label: "Added to Planning Center",
      description: "Volunteer exported to Planning Center for shift scheduling",
      icon: ExternalLink,
    },
  ];

  // Get current stage index
  const currentStageIndex = stages.findIndex(s => s.id === onboardingStatus);

  // Determine if stage is completed
  const isStageCompleted = (stageIndex: number) => {
    return stageIndex <= currentStageIndex;
  };

  // Get status badge color
  const getStatusBadge = () => {
    if (onboardingStatus === "ADDED_TO_PCO") {
      return (
        <Badge variant="default" className="bg-green-500">
          Complete - In Planning Center
        </Badge>
      );
    }
    if (onboardingStatus === "READY") {
      return <Badge variant="default">Ready for Export</Badge>;
    }
    return <Badge variant="secondary">In Progress</Badge>;
  };

  // Documents that would be sent for this ministry
  const getExpectedDocuments = () => {
    const baseDocuments = [
      {
        name: "Welcome Email",
        description: "Ministry overview and next steps",
      },
      {
        name: "Leader Introduction",
        description: `${assignedLeaderName || "Ministry leader"}'s photo, bio, contact info`,
      },
    ];

    // Ministry-specific documents
    if (
      volunteerCategory?.includes("Kids") ||
      volunteerCategory?.includes("Children")
    ) {
      baseDocuments.push(
        {
          name: "Background Check Form",
          description: "Required for kids ministry",
        },
        {
          name: "Safe Sanctuary Policy",
          description: "Child protection guidelines",
        }
      );
    } else if (volunteerCategory?.includes("Worship")) {
      baseDocuments.push(
        {
          name: "Audition Form",
          description: "Musical background and availability",
        },
        {
          name: "Worship Team Covenant",
          description: "Team expectations and commitment",
        }
      );
    } else {
      baseDocuments.push(
        { name: "Volunteer Waiver", description: "Standard liability waiver" },
        { name: "Training Video", description: "Ministry-specific orientation" }
      );
    }

    baseDocuments.push({
      name: "Orientation Calendar",
      description: "Available orientation dates and RSVP link",
    });

    return baseDocuments;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Volunteer Onboarding Pipeline
              {smsAutomationEnabled && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Automation Enabled
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Category: <strong>{volunteerCategory}</strong>
              {assignedLeaderName && (
                <>
                  {" "}
                  • Leader: <strong>{assignedLeaderName}</strong>
                </>
              )}
            </CardDescription>
          </div>
          <div>{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Automation Preview Alert */}
        {smsAutomationEnabled && currentStageIndex < 2 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Automation Triggered:</strong> Welcome message and
              documents will be sent automatically. Leader will be notified when
              volunteer is assigned.
            </AlertDescription>
          </Alert>
        )}

        {/* Onboarding Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = isStageCompleted(index);
            const isCurrent = index === currentStageIndex;

            return (
              <div key={stage.id} className="flex gap-4">
                {/* Stage Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < stages.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 flex-1 min-h-8",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>

                {/* Stage Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2">
                    <h4
                      className={cn(
                        "font-medium",
                        isCompleted && "text-primary",
                        isCurrent && "font-semibold"
                      )}
                    >
                      {stage.label}
                    </h4>
                    {isCurrent && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stage.description}
                  </p>

                  {/* Show expected documents for DOCUMENTS_SHARED stage */}
                  {stage.id === "DOCUMENTS_SHARED" &&
                    (isCompleted || isCurrent) && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Documents Sent:</p>
                        <ul className="space-y-1">
                          {getExpectedDocuments().map(doc => (
                            <li
                              key={doc.name}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium">{doc.name}</span>
                                <span className="text-xs block">
                                  {doc.description}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {onboardingStatus === "READY" && (
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Export to Planning Center
            </Button>
          )}
          {onboardingStatus !== "READY" &&
            onboardingStatus !== "ADDED_TO_PCO" && (
              <Button variant="outline" size="sm">
                Update Status
              </Button>
            )}
        </div>

        {/* Notes */}
        {onboardingNotes && (
          <div className="text-sm text-muted-foreground pt-4 border-t">
            <strong>Notes:</strong> {onboardingNotes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
