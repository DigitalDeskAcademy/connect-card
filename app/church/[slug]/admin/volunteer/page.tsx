/**
 * Church Admin - Volunteers Page
 *
 * Displays volunteer directory and management interface.
 * Shows all volunteers with their status, skills, background checks, and shift assignments.
 * Data is automatically scoped based on user role (church admin, staff, etc.)
 *
 * Features:
 * - Volunteer directory with search and filtering
 * - Summary cards showing key metrics
 * - Background check status tracking
 * - Skills and availability management
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { VolunteersClient } from "@/components/dashboard/volunteers/volunteers-client";
import { getVolunteersForScope } from "@/lib/data/volunteers";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChurchVolunteersPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;

  // Universal access control - handles all user roles with proper data scoping
  const { dataScope, organization } = await requireDashboardAccess(slug);

  // Fetch volunteers with proper data scoping (multi-tenant + location filtering)
  const volunteers = await getVolunteersForScope(dataScope);

  // Fetch active locations for multi-campus assignment
  const locations = await prisma.location.findMany({
    where: {
      organizationId: organization.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate tab counts
  const pendingCount = volunteers.filter((v) => v.status === "PENDING").length;
  const allCount = volunteers.filter((v) =>
    ["ACTIVE", "INACTIVE"].includes(v.status)
  ).length;

  // Determine active tab (default to "all")
  const activeTab =
    typeof tab === "string" && ["all", "pending"].includes(tab)
      ? tab
      : "all";

  // Note: Data is automatically filtered based on dataScope:
  // - Church admins see all volunteers in their organization
  // - Location staff see only volunteers at their assigned location
  // - Platform admins see all (but shouldn't access this route directly)

  return (
    <PageContainer
      variant="tabs"
      as="main"
      backButton={{
        href: `/church/${slug}/admin`,
        label: "Back",
      }}
    >
      <VolunteersClient
        volunteers={volunteers}
        slug={slug}
        organizationId={organization.id}
        locations={locations}
        activeTab={activeTab}
        tabCounts={{ all: allCount, pending: pendingCount }}
        canDelete={dataScope.filters.canDeleteData}
      />
    </PageContainer>
  );
}
