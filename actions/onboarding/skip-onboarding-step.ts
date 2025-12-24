"use server";

/**
 * Server action to skip an onboarding step
 *
 * When a church answers "No" to an optional setup question (like "Do you have
 * multiple campuses?"), this marks the step as skipped so it counts as complete.
 */

import { prisma } from "@/lib/db";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/lib/types";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

// Valid step IDs that can be skipped
const SKIPPABLE_STEPS = ["locations", "team", "volunteer-settings"] as const;
type SkippableStep = (typeof SKIPPABLE_STEPS)[number];

// Rate limiting: 10 skips per minute (generous for legitimate use)
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

/**
 * Skip an onboarding step
 *
 * @param slug - Church slug for auth
 * @param stepId - The step to skip (locations, team, volunteer-settings)
 * @returns ApiResponse with success/error
 */
export async function skipOnboardingStep(
  slug: string,
  stepId: string
): Promise<ApiResponse> {
  // Validate step ID
  if (!SKIPPABLE_STEPS.includes(stepId as SkippableStep)) {
    return {
      status: "error",
      message: "Invalid step ID",
    };
  }

  // Auth check
  const { organization, session } = await requireDashboardAccess(slug);

  // Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Rate limit exceeded. Please try again later.",
    };
  }

  try {
    // Get current skipped steps
    const current = await prisma.organization.findUnique({
      where: { id: organization.id },
      select: { skippedOnboardingSteps: true },
    });

    const skippedSteps = current?.skippedOnboardingSteps || [];

    // Don't add duplicates
    if (skippedSteps.includes(stepId)) {
      return {
        status: "success",
        message: "Step already skipped",
      };
    }

    // Add the step to skipped list
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        skippedOnboardingSteps: [...skippedSteps, stepId],
      },
    });

    revalidatePath(`/church/${slug}/admin`);

    return {
      status: "success",
      message: "Step skipped successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to skip step",
    };
  }
}

/**
 * Unskip an onboarding step (in case they change their mind)
 *
 * @param slug - Church slug for auth
 * @param stepId - The step to unskip
 * @returns ApiResponse with success/error
 */
export async function unskipOnboardingStep(
  slug: string,
  stepId: string
): Promise<ApiResponse> {
  // Auth check
  const { organization } = await requireDashboardAccess(slug);

  try {
    // Get current skipped steps
    const current = await prisma.organization.findUnique({
      where: { id: organization.id },
      select: { skippedOnboardingSteps: true },
    });

    const skippedSteps = current?.skippedOnboardingSteps || [];

    // Remove the step from skipped list
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        skippedOnboardingSteps: skippedSteps.filter(s => s !== stepId),
      },
    });

    revalidatePath(`/church/${slug}/admin`);

    return {
      status: "success",
      message: "Step restored successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to restore step",
    };
  }
}
