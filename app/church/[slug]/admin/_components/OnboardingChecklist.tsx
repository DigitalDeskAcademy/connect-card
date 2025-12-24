/**
 * Interactive Onboarding Checklist Component
 *
 * Guides new churches through setup with Yes/No questions.
 * Steps can be:
 * - Completed by action (e.g., uploading cards)
 * - Skipped by answering "No" to optional questions
 *
 * Appears on dashboard for churches in trial or first 30 days.
 */

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  IconCheck,
  IconUsers,
  IconMapPin,
  IconFileUpload,
  IconSettings,
  IconRocket,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { skipOnboardingStep } from "@/actions/onboarding/skip-onboarding-step";

/** Step configuration with question for interactive flow */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  /** Question to ask (e.g., "Do you have multiple campuses?") */
  question: string;
  /** URL to navigate when user clicks "Yes" */
  href: string;
  /** Whether step is complete (by action or skip) */
  completed: boolean;
  /** Whether step was skipped (not completed by action) */
  skipped: boolean;
  /** Whether this step can be skipped */
  skippable: boolean;
  icon: typeof IconCheck;
}

interface OnboardingChecklistProps {
  slug: string;
  churchName: string;
  steps: OnboardingStep[];
  daysRemaining?: number;
  onDismiss?: () => void;
}

export function OnboardingChecklist({
  slug,
  churchName,
  steps,
  daysRemaining,
  onDismiss,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const completedCount = steps.filter(s => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  // Find the first incomplete step to highlight
  const nextStep = steps.find(s => !s.completed);

  const handleSkip = (stepId: string) => {
    startTransition(async () => {
      const result = await skipOnboardingStep(slug, stepId);
      if (result.status === "success") {
        toast.success("Got it! Moving on...");
        setActiveStepId(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleYes = (href: string) => {
    router.push(href);
  };

  // If all steps complete, show celebration
  if (completedCount === steps.length) {
    return (
      <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <IconRocket className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">
                You&apos;re all set, {churchName}!
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your church is ready to start processing connect cards.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-3">
            <Button asChild>
              <Link href={`/church/${slug}/admin/connect-cards`}>
                Upload Connect Cards
              </Link>
            </Button>
            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              Welcome to ChurchSyncAI, {churchName}!
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Let&apos;s get your church set up.
              {daysRemaining !== undefined && daysRemaining > 0 && (
                <span className="text-amber-600 dark:text-amber-400 ml-1">
                  {daysRemaining} days left in trial
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="text-xs text-muted-foreground">
              {completedCount}/{steps.length} complete
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = activeStepId === step.id;
            const isNextStep = nextStep?.id === step.id && !isActive;

            // Completed step (either by action or skip)
            if (step.completed) {
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg",
                    step.skipped
                      ? "bg-muted/30 opacity-60"
                      : "bg-green-50/50 dark:bg-green-950/20"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm",
                      step.skipped
                        ? "bg-muted text-muted-foreground"
                        : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                    )}
                  >
                    {step.skipped ? (
                      <IconX className="h-4 w-4" />
                    ) : (
                      <IconCheck className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-medium text-sm",
                        step.skipped
                          ? "text-muted-foreground"
                          : "line-through text-muted-foreground"
                      )}
                    >
                      {step.skipped ? `Skipped: ${step.title}` : step.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {step.skipped ? "Not needed" : "Completed"}
                    </div>
                  </div>
                  <step.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              );
            }

            // Active step (showing question)
            if (isActive) {
              return (
                <div
                  key={step.id}
                  className="p-4 rounded-lg border-2 border-primary bg-primary/5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{step.question}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </div>
                    </div>
                    <step.icon className="h-5 w-5 shrink-0 text-primary" />
                  </div>
                  <div className="flex gap-2 ml-9">
                    <Button
                      size="sm"
                      onClick={() => handleYes(step.href)}
                      disabled={isPending}
                    >
                      Yes, let&apos;s do it
                    </Button>
                    {step.skippable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSkip(step.id)}
                        disabled={isPending}
                      >
                        {isPending ? "..." : "No, skip this"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveStepId(null)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            // Inactive pending step
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
                  isNextStep
                    ? "bg-primary/10 hover:bg-primary/20 ring-1 ring-primary/20"
                    : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
                    isNextStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {isNextStep ? "Click to get started →" : step.description}
                  </div>
                </div>
                <step.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isNextStep ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get interactive onboarding steps for a church
 */
export function getDefaultOnboardingSteps(
  slug: string,
  completionState: {
    hasLocations: boolean;
    hasTeamMembers: boolean;
    hasProcessedCards: boolean;
    hasVolunteerSettings: boolean;
  },
  skippedSteps: string[] = []
): OnboardingStep[] {
  return [
    {
      id: "locations",
      title: "Add more locations",
      description: "For multi-campus churches",
      question: "Do you have multiple campuses or locations?",
      href: `/church/${slug}/admin/team?tab=locations`,
      completed: completionState.hasLocations,
      skipped: skippedSteps.includes("locations"),
      skippable: true,
      icon: IconMapPin,
    },
    {
      id: "team",
      title: "Invite your team",
      description: "Staff who will help process cards",
      question: "Will other staff members help process connect cards?",
      href: `/church/${slug}/admin/team`,
      completed: completionState.hasTeamMembers,
      skipped: skippedSteps.includes("team"),
      skippable: true,
      icon: IconUsers,
    },
    {
      id: "connect-cards",
      title: "Upload your first connect cards",
      description: "Scan or photograph paper cards",
      question: "Ready to upload your first connect cards?",
      href: `/church/${slug}/admin/connect-cards`,
      completed: completionState.hasProcessedCards,
      skipped: false, // Never skipped - core feature
      skippable: false, // Can't skip this one
      icon: IconFileUpload,
    },
    {
      id: "volunteer-settings",
      title: "Configure volunteer onboarding",
      description: "Background checks and documents",
      question: "Do you need to onboard volunteers with background checks?",
      href: `/church/${slug}/admin/settings/volunteer-onboarding`,
      completed: completionState.hasVolunteerSettings,
      skipped: skippedSteps.includes("volunteer-settings"),
      skippable: true,
      icon: IconSettings,
    },
  ];
}
