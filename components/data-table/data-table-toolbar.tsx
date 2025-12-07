"use client";

import { Table } from "@tanstack/react-table";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterConfig } from "./types";
import { ReactNode } from "react";

interface DataTableToolbarProps<TData> {
  /** TanStack Table instance */
  table: Table<TData>;
  /** Column to search */
  searchColumn?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Filter configurations */
  filters?: FilterConfig[];
  /** Show column visibility toggle */
  enableColumnVisibility?: boolean;
  /** Additional content (rendered on right side) */
  children?: ReactNode;
}

/**
 * DataTableToolbar - Search, filters, and column visibility controls.
 *
 * Provides a consistent toolbar layout for data tables with:
 * - Search input (optional)
 * - Filter dropdowns (optional)
 * - Column visibility toggle (optional)
 * - Slot for custom actions (right side)
 *
 * @example
 * <DataTableToolbar
 *   table={table}
 *   searchColumn="name"
 *   searchPlaceholder="Search by name..."
 *   filters={[
 *     { column: 'status', title: 'Status', options: [...] }
 *   ]}
 *   enableColumnVisibility
 * >
 *   <Button>Add New</Button>
 * </DataTableToolbar>
 */
export function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder = "Search...",
  filters = [],
  enableColumnVisibility = false,
  children,
}: DataTableToolbarProps<TData>) {
  // Check if any filters are active
  const isFiltered = table.getState().columnFilters.length > 0;

  // Get search value
  const searchValue = searchColumn
    ? ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? "")
    : "";

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {/* Left side: Search and filters */}
      <div className="flex items-center gap-2 flex-1">
        {/* Search input */}
        {searchColumn && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e =>
                table.getColumn(searchColumn)?.setFilterValue(e.target.value)
              }
              className="pl-9 w-[250px]"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() =>
                  table.getColumn(searchColumn)?.setFilterValue("")
                }
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        )}

        {/* Filter dropdowns */}
        {filters.map(filter => {
          const column = table.getColumn(filter.column);
          if (!column) return null;

          const selectedValue = column.getFilterValue() as string | undefined;

          return (
            <Select
              key={filter.column}
              value={selectedValue ?? "ALL"}
              onValueChange={value =>
                column.setFilterValue(value === "ALL" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={filter.title} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All {filter.title}</SelectItem>
                {filter.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {/* Reset filters button */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right side: Column visibility and custom actions */}
      <div className="flex items-center gap-2">
        {/* Column visibility toggle */}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  column =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map(column => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value => column.toggleVisibility(value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Custom actions slot */}
        {children}
      </div>
    </div>
  );
}
