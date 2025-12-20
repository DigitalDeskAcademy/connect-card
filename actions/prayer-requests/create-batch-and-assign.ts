"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 10,
  })
);

const createBatchAndAssignSchema = z.object({
  prayerRequestIds: z.array(z.string()).min(1, "At least one prayer required"),
  assignedToId: z.string().min(1, "Assigned user ID required"),
});

type CreateBatchAndAssignData = z.infer<typeof createBatchAndAssignSchema>;

/**
 * Create Batch and Assign Prayers
 *
 * Creates a new prayer batch from selected unassigned prayers and assigns
 * the entire batch to a team member. This is the primary workflow for
 * clearing the prayer request inbox.
 *
 * Workflow:
 * 1. Validates all selected prayers are unassigned
 * 2. Creates a new PrayerBatch
 * 3. Links all prayers to the batch
 * 4. Assigns prayers to the team member
 * 5. Updates batch status to IN_REVIEW
 *
 * Security:
 * - Requires dashboard access (admin or staff)
 * - Multi-tenant isolation via organizationId
 * - Rate limiting via Arcjet
 *
 * @param slug - Organization slug
 * @param data - Prayer request IDs and assignee ID
 * @returns ApiResponse with batch ID on success
 */
export async function createBatchAndAssign(
  slug: string,
  data: CreateBatchAndAssignData
): Promise<ApiResponse<{ batchId: string; assignedCount: number }>> {
  // 1. Authentication check
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_create_batch_assign`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please try again later.",
      };
    }
    return {
      status: "error",
      message: "Request blocked. Please contact support.",
    };
  }

  // 3. Validation
  const validation = createBatchAndAssignSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid request data",
    };
  }

  try {
    // 4. Verify assigned user belongs to organization
    const assignedUser = await prisma.user.findFirst({
      where: {
        id: validation.data.assignedToId,
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!assignedUser) {
      return {
        status: "error",
        message: "Team member not found",
      };
    }

    // 5. Verify all prayers belong to org and are unassigned
    const prayers = await prisma.prayerRequest.findMany({
      where: {
        id: { in: validation.data.prayerRequestIds },
        organizationId: organization.id,
      },
      select: {
        id: true,
        assignedToId: true,
        locationId: true,
      },
    });

    if (prayers.length !== validation.data.prayerRequestIds.length) {
      return {
        status: "error",
        message: "Some prayer requests were not found",
      };
    }

    // Check if any are already assigned
    const alreadyAssigned = prayers.filter(p => p.assignedToId !== null);
    if (alreadyAssigned.length > 0) {
      return {
        status: "error",
        message: `${alreadyAssigned.length} prayer(s) are already assigned. Please refresh and try again.`,
      };
    }

    // 6. Determine location (use most common location from prayers, or null)
    const locationCounts = prayers.reduce(
      (acc, p) => {
        const loc = p.locationId || "null";
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const mostCommonLocation = Object.entries(locationCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    const batchLocationId =
      mostCommonLocation === "null" ? null : mostCommonLocation;

    // 7. Create batch and assign prayers in a transaction
    const today = new Date();
    const batchName = `Prayer Batch - ${format(today, "MMM d, yyyy h:mm a")}`;

    const result = await prisma.$transaction(async tx => {
      // Create the batch
      const batch = await tx.prayerBatch.create({
        data: {
          name: batchName,
          organizationId: organization.id,
          locationId: batchLocationId,
          batchDate: today,
          status: "IN_REVIEW",
          assignedToId: assignedUser.id,
          assignedToName: assignedUser.name || assignedUser.email,
          prayerCount: prayers.length,
        },
      });

      // Update all prayers: link to batch and assign to user
      await tx.prayerRequest.updateMany({
        where: {
          id: { in: validation.data.prayerRequestIds },
          organizationId: organization.id,
        },
        data: {
          prayerBatchId: batch.id,
          assignedToId: assignedUser.id,
          assignedToName: assignedUser.name || assignedUser.email,
          status: "ASSIGNED",
        },
      });

      return batch;
    });

    // 8. Revalidate paths
    revalidatePath(`/church/${slug}/admin/prayer`);
    revalidatePath(`/church/${slug}/admin/prayer-batches`);
    revalidatePath(`/church/${slug}/admin/prayer-batches/${result.id}`);

    return {
      status: "success",
      message: `Created batch and assigned ${prayers.length} prayer${prayers.length === 1 ? "" : "s"} to ${assignedUser.name || assignedUser.email}`,
      data: {
        batchId: result.id,
        assignedCount: prayers.length,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to create batch and assign prayers",
    };
  }
}
