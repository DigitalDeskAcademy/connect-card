/**
 * Shared ContactsTable Component
 *
 * Displays contacts in a GHL-style table interface with:
 * - Search, filter, and sort capabilities
 * - Bulk actions for managing multiple contacts
 * - Role-based permissions for actions
 * - Responsive design with mobile support
 *
 * Used by both platform admins and agency admins with
 * appropriate data scoping via organizationId.
 */

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPlus,
  IconFilter,
  IconRefresh,
  IconMail,
  IconMessage,
  IconPhone,
  IconTag,
  IconUpload,
  IconDownload,
  IconTrash,
  IconDotsVertical,
  IconSearch,
  IconChevronDown,
  IconColumns,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

// Contact data type
export interface Contact {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  created: string;
  lastActivity: string;
  tags: string[];
  color: string;
}

// Component props
interface ContactsTableProps {
  contacts: Contact[];
  totalRecords?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
  onAddContact?: () => void;
  onDeleteContacts?: (ids: string[]) => void;
  onExportContacts?: (ids: string[]) => void;
  onImportContacts?: () => void;
  onSendEmail?: (ids: string[]) => void;
  onSendMessage?: (ids: string[]) => void;
  onAddTag?: (ids: string[]) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  canImport?: boolean;
  canMessage?: boolean;
  isLoading?: boolean;
}

