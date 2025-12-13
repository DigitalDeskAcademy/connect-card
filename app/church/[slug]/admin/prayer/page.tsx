/**
 * Prayer Request Management
 *
 * Unified prayer management with tabbed navigation:
 * - All Requests: Prayer request table with search/filter
 * - Batches: Daily prayer batches for assignment
 * - My Prayer Sheet: Personal prayer session view
 */

import { PageContainer } from "@/components/layout/page-container";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getPrayerRequestsForScope } from "@/lib/data/prayer-requests";
import { getOrganizationLocations } from "@/lib/data/locations";
import { getPrayerBatches } from "@/lib/data/prayer-batches";
import { getMyAssignedPrayers } from "@/lib/data/prayer-requests";
import { PrayerPageClient } from "./_components/PrayerPageClient";
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
  const [prayerRequestsResult, locations, batches, myPrayers] =
    await Promise.all([
      // All Requests tab
      getPrayerRequestsForScope(dataScope, session.user.id),
      getOrganizationLocations(organization.id),
      // Batches tab
      getPrayerBatches(organization.id),
      // My Prayer Sheet tab
      getMyAssignedPrayers(organization.id, session.user.id),
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
        userName={session.user.name || session.user.email}
        activeTab={activeTab}
        pendingBatchCount={batches.filter(b => b.status === "PENDING").length}
        myPrayerCount={myPrayers.length}
      />
    </PageContainer>
  );
}
