/**
 * Prayer Request Management
 *
 * Unified prayer management with tabbed navigation:
 * - Requests: Unassigned prayers inbox (select & assign to create batches)
 * - Batches: View/manage assigned prayer batches
 * - My Prayer Sheet: Personal prayer session view
 */

import { PageContainer } from "@/components/layout/page-container";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getPrayerRequestsForScope } from "@/lib/data/prayer-requests";
import { getOrganizationLocations } from "@/lib/data/locations";
import { getPrayerBatches } from "@/lib/data/prayer-batches";
import { getMyAssignedPrayers } from "@/lib/data/prayer-requests";
import { PrayerPageClient } from "./_components/PrayerPageClient";
import { prisma } from "@/lib/db";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";

interface PrayerPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PrayerPage({
  params,
  searchParams,
}: PrayerPageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;

  // 1. Verify access and get data scope
  const { dataScope, session, organization } =
    await requireDashboardAccess(slug);

  // 2. Fetch all data in parallel for all three tabs
  const [prayerRequestsResult, locations, batches, myPrayers, teamMembers] =
    await Promise.all([
      // Requests tab - Only PENDING (unassigned) prayers
      getPrayerRequestsForScope(dataScope, session.user.id, {
        status: "PENDING",
      }),
      getOrganizationLocations(organization.id),
      // Batches tab
      getPrayerBatches(organization.id),
      // My Prayer Sheet tab
      getMyAssignedPrayers(organization.id, session.user.id),
      // Team members for assignment dropdown
      prisma.user.findMany({
        where: { organizationId: organization.id },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);

  // 3. Transform prayer requests to list items for table
  const prayerRequests: PrayerRequestListItem[] = prayerRequestsResult.data.map(
    request => ({
      id: request.id,
      request: request.request,
      category: request.category,
      status: request.status,
      isPrivate: request.isPrivate,
      isUrgent: request.isUrgent,
      submittedBy: request.submittedBy,
      assignedToName: request.assignedToName,
      locationName: request.location?.name || null,
      createdAt: request.createdAt,
      followUpDate: request.followUpDate,
      answeredDate: request.answeredDate,
    })
  );

  // 4. Determine active tab (default to "requests")
  const activeTab =
    typeof tab === "string" &&
    ["requests", "batches", "my-prayers"].includes(tab)
      ? tab
      : "requests";

  return (
    <PageContainer as="main" variant="tabs">
      <PrayerPageClient
        slug={slug}
        prayerRequests={prayerRequests}
        locations={locations}
        batches={batches}
        myPrayers={myPrayers}
        teamMembers={teamMembers}
        userName={session.user.name || session.user.email}
        activeTab={activeTab}
        pendingBatchCount={
          batches.filter(
            b =>
              b.status !== "COMPLETED" &&
              b.status !== "ARCHIVED" &&
              b._count.prayerRequests > 0
          ).length
        }
        myPrayerCount={
          batches.filter(
            b =>
              b.assignedTo?.id === session.user.id && b.status !== "COMPLETED"
          ).length
        }
        unassignedCount={prayerRequests.length}
      />
    </PageContainer>
  );
}
