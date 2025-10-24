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
import type { PaymentWithRelations } from "./payments-client";

/**
 * Payment Status Badge Component
 *
 * Displays a color-coded badge based on payment status
 */
function PaymentStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PAID: "default",
    PENDING: "secondary",
    FAILED: "destructive",
    REFUNDED: "outline",
    PARTIALLY_REFUNDED: "outline",
  };

  const labels: Record<string, string> = {
    PAID: "Paid",
    PENDING: "Pending",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    PARTIALLY_REFUNDED: "Partial Refund",
  };

  return (
    <Badge variant={variants[status] || "outline"}>
      {labels[status] || status}
    </Badge>
  );
}

/**
 * Payment Columns Definition
 *
 * TanStack Table column definitions for payment transactions
 * Includes sorting, custom rendering, and formatting
 */
export const paymentColumns: ColumnDef<PaymentWithRelations>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice #
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
      return (
        <div className="font-medium">
          {row.getValue("invoiceNumber") || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "patientName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Patient
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
      const payment = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {payment.patientName || "Unknown"}
          </span>
          {payment.patientEmail && (
            <span className="text-xs text-muted-foreground">
              {payment.patientEmail}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Service",
    cell: ({ row }) => {
      return (
        <div className="max-w-[200px] truncate">
          {row.getValue("description") || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
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
      const amount = row.getValue("amount") as number;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="font-semibold">{formatted}</div>;
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
      return <PaymentStatusBadge status={row.getValue("status")} />;
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment Method",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod") as string;
      return method ? (
        <span className="capitalize">{method}</span>
      ) : (
        <span>—</span>
      );
    },
  },
  {
    id: "date",
    accessorFn: row => row.paidAt || row.createdAt,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
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
      const payment = row.original;
      const date = payment.paidAt || payment.createdAt;
      return date ? (
        <div className="text-sm text-muted-foreground">
          {format(new Date(date), "MMM d, yyyy")}
        </div>
      ) : (
        <span>—</span>
      );
    },
  },
];
