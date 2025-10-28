"use client";

import { DataTable } from "@/components/dashboard/payments/data-table";
import { connectCardColumns, type ConnectCardRow } from "./columns";

interface ConnectCardsTableProps {
  data: ConnectCardRow[];
}

/**
 * Connect Cards Table Component
 *
 * Enterprise-grade table using TanStack Table with:
 * - Sorting by any column
 * - Search by name
 * - Visit type filtering
 * - Pagination (10 cards per page)
 * - Empty state handling
 *
 * Uses the reusable DataTable component with connect card-specific configuration.
 */
export function ConnectCardsTable({ data }: ConnectCardsTableProps) {
  return (
    <DataTable
      columns={connectCardColumns}
      data={data}
      title="Recent Connect Cards"
      searchPlaceholder="Search by name..."
      searchColumn="name"
      statusFilterColumn="visitType"
      statusFilterOptions={[
        { value: "First Visit", label: "First Visit" },
        { value: "Second Visit", label: "Second Visit" },
        { value: "Regular attendee", label: "Regular Attendee" },
        { value: "Other", label: "Other" },
      ]}
      pageSize={10}
      defaultSortColumn="scannedAt"
      defaultSortDesc={true}
    />
  );
}
