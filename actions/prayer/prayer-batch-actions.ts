"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { z } from "zod";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

// Rate limiting configuration
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

// Validation schemas
const assignPrayersSchema = z.object({
  prayerRequestIds: z.array(z.string()).min(1, "At least one prayer required"),
  assignedToId: z.string().min(1, "Assigned user ID required"),
  batchId: z.string().min(1, "Batch ID required"),
});

const assignAllPrayersSchema = z.object({
  batchId: z.string().min(1, "Batch ID required"),
  assignedToId: z.string().min(1, "Assigned user ID required"),
});

type AssignPrayersData = z.infer<typeof assignPrayersSchema>;
type AssignAllPrayersData = z.infer<typeof assignAllPrayersSchema>;

/**
 * Assign selected prayer requests to a team member
 *
 * @param slug - Organization slug
 * @param data - Prayer request IDs and user ID
 */
export async function assignSelectedPrayers(
  slug: string,
  data: AssignPrayersData
): Promise<ApiResponse> {
  // 1. Authentication check
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_assign_prayers`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // 3. Validation
  const validation = assignPrayersSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid request data",
    };
  }

  try {
    // 4. Verify batch belongs to organization
    const batch = await prisma.prayerBatch.findFirst({
      where: {
        id: validation.data.batchId,
        organizationId: organization.id,
      },
    });

    if (!batch) {
      return {
        status: "error",
        message: "Batch not found",
      };
    }

    // 5. Verify assigned user belongs to organization
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

    // 6. Update selected prayer requests
    await prisma.prayerRequest.updateMany({
      where: {
        id: {
          in: validation.data.prayerRequestIds,
        },
        organizationId: organization.id,
        prayerBatchId: validation.data.batchId,
      },
      data: {
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name || assignedUser.email,
        status: "ASSIGNED",
      },
    });

    // 7. Update batch assignment if not already assigned
    if (!batch.assignedToId) {
      await prisma.prayerBatch.update({
        where: {
          id: validation.data.batchId,
        },
        data: {
          assignedToId: assignedUser.id,
          assignedToName: assignedUser.name || assignedUser.email,
          status: "IN_REVIEW",
        },
      });
    }

    // 8. Revalidate paths
    revalidatePath(`/church/${slug}/admin/prayer-batches`);
    revalidatePath(`/church/${slug}/admin/prayer-batches/${batch.id}`);
    revalidatePath(`/church/${slug}/admin/prayer`);

    return {
      status: "success",
      message: `Assigned ${validation.data.prayerRequestIds.length} prayer${validation.data.prayerRequestIds.length === 1 ? "" : "s"} to ${assignedUser.name || assignedUser.email}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to assign prayers",
    };
  }
}

/**
 * Assign all prayer requests in a batch to a team member
 *
 * @param slug - Organization slug
 * @param data - Batch ID and user ID
 */
export async function assignAllPrayers(
  slug: string,
  data: AssignAllPrayersData
): Promise<ApiResponse> {
  // 1. Authentication check
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_assign_all_prayers`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // 3. Validation
  const validation = assignAllPrayersSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid request data",
    };
  }

  try {
    // 4. Verify batch belongs to organization
    const batch = await prisma.prayerBatch.findFirst({
      where: {
        id: validation.data.batchId,
        organizationId: organization.id,
      },
      include: {
        _count: {
          select: {
            prayerRequests: true,
          },
        },
      },
    });

    if (!batch) {
      return {
        status: "error",
        message: "Batch not found",
      };
    }

    // 5. Verify assigned user belongs to organization
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

    // 6. Update all prayer requests in batch using transaction
    await prisma.$transaction([
      // Update all prayer requests in batch
      prisma.prayerRequest.updateMany({
        where: {
          prayerBatchId: validation.data.batchId,
          organizationId: organization.id,
        },
        data: {
          assignedToId: assignedUser.id,
          assignedToName: assignedUser.name || assignedUser.email,
          status: "ASSIGNED",
        },
      }),
      // Update batch assignment
      prisma.prayerBatch.update({
        where: {
          id: validation.data.batchId,
        },
        data: {
          assignedToId: assignedUser.id,
          assignedToName: assignedUser.name || assignedUser.email,
          status: "IN_REVIEW",
        },
      }),
    ]);

    // 7. Revalidate paths
    revalidatePath(`/church/${slug}/admin/prayer-batches`);
    revalidatePath(`/church/${slug}/admin/prayer-batches/${batch.id}`);
    revalidatePath(`/church/${slug}/admin/prayer`);

    return {
      status: "success",
      message: `Assigned all ${batch._count.prayerRequests} prayer${batch._count.prayerRequests === 1 ? "" : "s"} to ${assignedUser.name || assignedUser.email}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to assign prayers",
    };
  }
}
