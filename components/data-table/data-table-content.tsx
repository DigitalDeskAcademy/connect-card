"use client";

import { flexRender, Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableHeightMode } from "./types";
import { DataTableEmpty } from "./data-table-empty";
import { EmptyStateConfig } from "./types";

interface DataTableContentProps<TData> {
  /** TanStack Table instance */
  table: Table<TData>;
  /** Height mode */
  height?: DataTableHeightMode;
  /** Max height for fixed mode (e.g., '400px') */
  maxHeight?: string;
  /** Empty state configuration */
  emptyState?: EmptyStateConfig;
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** Additional className for the container */
  className?: string;
}

/**
 * DataTableContent - Handles table rendering with correct height/scroll behavior.
 *
 * Height Modes:
 * - 'auto': Table grows with content (no scroll container)
 * - 'flex': Fills available space in flex parent (needs parent with flex-1)
 * - 'fixed': Uses maxHeight with scroll (default: 400px)
 *
 * Features:
 * - Sticky header (always visible when scrolling)
 * - Proper border handling
 * - Empty state integration
 * - Row click support
 *
 * @example
 * // Fixed height (for preview tables)
 * <DataTableContent
 *   table={table}
 *   height="fixed"
 *   maxHeight="400px"
 *   emptyState={{ title: "No data" }}
 * />
 *
 * @example
 * // Flex height (fills container)
 * <DataTableContent
 *   table={table}
 *   height="flex"
 * />
 */
export function DataTableContent<TData>({
  table,
  height = "auto",
  maxHeight = "400px",
  emptyState,
  onRowClick,
  className,
}: DataTableContentProps<TData>) {
  const rows = table.getRowModel().rows;
  const columns = table.getAllColumns();
  const hasData = rows.length > 0;

  // Determine container classes based on height mode
  const getContainerClasses = () => {
    switch (height) {
      case "flex":
        // Flex mode: fills available space, needs overflow handling
        return "flex-1 min-h-0 overflow-auto";
      case "fixed":
        // Fixed mode: explicit max height with scroll
        return "overflow-auto";
      case "auto":
      default:
        // Auto mode: natural height, no scroll container
        return "";
    }
  };

  // Container style for fixed height
  const containerStyle = height === "fixed" ? { maxHeight } : undefined;

  return (
    <div className={cn("rounded-md border", className)}>
      <div className={getContainerClasses()} style={containerStyle}>
        <TableRoot>
          <TableHeader
            className={cn(
              // Sticky header for scroll modes
              height !== "auto" &&
                "sticky top-0 z-10 bg-muted/95 backdrop-blur-sm"
            )}
          >
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="px-4 border-r last:border-r-0 border-border whitespace-nowrap"
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {hasData ? (
              rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={
                    onRowClick
                      ? e => {
                          // Don't trigger row click for interactive elements
                          const target = e.target as HTMLElement;
                          if (
                            target.closest('[role="checkbox"]') ||
                            target.closest("button") ||
                            target.closest('[role="menuitem"]') ||
                            target.closest('[role="menu"]') ||
                            target.closest("a")
                          ) {
                            return;
                          }
                          onRowClick(row.original);
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className="px-4 border-r last:border-r-0 border-border"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <DataTableEmpty config={emptyState} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableRoot>
      </div>
    </div>
  );
}
