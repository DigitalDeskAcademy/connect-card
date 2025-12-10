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
import { PageContainer } from "@/components/layout/page-container";
import { DashboardClient } from "./_components/DashboardClient";

interface ChurchAdminDashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function ChurchAdminDashboard({
  params,
}: ChurchAdminDashboardProps) {
  const { slug } = await params;
  const { organization, dataScope } = await requireDashboardAccess(slug);

  // Fetch locations first
  const locations = await getOrganizationLocations(organization.id);

  // Fetch cumulative analytics and chart data, plus per-location data
  const [cumulativeAnalytics, chartData, ...locationData] = await Promise.all([
    getConnectCardAnalytics(organization.id), // No locationId = all locations
    getConnectCardChartData(organization.id), // Chart data for last 90 days
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

  return (
    <PageContainer as="main">
      <DashboardClient
        slug={slug}
        organizationId={organization.id}
        locations={locations}
        cumulativeAnalytics={cumulativeAnalytics}
        chartData={chartData}
        locationAnalytics={locationAnalytics}
        userDefaultLocationSlug={userDefaultLocationSlug}
        canSeeAllLocations={dataScope.filters.canSeeAllLocations}
      />
    </PageContainer>
  );
}
