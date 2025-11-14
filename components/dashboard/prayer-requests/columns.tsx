"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconLock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";
import type { PrayerRequestStatus } from "@/lib/generated/prisma";

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
 * Includes sorting, badges, privacy indicators, and date formatting
 */
export const prayerRequestColumns: ColumnDef<PrayerRequestListItem>[] = [
  {
    accessorKey: "request",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Prayer Request
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
      const request = row.getValue("request") as string;
      const isPrivate = row.original.isPrivate;
      const isUrgent = row.original.isUrgent;

      // Truncate long requests
      const truncated =
        request.length > 80 ? `${request.substring(0, 80)}...` : request;

      return (
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isPrivate && (
                <IconLock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {isUrgent && (
                <IconAlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              )}
              <span className="text-sm">{truncated}</span>
            </div>
          </div>
        </div>
      );
    },
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
    header: "Location",
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
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      );
    },
  },
];
