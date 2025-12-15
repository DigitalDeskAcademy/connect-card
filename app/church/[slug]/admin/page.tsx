/**
 * Church Admin Dashboard
 *
 * Main dashboard for church administrators showing connect card analytics,
 * recent activity, and key metrics for visitor engagement and follow-up.
 * Features location-based tabs for multi-campus churches.
 *
 * Location-aware behavior:
 * - Staff see only their assigned location (defaultLocationSlug set)
 * - Admins with canSeeAllLocations see "All Locations" tab + all location tabs
 * - Quick actions include location context for pre-filtering
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import {
  getConnectCardAnalytics,
  getConnectCardChartData,
} from "@/lib/data/connect-card-analytics";
import { getOrganizationLocations } from "@/lib/data/locations";
import { countBatchesNeedingReview } from "@/lib/data/connect-card-batch";
import { PageContainer } from "@/components/layout/page-container";
import { DashboardClient } from "./_components/DashboardClient";

interface ChurchAdminDashboardProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ location?: string }>;
}

export default async function ChurchAdminDashboard({
  params,
  searchParams,
}: ChurchAdminDashboardProps) {
  const { slug } = await params;
  const { location: locationParam } = await searchParams;
  const { organization, dataScope } = await requireDashboardAccess(slug);

  // Fetch locations first
  const locations = await getOrganizationLocations(organization.id);

  // Fetch cumulative analytics, chart data, batch count, plus per-location data
  const [
    cumulativeAnalytics,
    chartData,
    batchesNeedingReview,
    ...locationData
  ] = await Promise.all([
    getConnectCardAnalytics(organization.id), // No locationId = all locations
    getConnectCardChartData(organization.id), // Chart data for last 90 days
    countBatchesNeedingReview(organization.id, dataScope.filters.locationId),
    // Fetch analytics and chart data for each location
    ...locations.flatMap(loc => [
      getConnectCardAnalytics(organization.id, loc.id),
      getConnectCardChartData(organization.id, loc.id),
    ]),
  ]);

  // Build per-location analytics map
  const locationAnalytics: Record<
    string,
    { analytics: typeof cumulativeAnalytics; chartData: typeof chartData }
  > = {};
  locations.forEach((loc, index) => {
    locationAnalytics[loc.slug] = {
      analytics: locationData[index * 2] as typeof cumulativeAnalytics,
      chartData: locationData[index * 2 + 1] as typeof chartData,
    };
  });

  // Find user's default location slug from locationId
  const userDefaultLocationSlug = dataScope.filters.locationId
    ? (locations.find(loc => loc.id === dataScope.filters.locationId)?.slug ??
      null)
    : null;

  // Determine active tab from URL or default
  // Valid tabs: "cumulative" (if canSeeAllLocations) or any location slug
  const validLocationSlugs = locations.map(loc => loc.slug);
  const validTabs = dataScope.filters.canSeeAllLocations
    ? ["cumulative", ...validLocationSlugs]
    : validLocationSlugs;

  // Default: user's assigned location, or "cumulative" if they can see all
  const defaultTab = userDefaultLocationSlug ?? "cumulative";
  const activeTab =
    locationParam && validTabs.includes(locationParam)
      ? locationParam
      : defaultTab;

  return (
    <PageContainer as="main" variant="tabs">
      <DashboardClient
        slug={slug}
        organizationId={organization.id}
        locations={locations}
        cumulativeAnalytics={cumulativeAnalytics}
        chartData={chartData}
        locationAnalytics={locationAnalytics}
        userDefaultLocationSlug={userDefaultLocationSlug}
        canSeeAllLocations={dataScope.filters.canSeeAllLocations}
        activeTab={activeTab}
        batchesNeedingReview={batchesNeedingReview}
      />
    </PageContainer>
  );
}
