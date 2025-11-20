"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { format } from "date-fns";
import type { VolunteerWithRelations } from "./volunteers-client";

/**
 * Format category name for display
 * Converts "KIDS_MINISTRY" → "Kids Ministry"
 */
function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Volunteer Status Badge Component
 *
 * Displays a color-coded badge based on volunteer status
 */
function VolunteerStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ACTIVE: "default",
    ON_BREAK: "secondary",
    INACTIVE: "outline",
    PENDING_APPROVAL: "secondary",
  };

  const labels: Record<string, string> = {
    ACTIVE: "Active",
    ON_BREAK: "On Break",
    INACTIVE: "Inactive",
    PENDING_APPROVAL: "Pending",
  };

  return (
    <Badge variant={variants[status] || "outline"}>
      {labels[status] || status}
    </Badge>
  );
}

/**
 * Background Check Badge Component
 *
 * Displays a color-coded badge based on background check status
 */
function BackgroundCheckBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    CLEARED: "default",
    IN_PROGRESS: "secondary",
    NOT_STARTED: "outline",
    FLAGGED: "destructive",
    EXPIRED: "destructive",
  };

  const labels: Record<string, string> = {
    CLEARED: "Cleared",
    IN_PROGRESS: "In Progress",
    NOT_STARTED: "Not Started",
    FLAGGED: "Flagged",
    EXPIRED: "Expired",
  };

  return (
    <Badge variant={variants[status] || "outline"} className="text-xs">
      {labels[status] || status}
    </Badge>
  );
}

/**
 * Volunteer Columns Definition
 *
 * TanStack Table column definitions for volunteer directory
 * Includes sorting, custom rendering, and formatting
 */
export const volunteerColumns: ColumnDef<VolunteerWithRelations>[] = [
  {
    accessorKey: "churchMember.name",
    id: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
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
      const volunteer = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {volunteer.churchMember?.name || "Unknown"}
          </span>
          {volunteer.churchMember?.email && (
            <span className="text-xs text-muted-foreground">
              {volunteer.churchMember.email}
            </span>
          )}
        </div>
      );
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
      return <VolunteerStatusBadge status={row.getValue("status")} />;
    },
  },
  {
    accessorKey: "backgroundCheckStatus",
    header: "Background Check",
    cell: ({ row }) => {
      const status = row.getValue("backgroundCheckStatus") as string;
      return <BackgroundCheckBadge status={status} />;
    },
  },
  {
    id: "categories",
    header: "Ministry Categories",
    cell: ({ row }) => {
      const volunteer = row.original;
      const categories = volunteer.categories || [];

      if (categories.length === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }

      // Show first 2 categories + count of remaining
      const displayCategories = categories.slice(0, 2);
      const remainingCount = categories.length - 2;

      return (
        <div className="flex flex-wrap gap-1">
          {displayCategories.map(cat => (
            <Badge key={cat.id} variant="outline" className="text-xs">
              {formatCategoryLabel(cat.category)}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remainingCount}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "phone",
    accessorFn: row => row.churchMember?.phone,
    header: "Phone",
    cell: ({ row }) => {
      const volunteer = row.original;
      return volunteer.churchMember?.phone ? (
        <span className="text-sm">{volunteer.churchMember.phone}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "startDate",
    accessorKey: "startDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
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
      const date = row.getValue("startDate") as Date;
      return date ? (
        <div className="text-sm text-muted-foreground">
          {format(new Date(date), "MMM d, yyyy")}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "shiftsCount",
    header: "Shifts",
    cell: ({ row }) => {
      const volunteer = row.original;
      const count = volunteer._count?.shifts || 0;
      return (
        <div className="text-sm">
          <span className="font-medium">{count}</span>
          <span className="text-muted-foreground ml-1">
            {count === 1 ? "shift" : "shifts"}
          </span>
        </div>
      );
    },
  },
];
