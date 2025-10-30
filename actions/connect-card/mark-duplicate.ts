"use server";

import { prisma } from "@/lib/db";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { revalidatePath } from "next/cache";

/**
 * Mark a connect card as a duplicate and skip it
 * Updates status to DUPLICATE and removes from review queue
 */
export async function markDuplicate(slug: string, cardId: string) {
  // 1. Verify authentication and organization access
  const { session, organization } = await requireDashboardAccess(slug);

  if (!session?.user?.id || !organization?.id) {
    return {
      status: "error",
      message: "Authentication required",
    };
  }

  try {
    // 2. Verify card belongs to organization
    const card = await prisma.connectCard.findFirst({
      where: {
        id: cardId,
        organizationId: organization.id,
      },
    });

    if (!card) {
      return {
        status: "error",
        message: "Card not found",
      };
    }

    // 3. Mark as duplicate (we'll use REVIEWED status with a note in validationIssues)
    await prisma.connectCard.update({
      where: { id: cardId },
      data: {
        status: "REVIEWED", // Remove from queue
        validationIssues: {
          type: "DUPLICATE",
          message: "Marked as duplicate card",
          markedBy: session.user.id,
          timestamp: new Date(),
        } as never,
      },
    });

    // 4. Revalidate the review queue page
    revalidatePath(`/church/${slug}/admin/connect-cards/review`);

    return {
      status: "success",
      message: "Card marked as duplicate and removed from queue",
    };
  } catch (error) {
    console.error("Failed to mark duplicate:", error);
    return {
      status: "error",
      message: "Failed to mark card as duplicate",
    };
  }
}
