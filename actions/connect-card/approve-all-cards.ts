"use server";

import { prisma } from "@/lib/db";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { revalidatePath } from "next/cache";

/**
 * Batch approve all pending connect cards for an organization
 * Updates all cards with EXTRACTED status to REVIEWED status
 * Requires staff/admin access to the organization
 */
export async function approveAllCards(slug: string) {
  // 1. Verify authentication and organization access
  const { session, organization } = await requireDashboardAccess(slug);

  if (!session?.user?.id || !organization?.id) {
    return {
      status: "error",
      message: "Authentication required",
    };
  }

  try {
    // 2. Update all EXTRACTED cards to REVIEWED status
    const result = await prisma.connectCard.updateMany({
      where: {
        organizationId: organization.id,
        status: "EXTRACTED",
      },
      data: {
        status: "REVIEWED",
      },
    });

    // 3. Revalidate the review queue page
    revalidatePath(`/church/${slug}/admin/connect-cards/review`);

    return {
      status: "success",
      message: `${result.count} card${result.count === 1 ? "" : "s"} approved`,
      data: { count: result.count },
    };
  } catch (error) {
    console.error("Failed to approve all cards:", error);
    return {
      status: "error",
      message: "Failed to approve cards",
    };
  }
}
