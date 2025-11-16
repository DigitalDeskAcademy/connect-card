"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDots, IconEdit, IconTrash } from "@tabler/icons-react";
import { format } from "date-fns";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string | null;
  defaultLocationId: string | null;
  locationName: string | null;
  volunteerCategories: string[];
  createdAt: Date;
}

interface ActionsCallbacks {
  onEdit: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  currentUserId: string;
}

const getRoleBadgeColor = (role: string | null) => {
  switch (role) {
    case "platform_admin":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "owner":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "admin":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
    case "member":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const getRoleLabel = (role: string | null) => {
  switch (role) {
    case "platform_admin":
      return "Platform Admin";
    case "owner":
      return "Account Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Staff";
    default:
      return "Staff";
  }
};

export function createTeamMembersColumns(
  callbacks: ActionsCallbacks
): ColumnDef<TeamMember>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const member = row.original;
        const isCurrentUser = member.id === callbacks.currentUserId;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{member.name}</span>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">
                You
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string | null;
        return (
          <Badge className={getRoleBadgeColor(role)}>
            {getRoleLabel(role)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "locationName",
      header: "Location",
      cell: ({ row }) => {
        const locationName = row.getValue("locationName") as string | null;
        return locationName ? (
          <span>{locationName}</span>
        ) : (
          <span className="text-muted-foreground">All locations</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        const isCurrentUser = member.id === callbacks.currentUserId;
        const isPlatformAdmin = member.role === "platform_admin";

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <IconDots className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => callbacks.onEdit(member)}
                  disabled={isPlatformAdmin}
                >
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => callbacks.onRemove(member)}
                  className="text-destructive focus:text-destructive"
                  disabled={isCurrentUser || isPlatformAdmin}
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Remove from Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
