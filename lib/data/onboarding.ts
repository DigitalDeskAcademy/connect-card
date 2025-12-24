/**
 * Onboarding Status Data Layer
 *
 * Checks various completion states for new church onboarding.
 * Used to show the onboarding checklist on the dashboard.
 *
 * Steps can be completed by:
 * 1. Taking action (e.g., inviting team members)
 * 2. Skipping (answering "No" to optional setup questions)
 */

import { prisma } from "@/lib/db";

/** Valid onboarding step IDs */
export type OnboardingStepId =
  | "locations"
  | "team"
  | "connect-cards"
  | "volunteer-settings";

export interface OnboardingStatus {
  /** Whether to show the onboarding checklist */
  showChecklist: boolean;
  /** Days remaining in trial (null if not in trial) */
  daysRemaining: number | null;
  /** Steps that were skipped (user answered "No") */
  skippedSteps: string[];
  /** Completion states for each step (from actual data) */
  completionState: {
    /** Has more than auto-created location OR skipped */
    hasLocations: boolean;
    /** Has invited team members OR skipped */
    hasTeamMembers: boolean;
    /** Has processed at least one connect card (never skippable) */
    hasProcessedCards: boolean;
    /** Has configured volunteer documents OR skipped */
    hasVolunteerSettings: boolean;
  };
}

/**
 * Get onboarding status for an organization
 *
 * Shows checklist if:
 * - Organization is in trial period
 * - OR organization has not completed core setup tasks
 *
 * @param organizationId - The organization to check
 * @returns OnboardingStatus with completion states
 */
export async function getOnboardingStatus(
  organizationId: string
): Promise<OnboardingStatus> {
  // Fetch organization and related counts in parallel
  const [organization, teamCount, cardCount, volunteerDocsCount] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          trialEndsAt: true,
          subscriptionStatus: true,
          createdAt: true,
          skippedOnboardingSteps: true,
          _count: {
            select: {
              locations: true,
            },
          },
        },
      }),
      // Count team members (excluding the owner who created the org)
      prisma.user.count({
        where: {
          organizationId,
        },
      }),
      // Count processed connect cards (reviewed or processed)
      prisma.connectCard.count({
        where: {
          organizationId,
          status: { in: ["REVIEWED", "PROCESSED"] },
        },
      }),
      // Check if any volunteer documents have been uploaded
      prisma.volunteerDocument.count({
        where: {
          organizationId,
        },
      }),
    ]);

  if (!organization) {
    return {
      showChecklist: false,
      daysRemaining: null,
      skippedSteps: [],
      completionState: {
        hasLocations: false,
        hasTeamMembers: false,
        hasProcessedCards: false,
        hasVolunteerSettings: false,
      },
    };
  }

  const skippedSteps = organization.skippedOnboardingSteps || [];

  // Calculate days remaining in trial
  let daysRemaining: number | null = null;
  if (organization.subscriptionStatus === "TRIAL" && organization.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(organization.trialEndsAt);
    daysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  // Completion states - a step is "complete" if:
  // 1. They took the action, OR
  // 2. They skipped it (answered "No")
  const completionState = {
    // Locations: has > 1 location (added more) OR skipped
    hasLocations:
      organization._count.locations > 1 || skippedSteps.includes("locations"),
    // Team: has invited members OR skipped
    hasTeamMembers: teamCount > 1 || skippedSteps.includes("team"),
    // Connect cards: has processed cards (never skippable - core feature)
    hasProcessedCards: cardCount > 0,
    // Volunteer settings: has documents OR skipped
    hasVolunteerSettings:
      volunteerDocsCount > 0 || skippedSteps.includes("volunteer-settings"),
  };

  // Calculate how many steps are complete
  const completedSteps = Object.values(completionState).filter(Boolean).length;
  const totalSteps = Object.keys(completionState).length;

  // Show checklist if:
  // 1. In trial period, OR
  // 2. Organization is less than 30 days old AND hasn't completed all steps
  const orgAgeInDays = Math.ceil(
    (Date.now() - new Date(organization.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const showChecklist =
    organization.subscriptionStatus === "TRIAL" ||
    (orgAgeInDays < 30 && completedSteps < totalSteps);

  return {
    showChecklist,
    daysRemaining,
    skippedSteps,
    completionState,
  };
}
