/**
 * Church Admin - Volunteer Events Page
 *
 * Displays volunteer events with filtering and multiple view options.
 *
 * Features:
 * - Card/List/Calendar view toggles
 * - Event type filtering
 * - Search by name/description/location
 * - Capacity indicators with progress bars
 * - GHL integration for volunteer outreach
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getEventsForScope, ALL_EVENT_TYPES } from "@/lib/data/events";
import { prisma } from "@/lib/db";
import { EventsClient } from "./_components/events-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VolunteerEventsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  // Universal access control - handles all user roles with proper data scoping
  const { dataScope, organization } = await requireDashboardAccess(slug);

  // Fetch events with proper data scoping (multi-tenant + location filtering)
  const events = await getEventsForScope(dataScope, {
    status: ["DRAFT", "PUBLISHED", "IN_PROGRESS", "COMPLETED"],
  });

  // Fetch active locations for filtering and event creation
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

  // Fetch team members who can be event leaders
  const teamMembers = await prisma.user.findMany({
    where: {
      organizationId: organization.id,
      role: { in: ["church_owner", "church_admin", "volunteer_leader"] },
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

  // Get eventType filter from URL if present
  const eventTypeFilter =
    typeof resolvedSearchParams.type === "string"
      ? resolvedSearchParams.type
      : undefined;

  return (
    <PageContainer variant="tabs" as="main">
      <EventsClient
        events={events}
        slug={slug}
        organizationId={organization.id}
        locations={locations}
        teamMembers={teamMembers}
        eventTypes={ALL_EVENT_TYPES}
        initialEventTypeFilter={eventTypeFilter}
        canDelete={dataScope.filters.canDeleteData}
      />
    </PageContainer>
  );
}
