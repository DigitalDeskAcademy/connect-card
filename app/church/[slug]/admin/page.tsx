/**
 * Church Admin Dashboard
 *
 * Main dashboard for church administrators showing connect card analytics,
 * recent activity, and key metrics for visitor engagement and follow-up.
 * Features location-based tabs for multi-campus churches.
 */

import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import {
  getConnectCardAnalytics,
  getRecentConnectCards,
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
  const { organization } = await requireAgencyAdmin(slug);

  // Fetch locations, cumulative analytics, and recent cards
  const [locations, cumulativeAnalytics, cumulativeCards] = await Promise.all([
    getOrganizationLocations(organization.id),
    getConnectCardAnalytics(organization.id), // No locationId = all locations
    getRecentConnectCards(organization.id, 100), // No locationId = all cards
  ]);

  return (
    <PageContainer as="main">
      <DashboardClient
        slug={slug}
        organizationId={organization.id}
        locations={locations}
        cumulativeAnalytics={cumulativeAnalytics}
        cumulativeCards={cumulativeCards}
      />
    </PageContainer>
  );
}
