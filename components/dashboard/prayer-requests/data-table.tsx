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
import { IconSearch, IconPray } from "@tabler/icons-react";
import { CreatePrayerRequestDialog } from "./create-prayer-request-dialog";
import { useRouter } from "next/navigation";

interface Location {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  pageSize?: number;
  slug: string;
  locations: Location[];
  teamMembers: TeamMember[];
}

/**
 * Prayer Request Data Table Component
 *
 * Simple table for viewing prayer requests.
 * Used in prayer batch detail pages.
 *
 * Features:
 * - Sorting (click column headers)
 * - Search by request text
 * - Status filtering
 * - Pagination (10 items per page)
 * - Empty state
 *
 * Built with TanStack Table v8 and shadcn/ui components
 */
export function PrayerRequestDataTable<TData, TValue>({
  columns,
  data,
  title,
  pageSize = 10,
  slug,
  locations,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true }, // Newest first by default
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Handle successful prayer request creation
  const handlePrayerRequestCreated = () => {
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
    table.getColumn("request")?.setFilterValue(value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "ALL") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(value);
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
          <CreatePrayerRequestDialog
            slug={slug}
            locations={locations}
            onSuccess={handlePrayerRequestCreated}
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
              placeholder="Search prayer requests..."
              value={
                (table.getColumn("request")?.getFilterValue() as string) ?? ""
              }
              onChange={e => handleSearchChange(e.target.value)}
            />
          </InputGroup>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[150px] flex-shrink-0">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="PRAYING">Praying</SelectItem>
              <SelectItem value="ANSWERED">Answered</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
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
                          header.id === "select" || header.id === "flags"
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "select" ||
                          cell.column.id === "flags"
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
                          <IconPray className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No prayer requests found</EmptyTitle>
                        <EmptyDescription>
                          Prayer requests will appear here as they come in from
                          connect cards.
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
              Showing {startRow} to {endRow} of {totalRows} prayer request
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
