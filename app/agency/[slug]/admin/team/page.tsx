/**
 * Team Management Page
 *
 * Allows clinic admins to manage their staff members.
 * Agency admins can manage all users in their organization.
 * Platform admins can view and manage all users across all organizations.
 */

import {
  requireDashboardAccess,
  isClinicScope,
} from "@/app/data/dashboard/require-dashboard-access";
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
    clinicId: string | null;
    createdAt: Date;
    clinic: { name: string } | null;
  };

  let teamMembers: TeamMember[] = [];

  if (dataScope.type === "platform") {
    // Platform admin: see all users in this organization
    teamMembers = await prisma.user.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        createdAt: true,
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else if (dataScope.type === "agency") {
    // Agency admin: see all users in their organization
    teamMembers = await prisma.user.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        createdAt: true,
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else if (dataScope.type === "clinic" && dataScope.clinicId) {
    // Clinic admin: see only their clinic's staff
    teamMembers = await prisma.user.findMany({
      where: {
        organizationId: organization.id,
        clinicId: dataScope.clinicId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clinicId: true,
        createdAt: true,
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Get current user's clinic info if they're a clinic user
  let userClinic = null;
  if (isClinicScope(dataScope)) {
    userClinic = await prisma.contact.findUnique({
      where: {
        id: dataScope.clinicId,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  return (
    <TeamManagementClient
      teamMembers={teamMembers}
      dataScope={dataScope}
      userClinic={userClinic}
      currentUserId={session.user.id}
    />
  );
}
