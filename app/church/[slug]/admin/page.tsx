/**
 * Church Admin Dashboard
 *
 * Main dashboard for church administrators showing connect card analytics,
 * recent activity, and key metrics for visitor engagement and follow-up.
 * Features location-based tabs for multi-campus churches.
 */

import { requireChurchAdmin } from "@/app/data/church/require-church-admin";
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
  const { organization } = await requireChurchAdmin(slug);

  // Fetch locations, cumulative analytics, and chart data
  const [locations, cumulativeAnalytics, chartData] = await Promise.all([
    getOrganizationLocations(organization.id),
    getConnectCardAnalytics(organization.id), // No locationId = all locations
    getConnectCardChartData(organization.id), // Chart data for last 90 days
  ]);

  return (
    <PageContainer as="main">
      <DashboardClient
        slug={slug}
        organizationId={organization.id}
        locations={locations}
        cumulativeAnalytics={cumulativeAnalytics}
        chartData={chartData}
      />
    </PageContainer>
  );
}
