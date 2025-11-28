/**
 * Export Page
 *
 * Allows church admins to export connect card data to CSV format
 * compatible with Planning Center, Breeze, or generic imports.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getOrganizationLocations } from "@/lib/data/locations";
import { redirect } from "next/navigation";
import { ExportClient } from "./client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ExportPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const { organization, member } = await requireDashboardAccess(slug);

  // Only owners and admins can export data
  const allowedRoles = ["owner", "admin"];
  if (member && !allowedRoles.includes(member.role)) {
    redirect("/unauthorized");
  }

  // Fetch locations for filter dropdown
  const locations = await getOrganizationLocations(organization.id);

  // Default to "export" tab
  const activeTab = tab || "export";

  return (
    <PageContainer as="main" variant="tabs">
      <ExportClient slug={slug} locations={locations} activeTab={activeTab} />
    </PageContainer>
  );
}
