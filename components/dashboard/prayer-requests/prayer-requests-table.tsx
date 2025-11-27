/**
 * Prayer Requests Table - Server Component
 *
 * Fetches prayer requests data and displays in a sortable, filterable table.
 * Respects multi-tenant data isolation and location-based access control.
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { getPrayerRequestsForScope } from "@/lib/data/prayer-requests";
import { getOrganizationLocations } from "@/lib/data/locations";
import { PrayerRequestDataTable } from "./data-table";
import { prayerRequestColumns } from "./columns";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";

interface PrayerRequestsTableProps {
  slug: string;
}

export async function PrayerRequestsTable({ slug }: PrayerRequestsTableProps) {
  // 1. Verify access and get data scope
  const { dataScope, session, organization } =
    await requireDashboardAccess(slug);

  // 2. Fetch prayer requests for user's scope (paginated)
  const { data: prayerRequests } = await getPrayerRequestsForScope(
    dataScope,
    session.user.id
  );

  // 3. Fetch organization locations for create dialog
  const locations = await getOrganizationLocations(organization.id);

  // 4. Transform to list items for table
  const listItems: PrayerRequestListItem[] = prayerRequests.map(request => ({
    id: request.id,
    request: request.request,
    category: request.category,
    status: request.status,
    isPrivate: request.isPrivate,
    isUrgent: request.isUrgent,
    submittedBy: request.submittedBy,
    assignedToName: request.assignedToName,
    locationName: request.location?.name || null,
    createdAt: request.createdAt,
    followUpDate: request.followUpDate,
    answeredDate: request.answeredDate,
  }));

  return (
    <PrayerRequestDataTable
      columns={prayerRequestColumns}
      data={listItems}
      title="Prayer Requests"
      pageSize={10}
      slug={slug}
      locations={locations}
      teamMembers={[]} // Not used in current implementation
    />
  );
}
