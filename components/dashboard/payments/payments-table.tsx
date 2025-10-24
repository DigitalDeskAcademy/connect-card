"use client";

import { DataTable } from "./data-table";
import { paymentColumns } from "./columns";
import type { PaymentWithRelations } from "./payments-client";

interface PaymentsTableProps {
  payments: PaymentWithRelations[];
}

/**
 * Payments Table Component
 *
 * Refactored to use TanStack Table with shadcn data-table pattern.
 *
 * Features:
 * - Sortable columns (click column headers)
 * - Search filtering (member name, invoice number, description)
 * - Status filtering (paid, pending, failed, refunded)
 * - Pagination (10 items per page)
 * - Empty state with shadcn Empty component
 * - Search with shadcn InputGroup component
 * - Pagination with shadcn Pagination component
 *
 * Architecture:
 * - columns.tsx: Column definitions with TanStack Table types
 * - data-table.tsx: Reusable DataTable component with all features
 * - payments-table.tsx: Wrapper component (this file)
 *
 * This pattern is reusable for other data tables (appointments, contacts, inventory, etc.)
 */
export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <DataTable
      columns={paymentColumns}
      data={payments}
      title="Payment Transactions"
      searchPlaceholder="Search payments..."
      searchColumn="memberName"
      statusFilterColumn="status"
      statusFilterOptions={[
        { value: "ALL", label: "All Status" },
        { value: "PAID", label: "Paid" },
        { value: "PENDING", label: "Pending" },
        { value: "FAILED", label: "Failed" },
        { value: "REFUNDED", label: "Refunded" },
        { value: "PARTIALLY_REFUNDED", label: "Partial Refund" },
      ]}
    />
  );
}
