/**
 * Team Management Page
 *
 * Allows church admins to manage their team members.
 * Platform admins can view and manage all users across all organizations.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import TeamManagementClient from "./client";
import { prisma } from "@/lib/db";
import { getOrganizationLocations } from "@/lib/data/locations";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeamPage({ params }: PageProps) {
  const { slug } = await params;
  const { organization, dataScope, session } =
    await requireDashboardAccess(slug);

  // Fetch team members with their assigned locations
  type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string | null;
    createdAt: Date;
    defaultLocationId: string | null;
    locationName: string | null;
  };

  // Fetch users with their default locations
  const users = await prisma.user.findMany({
    where: {
      organizationId: organization.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      defaultLocationId: true,
      defaultLocation: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map users with location names
  const teamMembers: TeamMember[] = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    defaultLocationId: user.defaultLocationId,
    locationName: user.defaultLocation?.name || null,
  }));

  // Fetch organization locations for staff assignment
  const locations = await getOrganizationLocations(organization.id);

  // Fetch pending invitations
  const pendingInvitations = await prisma.invitation.findMany({
    where: {
      organizationId: organization.id,
      status: "PENDING",
    },
    select: {
      id: true,
      email: true,
      role: true,
      locationId: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Enrich invitations with location names
  const enrichedInvitations = await Promise.all(
    pendingInvitations.map(async inv => {
      let locationName: string | null = null;
      if (inv.locationId) {
        const location = await prisma.location.findUnique({
          where: { id: inv.locationId },
          select: { name: true },
        });
        locationName = location?.name || null;
      }
      return {
        ...inv,
        locationName,
      };
    })
  );

  return (
    <PageContainer as="main">
      <TeamManagementClient
        teamMembers={teamMembers}
        dataScope={dataScope}
        currentUserId={session.user.id}
        locations={locations}
        organizationSlug={slug}
        pendingInvitations={enrichedInvitations}
      />
    </PageContainer>
  );
}
