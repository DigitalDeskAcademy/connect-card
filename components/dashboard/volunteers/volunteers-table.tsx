"use client";

import { VolunteerDataTable } from "./data-table";
import { volunteerColumns } from "./columns";
import type { VolunteerWithRelations } from "./volunteers-client";

interface Location {
  id: string;
  name: string;
}

interface VolunteersTableProps {
  volunteers: VolunteerWithRelations[];
  slug: string;
  organizationId: string;
  locations: Location[];
}

/**
 * Volunteers Table Component
 *
 * Displays volunteer directory with TanStack Table.
 *
 * Features:
 * - Sortable columns (name, background check status)
 * - Checkbox selection for bulk operations
 * - Search filtering (volunteer name, email)
 * - Background check status filtering
 * - Pagination (10 items per page)
 * - Empty state for no volunteers
 * - Integrated create volunteer button
 *
 * Architecture:
 * - columns.tsx: Column definitions with checkbox selection
 * - data-table.tsx: VolunteerDataTable component (based on prayer table pattern)
 * - volunteers-table.tsx: Wrapper component (this file)
 */
export function VolunteersTable({
  volunteers,
  slug,
  organizationId,
  locations,
}: VolunteersTableProps) {
  return (
    <VolunteerDataTable
      columns={volunteerColumns}
      data={volunteers}
      title="Volunteer Directory"
      pageSize={10}
      slug={slug}
      organizationId={organizationId}
      locations={locations}
    />
  );
}
