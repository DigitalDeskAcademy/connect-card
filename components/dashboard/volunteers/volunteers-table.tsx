"use client";

import { DataTable } from "../payments/data-table";
import { volunteerColumns } from "./columns";
import type { VolunteerWithRelations } from "./volunteers-client";

interface VolunteersTableProps {
  volunteers: VolunteerWithRelations[];
}

/**
 * Volunteers Table Component
 *
 * Displays volunteer directory with TanStack Table.
 *
 * Features:
 * - Sortable columns (name, status, start date)
 * - Search filtering (volunteer name, email)
 * - Status filtering (active, on break, inactive, pending)
 * - Pagination (10 items per page)
 * - Empty state for no volunteers
 *
 * Architecture:
 * - columns.tsx: Column definitions with TanStack Table types
 * - data-table.tsx: Reusable DataTable component (shared with payments)
 * - volunteers-table.tsx: Wrapper component (this file)
 */
export function VolunteersTable({ volunteers }: VolunteersTableProps) {
  return (
    <DataTable
      columns={volunteerColumns}
      data={volunteers}
      title="Volunteer Directory"
      searchPlaceholder="Search volunteers..."
      searchColumn="name"
      statusFilterColumn="status"
      statusFilterOptions={[
        { value: "ALL", label: "All Status" },
        { value: "ACTIVE", label: "Active" },
        { value: "ON_BREAK", label: "On Break" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "PENDING_APPROVAL", label: "Pending" },
      ]}
      defaultSortColumn="name"
      defaultSortDesc={false}
      emptyStateTitle="No volunteers yet"
      emptyStateDescription="Add your first volunteer to get started with volunteer management"
    />
  );
}
