/**
 * Contacts Client Component
 *
 * Enterprise-grade contacts management using the unified DataTable system.
 * Provides full CRUD operations, bulk actions, and filtering.
 */

"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Mail,
  Phone,
  UserPlus,
  Trash2,
  Tag,
  Users,
} from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout/page-container";
import { type DataScope } from "@/app/data/dashboard/require-dashboard-access";
import { type Contact } from "@/lib/data/contacts";
import { MemberType } from "@/lib/generated/prisma";
import { deleteContact } from "@/actions/contacts";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

// ============================================================================
// TYPES
// ============================================================================

interface ContactsClientProps {
  contacts: Contact[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  availableTags: string[];
  availableKeywords: string[];
  organizationId: string;
  slug: string;
  dataScope: DataScope;
  initialSearch?: string;
  initialMemberType?: MemberType;
  initialTag?: string;
  initialKeyword?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getMemberTypeBadgeVariant(
  type: MemberType
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "MEMBER":
      return "default";
    case "VOLUNTEER":
      return "default";
    case "STAFF":
      return "default";
    case "VISITOR":
      return "secondary";
    case "RETURNING":
      return "outline";
    default:
      return "secondary";
  }
}

function getMemberTypeLabel(type: MemberType): string {
  switch (type) {
    case "VISITOR":
      return "Visitor";
    case "RETURNING":
      return "Returning";
    case "MEMBER":
      return "Member";
    case "VOLUNTEER":
      return "Volunteer";
    case "STAFF":
      return "Staff";
    default:
      return type;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContactsClient({
  contacts,
  totalCount,
  availableTags,
  availableKeywords,
  slug,
  dataScope,
  initialMemberType,
  initialKeyword,
}: ContactsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRows, setSelectedRows] = useState<Contact[]>([]);

  // Filters
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>(
    initialMemberType ?? "all"
  );
  const [keywordFilter, setKeywordFilter] = useState<string>(
    initialKeyword ?? "all"
  );

  // Handle filter changes
  const handleMemberTypeChange = (value: string) => {
    setMemberTypeFilter(value);
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete("memberType");
    } else {
      params.set("memberType", value);
    }
    params.set("page", "1"); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  const handleKeywordChange = (value: string) => {
    setKeywordFilter(value);
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete("keyword");
    } else {
      params.set("keyword", value);
    }
    params.set("page", "1"); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  // Handle delete
  const handleDelete = useCallback(
    (contactId: string) => {
      startTransition(async () => {
        const result = await deleteContact(slug, contactId);
        if (result.status === "success") {
          toast.success("Contact deleted");
          router.refresh();
        } else {
          toast.error(result.message);
        }
      });
    },
    [slug, router]
  );

  // Column definitions
  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {getInitials(contact.name)}
              </div>
              <div>
                <div className="font-medium">{contact.name}</div>
                {contact.email && (
                  <div className="text-sm text-muted-foreground">
                    {contact.email}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const phone = row.original.phone;
          if (!phone) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{phone}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "memberType",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.memberType;
          return (
            <Badge variant={getMemberTypeBadgeVariant(type)}>
              {getMemberTypeLabel(type)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const tags = row.original.tags;
          if (!tags.length) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "keywords",
        header: "Keywords",
        cell: ({ row }) => {
          const keywords = row.original.detectedKeywords;
          if (!keywords.length) {
            return <span className="text-muted-foreground">—</span>;
          }
          // Extract just the keyword strings for display
          const keywordStrings = keywords.map(k => k.keyword);
          return (
            <div className="flex flex-wrap gap-1">
              {keywordStrings.slice(0, 2).map(kw => (
                <Badge key={kw} variant="secondary" className="text-xs">
                  {kw}
                </Badge>
              ))}
              {keywordStrings.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{keywordStrings.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Added",
        cell: ({ row }) => {
          const date = row.original.createdAt;
          return (
            <div className="text-sm text-muted-foreground">
              {format(new Date(date), "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        accessorKey: "lastActivityAt",
        header: "Last Activity",
        cell: ({ row }) => {
          const date = row.original.lastActivityAt;
          if (!date) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const contact = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {contact.email && (
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = `mailto:${contact.email}`)
                    }
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                )}
                {contact.phone && (
                  <DropdownMenuItem
                    onClick={() =>
                      (window.location.href = `tel:${contact.phone}`)
                    }
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Tag className="mr-2 h-4 w-4" />
                  Edit Tags
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Change Type
                </DropdownMenuItem>
                {dataScope.filters.canDeleteData && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(contact.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [dataScope.filters.canDeleteData, handleDelete, isPending]
  );

  // Member type filter options
  const memberTypeOptions = [
    { label: "Visitor", value: "VISITOR" },
    { label: "Returning", value: "RETURNING" },
    { label: "Member", value: "MEMBER" },
    { label: "Volunteer", value: "VOLUNTEER" },
    { label: "Staff", value: "STAFF" },
  ];

  // Tag filter options (from actual data)
  const tagOptions = availableTags.map(tag => ({
    label: tag,
    value: tag,
  }));

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} total contact{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk actions when rows selected */}
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.length} selected
                </span>
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tag
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Change Type
                </Button>
                {dataScope.filters.canDeleteData && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            )}

            {/* Member type filter */}
            <Select
              value={memberTypeFilter}
              onValueChange={handleMemberTypeChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {memberTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Keyword filter (only show if keywords exist) */}
            {availableKeywords.length > 0 && (
              <Select value={keywordFilter} onValueChange={handleKeywordChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Keywords" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Keywords</SelectItem>
                  {availableKeywords.map(kw => (
                    <SelectItem key={kw} value={kw}>
                      {kw}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Add contact button */}
            {dataScope.filters.canEditData && (
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            )}
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={contacts}
          variant="full"
          enableSorting
          enableFiltering
          enableRowSelection
          searchColumn="name"
          searchPlaceholder="Search contacts..."
          filters={
            tagOptions.length > 0
              ? [
                  {
                    column: "tags",
                    title: "Tags",
                    options: tagOptions,
                  },
                ]
              : undefined
          }
          onSelectionChange={setSelectedRows}
          emptyState={{
            icon: <Users className="h-12 w-12 text-muted-foreground/50" />,
            title: "No contacts found",
            description:
              "Get started by adding your first contact or importing from a connect card.",
            action: dataScope.filters.canEditData ? (
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </PageContainer>
  );
}
