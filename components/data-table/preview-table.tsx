"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableEmpty } from "./data-table-empty";
import { EmptyStateConfig } from "./types";

interface PreviewTableProps {
  /** Column headers */
  headers: string[];
  /** Row data (2D array of strings) */
  rows: string[][];
  /** Total count of records (for "Showing X of Y" display) */
  totalCount?: number;
  /** Maximum rows to display (default: 10) */
  maxRows?: number;
  /** Maximum height for scroll container (default: '400px') */
  maxHeight?: string;
  /** Empty state configuration */
  emptyState?: EmptyStateConfig;
  /** Additional class name */
  className?: string;
}

/**
 * PreviewTable - Simple table for previewing data before export/confirmation.
 *
 * Unlike DataTable (which uses TanStack Table and ColumnDef), this component
 * accepts raw string arrays. Perfect for:
 * - Export previews (CSV data)
 * - Confirmation dialogs
 * - Simple data display without sorting/filtering
 *
 * Features:
 * - Fixed height with scroll
 * - Sticky header
 * - "Showing X of Y records" indicator
 * - Consistent empty state
 *
 * @example
 * <PreviewTable
 *   headers={["First Name", "Last Name", "Email"]}
 *   rows={[
 *     ["John", "Doe", "john@example.com"],
 *     ["Jane", "Smith", "jane@example.com"],
 *   ]}
 *   totalCount={50}
 *   maxRows={10}
 *   emptyState={{
 *     icon: <CheckCircle className="h-8 w-8 text-green-500" />,
 *     title: "All caught up!",
 *     description: "No records to export",
 *   }}
 * />
 */
export function PreviewTable({
  headers,
  rows,
  totalCount,
  maxRows = 10,
  maxHeight = "400px",
  emptyState,
  className,
}: PreviewTableProps) {
  // Limit displayed rows
  const displayRows = rows.slice(0, maxRows);
  const hasData = displayRows.length > 0;

  // Calculate total for display
  const total = totalCount ?? rows.length;
  const showing = Math.min(maxRows, rows.length);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Table container with fixed height and scroll */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight }}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
              <TableRow>
                {headers.map((header, idx) => (
                  <TableHead
                    key={idx}
                    className="px-4 border-r last:border-r-0 border-border whitespace-nowrap font-medium"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasData ? (
                displayRows.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <TableCell
                        key={cellIdx}
                        className="px-4 border-r last:border-r-0 border-border whitespace-nowrap"
                      >
                        {cell || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length} className="h-64">
                    <DataTableEmpty config={emptyState} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Record count indicator */}
      {hasData && (
        <p className="text-sm text-muted-foreground">
          Showing {showing} of {total} record{total !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
