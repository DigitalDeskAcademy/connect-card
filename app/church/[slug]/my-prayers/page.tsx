/**
 * My Prayer Sheet Page
 *
 * The prayer team member's dedicated prayer session view.
 * Shows all prayers assigned to the current user in a clean,
 * devotional-focused layout optimized for prayer time.
 *
 * Features:
 * - Grouped by category (Critical first, Private last)
 * - Print-friendly layout
 * - Mark prayers as answered
 * - Complete session action
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getMyAssignedPrayers } from "@/lib/data/prayer-requests";
import { MyPrayersClient } from "./my-prayers-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MyPrayersPage({ params }: PageProps) {
  const { slug } = await params;

  // Verify access and get user info
  const { session, organization } = await requireDashboardAccess(slug);

  // Fetch prayers assigned to this user
  const prayers = await getMyAssignedPrayers(organization.id, session.user.id);

  return (
    <MyPrayersClient
      prayers={prayers}
      slug={slug}
      userName={session.user.name || session.user.email}
    />
  );
}
