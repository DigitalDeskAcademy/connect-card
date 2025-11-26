"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconLock,
  IconAlertTriangle,
  IconChevronDown,
} from "@tabler/icons-react";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";
import type { PrayerRequestStatus } from "@/lib/generated/prisma";

/**
 * Format time ago in simplified format
 * Examples: "< 1 min", "5 min", "2 hrs", "3 days", "> 1 week", "> 1 month"
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "< 1 min";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} hrs`;
  if (diffDays < 7) return `${diffDays} days`;
  if (diffWeeks < 4) return `> 1 week`;
  return `> 1 month`;
}

/**
 * Prayer Request Status Badge Component
 *
 * Displays a color-coded badge based on prayer request status
 */
function StatusBadge({ status }: { status: PrayerRequestStatus }) {
  const variants: Record<
    PrayerRequestStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PENDING: "secondary",
    ASSIGNED: "default",
    PRAYING: "default",
    ANSWERED: "outline",
    ARCHIVED: "outline",
  };

  const labels: Record<PrayerRequestStatus, string> = {
    PENDING: "Pending",
    ASSIGNED: "Assigned",
    PRAYING: "Praying",
    ANSWERED: "Answered",
    ARCHIVED: "Archived",
  };

  return (
    <Badge variant={variants[status]} className="whitespace-nowrap">
      {labels[status]}
    </Badge>
  );
}

/**
 * Prayer Category Badge Component
 *
 * Displays a subtle badge for prayer category
 */
function CategoryBadge({ category }: { category: string | null }) {
  if (!category)
    return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <Badge variant="outline" className="whitespace-nowrap">
      {category}
    </Badge>
  );
}

/**
 * Prayer Request Columns Definition
 *
 * TanStack Table column definitions for prayer requests
 * Includes bulk selection, sortable flags, badges, and date formatting
 */
export const prayerRequestColumns: ColumnDef<PrayerRequestListItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "flags",
    accessorFn: row => {
      // Create a filterable value array for multi-select
      const flags = [];
      if (row.isUrgent) flags.push("urgent");
      if (row.isPrivate) flags.push("private");
      if (flags.length === 0) flags.push("none");
      return flags;
    },
    filterFn: (row, columnId, filterValue: string[] | undefined) => {
      if (!filterValue || filterValue.length === 0) return true;

      const rowFlags = row.getValue(columnId) as string[];
      return filterValue.some(f => rowFlags.includes(f));
    },
    header: ({ column }) => {
      const filterValue =
        (column.getFilterValue() as string[] | undefined) || [];

      const toggleFilter = (value: string) => {
        const newValue = filterValue.includes(value)
          ? filterValue.filter(v => v !== value)
          : [...filterValue, value];
        column.setFilterValue(newValue.length > 0 ? newValue : undefined);
      };

      return (
        <div className="flex items-center justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <IconChevronDown
                  className={`h-4 w-4 ${filterValue.length > 0 ? "text-primary" : ""}`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                <div
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent"
                  onClick={() => toggleFilter("urgent")}
                >
                  <Checkbox
                    checked={filterValue.includes("urgent")}
                    onCheckedChange={() => toggleFilter("urgent")}
                  />
                  <IconAlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Urgent</span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent"
                  onClick={() => toggleFilter("private")}
                >
                  <Checkbox
                    checked={filterValue.includes("private")}
                    onCheckedChange={() => toggleFilter("private")}
                  />
                  <IconLock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Private</span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent"
                  onClick={() => toggleFilter("none")}
                >
                  <Checkbox
                    checked={filterValue.includes("none")}
                    onCheckedChange={() => toggleFilter("none")}
                  />
                  <div className="h-4 w-4 flex items-center justify-center text-muted-foreground text-xs">
                    —
                  </div>
                  <span className="text-sm">No Flags</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    cell: ({ row }) => {
      const isPrivate = row.original.isPrivate;
      const isUrgent = row.original.isUrgent;

      return (
        <div className="flex items-center justify-center gap-1">
          {isUrgent && (
            <IconAlertTriangle
              className="h-4 w-4 text-orange-500"
              title="Urgent"
            />
          )}
          {isPrivate && (
            <IconLock
              className="h-4 w-4 text-muted-foreground"
              title="Private"
            />
          )}
          {!isUrgent && !isPrivate && (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
  },
  {
    accessorKey: "request",
    header: "Prayer Request",
    cell: ({ row }) => {
      const request = row.getValue("request") as string;

      // Truncate long requests
      const truncated =
        request.length > 80 ? `${request.substring(0, 80)}...` : request;

      return <div className="text-sm">{truncated}</div>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <CategoryBadge category={row.getValue("category")} />;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <StatusBadge status={row.getValue("status")} />;
    },
  },
  {
    accessorKey: "submittedBy",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Submitted By
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const submittedBy = row.getValue("submittedBy") as string | null;
      return (
        <div className="text-sm">
          {submittedBy || <span className="text-muted-foreground">—</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "assignedToName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned To
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const assignedTo = row.getValue("assignedToName") as string | null;
      return (
        <div className="text-sm">
          {assignedTo || <span className="text-muted-foreground">—</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "locationName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Location
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const location = row.getValue("locationName") as string | null;
      return (
        <div className="text-sm">
          {location || <span className="text-muted-foreground">—</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {formatTimeAgo(date)}
        </div>
      );
    },
  },
];
