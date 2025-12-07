"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DataTableProps,
  DataTableVariant,
  DataTableHeightMode,
  PaginationConfig,
} from "./types";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableContent } from "./data-table-content";
import { DataTablePagination } from "./data-table-pagination";

/**
 * Get default settings based on variant.
 */
function getVariantDefaults(variant: DataTableVariant) {
  switch (variant) {
    case "preview":
      return {
        height: "fixed" as DataTableHeightMode,
        maxHeight: "400px",
        pagination: false,
        pageSize: 10,
        wrapInCard: false,
      };
    case "compact":
      return {
        height: "auto" as DataTableHeightMode,
        maxHeight: undefined,
        pagination: true,
        pageSize: 10,
        wrapInCard: false,
      };
    case "full":
    default:
      return {
        height: "auto" as DataTableHeightMode,
        maxHeight: undefined,
        pagination: true,
        pageSize: 25,
        wrapInCard: true,
      };
  }
}

/**
 * DataTable - Unified, configurable data table component.
 *
 * Built on TanStack Table with consistent styling and behavior.
 * Use the `variant` prop for quick presets, or configure individual features.
 *
 * Variants:
 * - 'full': Complete table with pagination, sorting, filtering (default)
 * - 'preview': Limited rows, fixed height, no pagination (for export previews)
 * - 'compact': Minimal features, auto height (for simple lists)
 *
 * @example
 * // Full featured table
 * <DataTable
 *   columns={columns}
 *   data={payments}
 *   title="Payments"
 *   variant="full"
 *   enableSorting
 *   enableFiltering
 *   searchColumn="name"
 *   filters={[{ column: 'status', title: 'Status', options: [...] }]}
 * />
 *
 * @example
 * // Preview table (for exports)
 * <DataTable
 *   columns={columns}
 *   data={previewData}
 *   variant="preview"
 *   previewLimit={10}
 *   emptyState={{ title: "No data to export" }}
 * />
 *
 * @example
 * // Compact table
 * <DataTable
 *   columns={columns}
 *   data={items}
 *   variant="compact"
 *   pageSize={10}
 * />
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  variant = "full",
  title,
  description,
  headerAction,
  wrapInCard,
  height,
  maxHeight,
  pagination,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  enableSorting = false,
  enableFiltering = false,
  enableColumnVisibility = false,
  enableRowSelection = false,
  searchColumn,
  searchPlaceholder,
  filters,
  previewMode = false,
  previewLimit = 10,
  emptyState,
  onRowClick,
  onSelectionChange,
  className,
}: DataTableProps<TData, TValue>) {
  // Get defaults based on variant
  const defaults = getVariantDefaults(variant);

  // Merge props with defaults (explicit props override defaults)
  const resolvedWrapInCard = wrapInCard ?? defaults.wrapInCard;
  const resolvedHeight = height ?? defaults.height;
  const resolvedMaxHeight = maxHeight ?? defaults.maxHeight;
  const resolvedPagination = pagination ?? defaults.pagination;
  const resolvedPageSize = pageSize ?? defaults.pageSize;

  // Determine if we're in preview mode
  const isPreview = previewMode || variant === "preview";

  // Limit data in preview mode
  const displayData = useMemo(() => {
    if (isPreview) {
      return data.slice(0, previewLimit);
    }
    return data;
  }, [data, isPreview, previewLimit]);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Create table instance
  const table = useReactTable({
    data: displayData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Conditionally add models based on features
    ...(enableSorting && {
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
    }),
    ...(enableFiltering && {
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
    }),
    ...(!isPreview &&
      resolvedPagination && {
        getPaginationRowModel: getPaginationRowModel(),
      }),
    ...(enableColumnVisibility && {
      onColumnVisibilityChange: setColumnVisibility,
    }),
    ...(enableRowSelection && {
      onRowSelectionChange: setRowSelection,
    }),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: resolvedPageSize,
      },
    },
  });

  // Handle selection change callback
  useEffect(() => {
    if (onSelectionChange && enableRowSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map(row => row.original);
      onSelectionChange(selectedRows);
    }
  }, [onSelectionChange, enableRowSelection, table]);

  // Determine if toolbar should be shown
  const showToolbar =
    searchColumn || (filters && filters.length > 0) || enableColumnVisibility;

  // Parse pagination config
  const paginationConfig: PaginationConfig | undefined =
    typeof resolvedPagination === "object" ? resolvedPagination : undefined;

  // Build the table content
  const tableContent = (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {showToolbar && (
        <DataTableToolbar
          table={table}
          searchColumn={searchColumn}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          enableColumnVisibility={enableColumnVisibility}
        />
      )}

      {/* Table content */}
      <DataTableContent
        table={table}
        height={resolvedHeight}
        maxHeight={resolvedMaxHeight}
        emptyState={emptyState}
        onRowClick={onRowClick}
      />

      {/* Preview mode: show count indicator instead of pagination */}
      {isPreview && data.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {Math.min(previewLimit, data.length)} of {data.length} record
          {data.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Pagination (not in preview mode) */}
      {!isPreview && resolvedPagination && (
        <DataTablePagination
          table={table}
          totalCount={data.length}
          config={paginationConfig}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );

  // Wrap in card if configured
  if (resolvedWrapInCard) {
    return (
      <Card>
        {(title || headerAction) && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            {headerAction}
          </CardHeader>
        )}
        <CardContent>{tableContent}</CardContent>
      </Card>
    );
  }

  // Without card wrapper
  return (
    <div>
      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      {tableContent}
    </div>
  );
}
