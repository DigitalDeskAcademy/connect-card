/**
 * Church Admin - Event Detail Page
 *
 * Displays full details of a volunteer event including sessions,
 * volunteer assignments, and capacity tracking.
 *
 * Features:
 * - Event overview with status and leader info
 * - Session list with capacity indicators
 * - Volunteer assignments per session
 * - Quick actions (Publish, Cancel, Edit)
 */

import { notFound } from "next/navigation";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";
import { getEventById } from "@/lib/data/events";
import { EventDetailClient } from "./_components/event-detail-client";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug, id } = await params;

  // Universal access control - handles all user roles with proper data scoping
  const { dataScope } = await requireDashboardAccess(slug);

  // Fetch event with full details (sessions, assignments, volunteers)
  const event = await getEventById(dataScope, id);

  if (!event) {
    notFound();
  }

  return (
    <PageContainer variant="default" as="main">
      <EventDetailClient
        event={event}
        slug={slug}
        canDelete={dataScope.filters.canDeleteData}
      />
    </PageContainer>
  );
}
