"use client";

import React, { useState, useTransition } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
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
import { Button } from "@/components/ui/button";
import { IconSearch, IconPray, IconX } from "@tabler/icons-react";
import { Loader2, UserPlus, CheckSquare } from "lucide-react";
import { CreatePrayerRequestDialog } from "./create-prayer-request-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBatchAndAssign } from "@/actions/prayer-requests/create-batch-and-assign";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";

interface Location {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string | null;
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
 * Inbox view for unassigned prayer requests with bulk assignment.
 *
 * Features:
 * - Row selection with checkboxes
 * - Bulk assignment: Select prayers → Pick team member → Create batch & assign
 * - Search by request text
 * - Pagination
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
  teamMembers,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true }, // Newest first by default
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
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

  // Calculate selection count
  const selectedCount = Object.keys(rowSelection).filter(
    key => rowSelection[key]
  ).length;

  // Get selected prayer request IDs
  const getSelectedIds = (): string[] => {
    return Object.entries(rowSelection)
      .filter(([, selected]) => selected)
      .map(([index]) => {
        const row = table.getRowModel().rows[parseInt(index)];
        return (row?.original as PrayerRequestListItem)?.id;
      })
      .filter(Boolean) as string[];
  };

  // Handle "Select All" on current page
  const handleSelectAll = () => {
    table.toggleAllPageRowsSelected(true);
  };

  // Clear selection
  const handleClearSelection = () => {
    setRowSelection({});
    setSelectedUserId("");
  };

  // Handle create batch and assign
  const handleCreateBatchAndAssign = () => {
    if (!selectedUserId) {
      toast.error("Please select a team member");
      return;
    }

    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      toast.error("Please select at least one prayer request");
      return;
    }

    startTransition(async () => {
      const result = await createBatchAndAssign(slug, {
        prayerRequestIds: selectedIds,
        assignedToId: selectedUserId,
      });

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        setRowSelection({});
        setSelectedUserId("");
      } else {
        toast.error(result.message);
      }
    });
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

        {/* Bulk Action Bar - Only show when items selected OR has data */}
        {data.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            {selectedCount > 0 ? (
              <>
                {/* Selection Count */}
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span>{selectedCount} selected</span>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Team Member Dropdown */}
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Create Batch & Assign Button */}
                <Button
                  onClick={handleCreateBatchAndAssign}
                  disabled={isPending || !selectedUserId}
                  size="sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Batch & Assign
                    </>
                  )}
                </Button>

                {/* Clear Selection */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="ml-auto"
                >
                  <IconX className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </>
            ) : (
              <>
                {/* Default state - Select All prompt */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Select All on Page
                </Button>
                <span className="text-sm text-muted-foreground">
                  Select prayers to create a batch and assign to a team member
                </span>
              </>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                        <EmptyTitle>No unassigned prayers</EmptyTitle>
                        <EmptyDescription>
                          All prayer requests have been assigned. New prayers
                          will appear here when connect cards are processed.
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
