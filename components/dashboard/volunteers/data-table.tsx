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
import { Button } from "@/components/ui/button";
import {
  IconSearch,
  IconUserPlus,
  IconUserCheck,
  IconMessageCircle,
  IconDownload,
} from "@tabler/icons-react";
import { CreateVolunteerDialog } from "./create-volunteer-dialog";
import { ProcessVolunteerDialog } from "./process-volunteer-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { VolunteerWithRelations } from "./volunteers-client";
import { volunteerCategoryTypes } from "@/lib/zodSchemas";
import { formatVolunteerCategoryLabel } from "@/lib/types/connect-card";

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
  activeTab: string;
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
  activeTab,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false }, // Alphabetical by default
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [bgCheckFilter, setBgCheckFilter] = useState<string>("ALL");
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] =
    useState<VolunteerWithRelations | null>(null);

  // Handle successful volunteer creation
  const handleVolunteerCreated = () => {
    router.refresh(); // Refresh server component data
  };

  // Handle process volunteer dialog opening
  const handleProcessVolunteer = (volunteer: VolunteerWithRelations) => {
    setSelectedVolunteer(volunteer);
    setProcessDialogOpen(true);
  };

  // Handle processing first selected volunteer (bulk action)
  const handleProcessSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length > 0) {
      const firstSelected = selectedRows[0].original as VolunteerWithRelations;
      handleProcessVolunteer(firstSelected);
    }
  };

  // Handle bulk SMS (placeholder for future implementation)
  const handleBulkSMS = () => {
    const selectedCount = table.getFilteredSelectedRowModel().rows.length;

    if (selectedCount < 2) {
      toast.error("Please select at least 2 volunteers to send bulk SMS.");
      return;
    }

    toast.info(
      `Bulk SMS automation will be implemented in a future update. ${selectedCount} volunteer${selectedCount === 1 ? "" : "s"} selected.`
    );
  };

  // Handle CSV export (PCO/Breeze compatible format)
  const handleExportCSV = () => {
    // Get either selected rows or all filtered rows
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const rowsToExport = selectedRows.length > 0
      ? selectedRows
      : table.getFilteredRowModel().rows;

    if (rowsToExport.length === 0) {
      toast.error("No volunteers to export");
      return;
    }

    // CSV header matching Planning Center / Breeze format
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Background Check Status",
      "Categories",
      "Start Date",
      "Status",
    ];

    // Generate CSV rows
    const csvRows = rowsToExport.map(row => {
      const volunteer = row.original as VolunteerWithRelations;
      const fullName = volunteer.churchMember?.name || "";
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const categories = (volunteer.categories || [])
        .map(cat => formatVolunteerCategoryLabel(cat.category))
        .join("; ");

      const startDate = volunteer.startDate
        ? new Date(volunteer.startDate).toISOString().split("T")[0]
        : "";

      return [
        firstName,
        lastName,
        volunteer.churchMember?.email || "",
        volunteer.churchMember?.phone || "",
        volunteer.backgroundCheckStatus || "NOT_STARTED",
        categories,
        startDate,
        volunteer.status,
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...csvRows.map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `volunteers-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${rowsToExport.length} volunteer${rowsToExport.length === 1 ? "" : "s"} to CSV`);
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
      globalFilter: categoryFilter === "ALL" ? undefined : categoryFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      // Custom filter function for categories (OR logic)
      const volunteer = row.original as VolunteerWithRelations;
      const categories = volunteer.categories || [];

      if (!filterValue || filterValue === "ALL") {
        return true;
      }

      // Check if ANY category matches the filter (OR logic)
      return categories.some(cat => cat.category === filterValue);
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

  // Handle category filter change
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
  };

  // Handle background check filter change
  const handleBgCheckFilterChange = (value: string) => {
    setBgCheckFilter(value);
    table.getColumn("backgroundCheckStatus")?.setFilterValue(value === "ALL" ? undefined : value);
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
        {/* Title and Action Buttons */}
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <IconDownload className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleBulkSMS} variant="outline" className="gap-2">
              <IconMessageCircle className="h-4 w-4" />
              Bulk SMS
            </Button>
            <CreateVolunteerDialog
              slug={slug}
              organizationId={organizationId}
              locations={locations}
              onSuccess={handleVolunteerCreated}
            />
          </div>
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

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={handleCategoryFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] flex-shrink-0">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {volunteerCategoryTypes.map(category => (
                <SelectItem key={category} value={category}>
                  {formatVolunteerCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Background Check Status Filter */}
          <Select
            value={bgCheckFilter}
            onValueChange={handleBgCheckFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] flex-shrink-0">
              <SelectValue placeholder="Background check" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="CLEARED">Cleared</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="FLAGGED">Flagged</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          {/* Process Selected Button (Pending Tab Only) */}
          {activeTab === "pending" &&
            table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button
                onClick={handleProcessSelected}
                variant="default"
                size="sm"
                className="gap-2"
              >
                <IconUserCheck className="h-4 w-4" />
                Process Selected (
                {table.getFilteredSelectedRowModel().rows.length})
              </Button>
            )}
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
            <TableBody className="[&_tr:last-child]:border-b">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={e => {
                      // Don't navigate if clicking interactive elements
                      const target = e.target as HTMLElement;
                      if (
                        target.closest('[role="checkbox"]') ||
                        target.closest("button") ||
                        target.closest('[role="menuitem"]') ||
                        target.closest('[role="menu"]')
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

      {/* Process Volunteer Dialog */}
      {selectedVolunteer && (
        <ProcessVolunteerDialog
          open={processDialogOpen}
          onOpenChange={setProcessDialogOpen}
          volunteer={selectedVolunteer}
          slug={slug}
        />
      )}
    </Card>
  );
}