export default function ContactsTable({
  contacts,
  totalRecords = 0,
  pageSize = 20,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onAddContact,
  onDeleteContacts,
  onExportContacts,
  onImportContacts,
  onSendEmail,
  onSendMessage,
  onAddTag,
  canEdit = true,
  canDelete = true,
  canExport = true,
  canImport = true,
  canMessage = true,
  isLoading = false,
}: ContactsTableProps) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [localPage, setLocalPage] = useState(currentPage);

  const totalPages = Math.ceil((totalRecords || contacts.length) / pageSize);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map(c => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    }
  };

  const handlePageChange = (newPage: number) => {
    const validPage = Math.min(Math.max(1, newPage), totalPages);
    setLocalPage(validPage);
    onPageChange?.(validPage);
  };

  const handleLocalPageInput = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page)) {
      setLocalPage(page);
      if (page >= 1 && page <= totalPages) {
        onPageChange?.(page);
      }
    }
  };

  return (
    <>
      {/* Action Bar */}
      <div className="px-4 lg:px-6 pb-3">
        <div className="flex items-center gap-3">
          {/* Left actions - show basic 3 always, rest on wide screens */}
          <div className="flex items-center gap-2 mr-auto">
            {/* Always visible: Add, Filter, Refresh */}
            {canEdit && (
              <Button size="icon" variant="ghost" onClick={onAddContact}>
                <IconPlus className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost">
              <IconFilter className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onRefresh}>
              <IconRefresh className="h-4 w-4" />
            </Button>

            {/* Three-dot menu for additional actions - shown below 1250px */}
            <div className="min-[1250px]:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canMessage && (
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          selectedContacts.length &&
                          onSendEmail?.(selectedContacts)
                        }
                        disabled={!selectedContacts.length}
                      >
                        <IconMail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          selectedContacts.length &&
                          onSendMessage?.(selectedContacts)
                        }
                        disabled={!selectedContacts.length}
                      >
                        <IconMessage className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                    </>
                  )}
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={() =>
                        selectedContacts.length && onAddTag?.(selectedContacts)
                      }
                      disabled={!selectedContacts.length}
                    >
                      <IconTag className="h-4 w-4 mr-2" />
                      Add Tag
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() =>
                        selectedContacts.length &&
                        onDeleteContacts?.(selectedContacts)
                      }
                      disabled={!selectedContacts.length}
                    >
                      <IconTrash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                  {canImport && (
                    <DropdownMenuItem onClick={onImportContacts}>
                      <IconUpload className="h-4 w-4 mr-2" />
                      Import
                    </DropdownMenuItem>
                  )}
                  {canExport && (
                    <DropdownMenuItem
                      onClick={() =>
                        onExportContacts?.(
                          selectedContacts.length
                            ? selectedContacts
                            : contacts.map(c => c.id)
                        )
                      }
                    >
                      <IconDownload className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Individual action buttons - shown at 1250px+ */}
            <div className="hidden min-[1250px]:flex items-center gap-2">
              <div className="h-4 w-px bg-border" />
              {canMessage && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      selectedContacts.length && onSendEmail?.(selectedContacts)
                    }
                    disabled={!selectedContacts.length}
                  >
                    <IconMail className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      selectedContacts.length &&
                      onSendMessage?.(selectedContacts)
                    }
                    disabled={!selectedContacts.length}
                  >
                    <IconMessage className="h-4 w-4" />
                  </Button>
                </>
              )}
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    selectedContacts.length && onAddTag?.(selectedContacts)
                  }
                  disabled={!selectedContacts.length}
                >
                  <IconTag className="h-4 w-4" />
                </Button>
              )}
              <div className="h-4 w-px bg-border" />
              {canDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    selectedContacts.length &&
                    onDeleteContacts?.(selectedContacts)
                  }
                  disabled={!selectedContacts.length}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              )}
              {canImport && (
                <Button size="icon" variant="ghost" onClick={onImportContacts}>
                  <IconUpload className="h-4 w-4" />
                </Button>
              )}
              {canExport && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onExportContacts?.(
                      selectedContacts.length
                        ? selectedContacts
                        : contacts.map(c => c.id)
                    )
                  }
                >
                  <IconDownload className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Columns dropdown - hidden below 1250px */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 hidden min-[1250px]:flex"
                >
                  <IconColumns className="h-4 w-4 mr-2" />
                  Columns
                  <IconChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Name</DropdownMenuItem>
                <DropdownMenuItem>Phone</DropdownMenuItem>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Created</DropdownMenuItem>
                <DropdownMenuItem>Last Activity</DropdownMenuItem>
                <DropdownMenuItem>Tags</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search - always visible */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Quick search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-32 sm:w-48 lg:w-64 h-10"
              />
            </div>

            {/* More Filters - hidden below 1250px */}
            <Button variant="outline" className="h-10 hidden min-[1250px]:flex">
              <IconFilter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pl-4 pr-0"></TableHead>
            <TableHead className="w-12 pl-2 pr-0">
              <Checkbox
                checked={
                  contacts.length > 0 &&
                  selectedContacts.length === contacts.length
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="pl-3">Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                Loading contacts...
              </TableCell>
            </TableRow>
          ) : contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map(contact => (
              <TableRow key={contact.id}>
                <TableCell className="pl-4 pr-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <IconDotsVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                      )}
                      {canMessage && (
                        <>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem>Add Tag</DropdownMenuItem>
                        </>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete Contact
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="pl-2 pr-0">
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={checked =>
                      handleSelectContact(contact.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="pl-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={contact.color}>
                        <span className="text-white text-sm">
                          {contact.initials}
                        </span>
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{contact.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    {formatPhoneNumber(contact.phone) || contact.phone}
                  </div>
                </TableCell>
                <TableCell>{contact.email || "-"}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{contact.created}</div>
                    <div className="text-xs text-muted-foreground">
                      12:04 PM (PDT)
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    {contact.lastActivity}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          Total {totalRecords || contacts.length} records. {localPage} of{" "}
          {totalPages} Pages
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(localPage - 1)}
            disabled={localPage === 1}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={localPage}
              onChange={e => handleLocalPageInput(e.target.value)}
              className="w-12 text-center"
              min={1}
              max={totalPages}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(localPage + 1)}
            disabled={localPage === totalPages}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2">
            <select
              className="text-sm border rounded px-2 py-1"
              value={pageSize}
              onChange={e => onPageSizeChange?.(parseInt(e.target.value))}
            >
              <option value="20">Page Size: 20</option>
              <option value="50">Page Size: 50</option>
              <option value="100">Page Size: 100</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
