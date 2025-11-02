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
import { IconDots, IconMail, IconCopy, IconX } from "@tabler/icons-react";
import { format } from "date-fns";

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  locationId: string | null;
  locationName: string | null;
  createdAt: Date;
  expiresAt: Date;
  token: string;
}

interface ActionsCallbacks {
  onResend: (invitation: PendingInvitation) => void;
  onCopyLink: (invitation: PendingInvitation) => void;
  onRevoke: (invitation: PendingInvitation) => void;
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
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

const getRoleLabel = (role: string) => {
  switch (role) {
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

export function createPendingInvitationsColumns(
  callbacks: ActionsCallbacks
): ColumnDef<PendingInvitation>[] {
  return [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("email")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
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
      header: "Sent",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => {
        const date = row.getValue("expiresAt") as Date;
        const now = new Date();
        const expiresDate = new Date(date);
        const isExpired = now > expiresDate;

        return (
          <div className="flex items-center gap-2">
            <span className={isExpired ? "text-destructive" : ""}>
              {format(expiresDate, "MMM d, yyyy")}
            </span>
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invitation = row.original;

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
                  onClick={() => callbacks.onResend(invitation)}
                >
                  <IconMail className="mr-2 h-4 w-4" />
                  Resend Invitation
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => callbacks.onCopyLink(invitation)}
                >
                  <IconCopy className="mr-2 h-4 w-4" />
                  Copy Invite Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => callbacks.onRevoke(invitation)}
                  className="text-destructive focus:text-destructive"
                >
                  <IconX className="mr-2 h-4 w-4" />
                  Revoke Invitation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
