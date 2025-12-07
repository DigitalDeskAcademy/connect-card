"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";

/**
 * Complete Prayer Session
 *
 * Marks all prayer batches assigned to the current user as COMPLETED.
 * This signals to coordinators that the team member has finished
 * their prayer session.
 *
 * Security:
 * - Requires authenticated user
 * - Only marks batches assigned to the current user
 * - Multi-tenant isolation via organizationId
 *
 * @param slug - Organization slug for multi-tenant context
 * @returns ApiResponse with count of completed batches
 */
export async function completePrayerSession(
  slug: string
): Promise<ApiResponse<{ completedCount: number }>> {
  // 1. Authentication and authorization
  const { session, organization } = await requireDashboardAccess(slug);

  try {
    // 2. Find and update all pending/in-review batches assigned to this user
    const result = await prisma.prayerBatch.updateMany({
      where: {
        organizationId: organization.id,
        assignedToId: session.user.id,
        status: {
          in: ["PENDING", "IN_REVIEW"],
        },
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // 3. Return success with count
    if (result.count === 0) {
      return {
        status: "success",
        message: "Prayer session marked complete",
        data: { completedCount: 0 },
      };
    }

    return {
      status: "success",
      message: `Prayer session complete! ${result.count} batch${result.count === 1 ? "" : "es"} marked as finished.`,
      data: { completedCount: result.count },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to complete prayer session",
    };
  }
}
