"use client";

import { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePaginationProps, PaginationConfig } from "./types";

interface Props<TData> extends DataTablePaginationProps {
  /** TanStack Table instance */
  table: Table<TData>;
  /** Total row count (before pagination) */
  totalCount: number;
}

/**
 * DataTablePagination - Standardized pagination controls for data tables.
 *
 * Supports three display formats:
 * - 'range': "Showing 1-25 of 150 results" (default, best for admin tables)
 * - 'page': "Page 1 of 6" (compact)
 * - 'simple': "1 of 6" (minimal)
 *
 * Features:
 * - Previous/Next navigation (always shown)
 * - First/Last navigation (optional)
 * - Page size selector (optional)
 * - Disabled states when at boundaries
 *
 * @example
 * <DataTablePagination
 *   table={table}
 *   totalCount={150}
 *   config={{ format: 'range', showPageSize: true }}
 *   pageSizeOptions={[10, 25, 50, 100]}
 *   entityName="payments"
 * />
 */
export function DataTablePagination<TData>({
  table,
  totalCount,
  config,
  pageSizeOptions = [10, 25, 50, 100],
  entityName = "results",
}: Props<TData>) {
  // Merge with defaults
  const {
    showPageSize = true,
    showFirstLast = false,
    format = "range",
  }: PaginationConfig = config ?? {};

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();

  // Calculate display values
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalCount);

  // Generate pagination info text based on format
  const getPaginationText = () => {
    switch (format) {
      case "range":
        return `Showing ${startRow}-${endRow} of ${totalCount} ${entityName}`;
      case "page":
        return `Page ${pageIndex + 1} of ${pageCount}`;
      case "simple":
        return `${pageIndex + 1} of ${pageCount}`;
      default:
        return `Showing ${startRow}-${endRow} of ${totalCount} ${entityName}`;
    }
  };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Left side: Pagination info */}
      <div className="text-sm text-muted-foreground">{getPaginationText()}</div>

      {/* Right side: Controls */}
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={value => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Next page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
