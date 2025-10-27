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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeamPage({ params }: PageProps) {
  const { slug } = await params;
  const { organization, dataScope, session } =
    await requireDashboardAccess(slug);

  // Fetch team members based on data scope
  type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string | null;
    createdAt: Date;
    clinicId: null;
    clinic: null;
  };

  let teamMembers: TeamMember[] = [];

  // All scopes see users in their organization
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map to include null clinic fields for backwards compatibility
  teamMembers = users.map(user => ({
    ...user,
    clinicId: null,
    clinic: null,
  }));

  return (
    <PageContainer variant="none">
      <TeamManagementClient
        teamMembers={teamMembers}
        dataScope={dataScope}
        userClinic={null}
        currentUserId={session.user.id}
      />
    </PageContainer>
  );
}
