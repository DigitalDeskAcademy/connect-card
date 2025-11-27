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
}

export default async function ExportPage({ params }: PageProps) {
  const { slug } = await params;
  const { organization, member } = await requireDashboardAccess(slug);

  // Only owners and admins can export data
  const allowedRoles = ["owner", "admin"];
  if (member && !allowedRoles.includes(member.role)) {
    redirect("/unauthorized");
  }

  // Fetch locations for filter dropdown
  const locations = await getOrganizationLocations(organization.id);

  return (
    <PageContainer as="main">
      <ExportClient slug={slug} locations={locations} />
    </PageContainer>
  );
}
