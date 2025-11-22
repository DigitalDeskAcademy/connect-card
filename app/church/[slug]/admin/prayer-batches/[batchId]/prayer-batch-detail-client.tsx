"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  MapPin,
  Calendar,
  FileText,
  User,
  Loader2,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  assignSelectedPrayers,
  assignAllPrayers,
} from "@/actions/prayer/prayer-batch-actions";
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
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";

interface PrayerBatch {
  id: string;
  name: string;
  batchDate: Date;
  status: string;
  prayerCount: number;
  organizationId: string;
  locationId: string | null;
  location: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  prayerRequests: Array<{
    id: string;
    request: string;
    category: string | null;
    status: string;
    isPrivate: boolean;
    isUrgent: boolean;
    submittedBy: string | null;
    assignedToId: string | null;
    location: {
      id: string;
      name: string;
    } | null;
    assignedTo: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    createdAt: Date;
    followUpDate: Date | null;
    answeredDate: Date | null;
  }>;
  createdAt: Date;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

interface PrayerBatchDetailClientProps {
  batch: PrayerBatch;
  slug: string;
  teamMembers: TeamMember[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary">Pending Assignment</Badge>;
    case "IN_REVIEW":
      return <Badge variant="default">Assigned</Badge>;
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Completed
        </Badge>
      );
    case "ARCHIVED":
      return <Badge variant="outline">Archived</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function PrayerBatchDetailClient({
  batch,
  slug,
  teamMembers,
}: PrayerBatchDetailClientProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Define table columns with checkbox selection
  const columns: ColumnDef<(typeof batch.prayerRequests)[0]>[] = [
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
      cell: ({ row }) => {
        const isPrivate = row.original.isPrivate;
        const isUrgent = row.original.isUrgent;

        return (
          <div className="flex items-center justify-center">
            {isUrgent ? (
              <IconAlertTriangle
                className="h-4 w-4 text-orange-500"
                title={isPrivate ? "Urgent & Private" : "Urgent"}
              />
            ) : isPrivate ? (
              <IconLock
                className="h-4 w-4 text-muted-foreground"
                title="Private"
              />
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "request",
      header: "Prayer Request",
      cell: ({ row }) => {
        const request = row.getValue("request") as string;
        const truncated =
          request.length > 80 ? `${request.substring(0, 80)}...` : request;
        return <div className="text-sm">{truncated}</div>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string | null;
        if (!category)
          return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            {category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "submittedBy",
      header: "Submitted By",
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
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const location = row.original.location;
        return (
          <div className="text-sm">
            {location?.name || <span className="text-muted-foreground">—</span>}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: batch.prayerRequests,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleAssignSelected = () => {
    if (!selectedUserId) {
      toast.error("Please select a team member");
      return;
    }

    if (selectedCount === 0) {
      toast.error("Please select at least one prayer request");
      return;
    }

    startTransition(async () => {
      const prayerRequestIds = selectedRows.map(row => row.original.id);

      const result = await assignSelectedPrayers(slug, {
        prayerRequestIds,
        assignedToId: selectedUserId,
        batchId: batch.id,
      });

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        setRowSelection({});
        setSelectedUserId("");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleAssignAll = () => {
    if (!selectedUserId) {
      toast.error("Please select a team member");
      return;
    }

    startTransition(async () => {
      const result = await assignAllPrayers(slug, {
        batchId: batch.id,
        assignedToId: selectedUserId,
      });

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        setSelectedUserId("");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/church/${slug}/admin/prayer-batches`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-6 w-6 text-muted-foreground" />
              {batch.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(batch.batchDate), "MMM d, yyyy")}
              </div>
              {batch.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {batch.location.name}
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {batch.prayerRequests.length}{" "}
                {batch.prayerRequests.length === 1 ? "prayer" : "prayers"}
              </div>
              {batch.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {batch.assignedTo.name || batch.assignedTo.email}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(batch.status)}
          </div>
        </div>
      </div>

      {/* Assignment Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Bulk Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                onClick={handleAssignSelected}
                disabled={isPending || !selectedUserId || selectedCount === 0}
                variant="default"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    Assign Selected ({selectedCount})
                  </>
                )}
              </Button>

              <Button
                onClick={handleAssignAll}
                disabled={isPending || !selectedUserId}
                variant="outline"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    Assign All ({batch.prayerRequests.length})
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedCount} of {batch.prayerRequests.length} prayers selected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prayer Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prayer Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <TableHead
                          key={header.id}
                          className={
                            header.id === "select" || header.id === "flags"
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
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          className={
                            cell.column.id === "select" ||
                            cell.column.id === "flags"
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
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No prayer requests in this batch.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {batch.prayerRequests.length > table.getState().pagination.pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}{" "}
                to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  batch.prayerRequests.length
                )}{" "}
                of {batch.prayerRequests.length} prayers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
