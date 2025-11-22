"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconDots,
  IconEye,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { VolunteerWithRelations } from "./volunteers-client";

/**
 * Actions Column Component
 *
 * Renders dropdown menu with View Profile and Delete actions
 */
interface ActionsCell {
  volunteer: VolunteerWithRelations;
  slug: string;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

function ActionsCell({ volunteer, slug, canDelete, onDelete }: ActionsCell) {
  const router = useRouter();

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <IconDots className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/church/${slug}/admin/volunteer/${volunteer.id}`)}
          className="gap-2"
        >
          <IconEye className="h-4 w-4" />
          View Profile
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(volunteer.id)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <IconTrash className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}

/**
 * Volunteer Columns Definition
 *
 * Simplified table for volunteer processing workflow
 * Focus on name, contact info, and background check status
 */
interface GetVolunteerColumnsProps {
  slug: string;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export function getVolunteerColumns({
  slug,
  canDelete,
  onDelete,
}: GetVolunteerColumnsProps): ColumnDef<VolunteerWithRelations>[] {
  return [
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
    id: "categories",
    header: "Categories",
    cell: ({ row }) => {
      const volunteer = row.original;
      const categories = volunteer.categories || [];

      if (categories.length === 0) {
        return <span className="text-muted-foreground text-xs">None</span>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {categories.map(cat => (
            <Badge key={cat.id} variant="secondary" className="text-xs">
              {cat.category
                .split("_")
                .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                .join(" ")}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell
        volunteer={row.original}
        slug={slug}
        canDelete={canDelete}
        onDelete={onDelete}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
}
