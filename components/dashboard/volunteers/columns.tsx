"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import type { VolunteerWithRelations } from "./volunteers-client";

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
 * Simplified table for volunteer processing workflow
 * Focus on name, contact info, and background check status
 */
export const volunteerColumns: ColumnDef<VolunteerWithRelations>[] = [
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
    accessorKey: "backgroundCheckStatus",
    header: "Background Check",
    cell: ({ row }) => {
      const status = row.getValue("backgroundCheckStatus") as string;
      return <BackgroundCheckBadge status={status} />;
    },
  },
];
