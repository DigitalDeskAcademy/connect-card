"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconSearch,
  IconFilter,
  IconFileExport,
  IconInbox,
} from "@tabler/icons-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  searchPlaceholder?: string;
  searchColumn?: string;
  statusFilterColumn?: string;
  statusFilterOptions?: Array<{ value: string; label: string }>;
  pageSize?: number;
  defaultSortColumn?: string;
  defaultSortDesc?: boolean;
}

/**
 * Reusable Data Table Component
 *
 * Features:
 * - Sorting (click column headers)
 * - Column Resizing (drag column edges to resize)
 * - Filtering (search and status filter)
 * - Pagination (10 items per page)
 * - Empty state with shadcn Empty component
 * - Search with shadcn InputGroup component
 * - Pagination with shadcn Pagination component
 *
 * Built with TanStack Table v8 and shadcn/ui components
 * Uses CSS variables for performant 60fps column resizing
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  searchPlaceholder = "Search...",
  searchColumn,
  statusFilterColumn,
  statusFilterOptions,
  pageSize = 10,
  defaultSortColumn = "date",
  defaultSortDesc = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: defaultSortColumn, desc: defaultSortDesc }, // Configurable default sorting
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Initialize table with all features including column resizing
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    columnResizeMode: "onChange", // Real-time column resizing
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  // Generate CSS variables for performant column resizing (60fps)
  const tableState = table.getState();
  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  }, [table, tableState.columnSizingInfo, tableState.columnSizing]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(value);
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (statusFilterColumn) {
      if (value === "ALL") {
        table.getColumn(statusFilterColumn)?.setFilterValue(undefined);
      } else {
        table.getColumn(statusFilterColumn)?.setFilterValue(value);
      }
    }
  };

  // Calculate pagination details
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const currentPageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow =
    currentPage === 1 ? 1 : (currentPage - 1) * currentPageSize + 1;
  const endRow = Math.min(currentPage * currentPageSize, totalRows);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 space-y-4">
        <CardTitle>{title}</CardTitle>

        {/* Action Bar */}
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Icon Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <IconFilter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter payments</p>
              </TooltipContent>
            </Tooltip>

            {/* Export Icon Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <IconFileExport className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export payments</p>
              </TooltipContent>
            </Tooltip>

            {/* Search Input with InputGroup - Only show if searchColumn provided */}
            {searchColumn && (
              <InputGroup className="flex-1 min-w-[200px]">
                <InputGroupAddon>
                  <IconSearch className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={searchPlaceholder}
                  value={
                    (table
                      .getColumn(searchColumn)
                      ?.getFilterValue() as string) ?? ""
                  }
                  onChange={e => handleSearchChange(e.target.value)}
                />
              </InputGroup>
            )}

            {/* Status Filter - Only show if statusFilterOptions provided */}
            {statusFilterOptions && statusFilterColumn && (
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-full sm:w-[150px] flex-shrink-0">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0">
        {/* Table Container */}
        <div className="rounded-md border flex-1 overflow-auto">
          <Table
            style={{ ...columnSizeVars, width: table.getCenterTotalSize() }}
          >
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width: `calc(var(--header-${header?.id}-size) * 1px)`,
                          position: "relative",
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {/* Resize Handle - Wide hitbox (12px) with thin visual line (1px) */}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute -right-1.5 top-0 h-full w-3 cursor-col-resize select-none touch-none z-10 flex items-center justify-center group"
                            style={{
                              userSelect: "none",
                            }}
                          >
                            {/* Visual 1px line */}
                            <div
                              className={`h-full w-px transition-colors ${
                                header.column.getIsResizing()
                                  ? "bg-primary"
                                  : "bg-border group-hover:bg-primary/40"
                              }`}
                            />
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                        }}
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
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <IconInbox className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No payments found</EmptyTitle>
                        <EmptyDescription>
                          Try adjusting your search or filter criteria
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalRows > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing {startRow} to {endRow} of {totalRows} payment
              {totalRows === 1 ? "" : "s"}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        table.previousPage();
                      }}
                      className={
                        !table.getCanPreviousPage()
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis between non-consecutive pages
                      const showEllipsisBefore =
                        index > 0 && page > array[index - 1] + 1;

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={e => {
                                e.preventDefault();
                                table.setPageIndex(page - 1);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </div>
                      );
                    })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        table.nextPage();
                      }}
                      className={
                        !table.getCanNextPage()
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
