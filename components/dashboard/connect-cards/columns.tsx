"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { formatPhoneNumber } from "@/lib/utils";

/**
 * Connect Card Data Type
 *
 * Matches the return type from getRecentConnectCards()
 */
export interface ConnectCardRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  visitType: string | null;
  prayerRequest: string | null;
  interests: string[];
  scannedAt: Date;
  createdAt: Date;
}

/**
 * Visit Type Badge Component
 *
 * Displays color-coded badge for visit status
 */
function VisitTypeBadge({ visitType }: { visitType: string | null }) {
  if (!visitType) {
    return (
      <span className="text-muted-foreground italic text-sm">Unknown</span>
    );
  }

  const isFirstTime = visitType.toLowerCase().includes("first");

  return (
    <Badge variant={isFirstTime ? "default" : "secondary"}>{visitType}</Badge>
  );
}

/**
 * Connect Card Columns Definition
 *
 * TanStack Table column definitions for connect card records
 * Includes sorting, custom rendering, and formatting
 */
export const connectCardColumns: ColumnDef<ConnectCardRow>[] = [
  {
    accessorKey: "name",
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
      const name = row.getValue("name") as string | null;
      return (
        <div className="font-medium">
          {name || (
            <span className="text-muted-foreground italic">No name</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
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
      const email = row.getValue("email") as string | null;
      return (
        <div className="text-sm">
          {email || (
            <span className="text-muted-foreground italic">No email</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Phone
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
      const phone = row.getValue("phone") as string | null;
      const formattedPhone = formatPhoneNumber(phone);
      return (
        <div className="text-sm">
          {formattedPhone || (
            <span className="text-muted-foreground italic">No phone</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "visitType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Visit Type
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
      const visitType = row.getValue("visitType") as string | null;
      return <VisitTypeBadge visitType={visitType} />;
    },
  },
  {
    accessorKey: "prayerRequest",
    header: "Prayer Request",
    cell: ({ row }) => {
      const prayerRequest = row.getValue("prayerRequest") as string | null;
      return prayerRequest ? (
        <div className="max-w-xs truncate text-sm">{prayerRequest}</div>
      ) : (
        <span className="text-muted-foreground italic text-sm">None</span>
      );
    },
  },
  {
    accessorKey: "interests",
    header: "Interests",
    cell: ({ row }) => {
      const interests = row.getValue("interests") as string[];
      return interests.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {interests.slice(0, 2).map((interest, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {interest}
            </Badge>
          ))}
          {interests.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{interests.length - 2}
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground italic text-sm">None</span>
      );
    },
  },
  {
    accessorKey: "scannedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Scanned
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
      const scannedAt = row.getValue("scannedAt") as Date;
      return (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(scannedAt), { addSuffix: true })}
        </div>
      );
    },
  },
];
