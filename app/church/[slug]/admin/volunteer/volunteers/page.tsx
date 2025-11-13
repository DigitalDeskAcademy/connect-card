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
}

export default async function ChurchVolunteersPage({ params }: PageProps) {
  const { slug } = await params;

  // Universal access control - handles all user roles with proper data scoping
  const { dataScope, organization } = await requireDashboardAccess(slug);

  // Fetch volunteers with proper data scoping (multi-tenant + location filtering)
  const volunteers = await getVolunteersForScope(dataScope);

  // Fetch church members for volunteer creation dropdown
  // Only fetch members who don't already have a volunteer profile
  const churchMembers = await prisma.churchMember.findMany({
    where: {
      organizationId: organization.id,
      volunteer: null, // Only members without volunteer profiles
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

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

  // Note: Data is automatically filtered based on dataScope:
  // - Church admins see all volunteers in their organization
  // - Location staff see only volunteers at their assigned location
  // - Platform admins see all (but shouldn't access this route directly)

  return (
    <PageContainer variant="none">
      <VolunteersClient
        volunteers={volunteers}
        slug={slug}
        organizationId={organization.id}
        churchMembers={churchMembers}
        locations={locations}
      />
    </PageContainer>
  );
}
