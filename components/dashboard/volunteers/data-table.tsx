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
import { IconSearch, IconUserPlus } from "@tabler/icons-react";
import { CreateVolunteerDialog } from "./create-volunteer-dialog";
import { useRouter } from "next/navigation";

interface Location {
  id: string;
  name: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  pageSize?: number;
  slug: string;
  organizationId: string;
  locations: Location[];
}

/**
 * Volunteer Data Table Component
 *
 * Features:
 * - Sorting (click column headers)
 * - Search by name
 * - Background check status filtering
 * - Pagination (10 items per page)
 * - Empty state
 * - Row selection for bulk operations
 * - Row click navigation to volunteer detail page
 *
 * Built with TanStack Table v8 and shadcn/ui components
 */
export function VolunteerDataTable<TData, TValue>({
  columns,
  data,
  title,
  pageSize = 10,
  slug,
  organizationId,
  locations,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false }, // Alphabetical by default
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Handle successful volunteer creation
  const handleVolunteerCreated = () => {
    router.refresh(); // Refresh server component data
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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

  // Handle search input change
  const handleSearchChange = (value: string) => {
    table.getColumn("name")?.setFilterValue(value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "ALL") {
      table.getColumn("backgroundCheckStatus")?.setFilterValue(undefined);
    } else {
      table.getColumn("backgroundCheckStatus")?.setFilterValue(value);
    }
  };

  // Calculate pagination details
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPageSize = table.getState().pagination.pageSize;
  const startRow =
    currentPage === 1 ? 1 : (currentPage - 1) * currentPageSize + 1;
  const endRow = Math.min(currentPage * currentPageSize, totalRows);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 space-y-4">
        {/* Title and Create Button */}
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <CreateVolunteerDialog
            slug={slug}
            organizationId={organizationId}
            locations={locations}
            onSuccess={handleVolunteerCreated}
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <InputGroup className="flex-1 min-w-[200px]">
            <InputGroupAddon>
              <IconSearch className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search volunteers..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={e => handleSearchChange(e.target.value)}
            />
          </InputGroup>

          {/* Background Check Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] flex-shrink-0">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="CLEARED">Cleared</SelectItem>
              <SelectItem value="FLAGGED">Flagged</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0">
        {/* Table Container */}
        <div className="rounded-md border flex-1 overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead
                        key={header.id}
                        className={
                          header.id === "select"
                            ? "border-r last:border-r-0 border-border pl-2 !pr-2"
                            : "px-4 border-r last:border-r-0 border-border"
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
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
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={e => {
                      // Don't navigate if clicking checkbox
                      const target = e.target as HTMLElement;
                      if (
                        target.closest('[role="checkbox"]') ||
                        target.closest("button")
                      ) {
                        return;
                      }
                      // Navigate to volunteer detail page
                      const volunteer = row.original as { id: string };
                      router.push(
                        `/church/${slug}/admin/volunteer/${volunteer.id}`
                      );
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "select"
                            ? "border-r last:border-r-0 border-border pl-2 !pr-2"
                            : "px-4 border-r last:border-r-0 border-border"
                        }
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
                          <IconUserPlus className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No volunteers found</EmptyTitle>
                        <EmptyDescription>
                          Add your first volunteer to get started with volunteer
                          management
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
              Showing {startRow} to {endRow} of {totalRows} volunteer
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
