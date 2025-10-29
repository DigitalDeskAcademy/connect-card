/**
 * Agency Contacts Client Component
 *
 * Client-side component for agency contacts management.
 * Handles state management and user interactions for the contacts table.
 */

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContactsTable, {
  type Contact,
} from "@/components/contacts/ContactsTable";
import { type DataScope } from "@/app/data/dashboard/require-dashboard-access";
import { PageContainer } from "@/components/layout/page-container";

interface AgencyContactsClientProps {
  contacts: Contact[];
  organizationId: string;
  dataScope: DataScope;
}

export default function AgencyContactsClient({
  contacts,
  organizationId,
  dataScope,
}: AgencyContactsClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Handler functions for ContactsTable with organization scoping
  const handleRefresh = () => {
    // TODO: Refresh contacts from database with organizationId filter
    console.log("Refreshing contacts for org:", organizationId);
  };

  const handleAddContact = () => {
    // TODO: Open add contact modal for this organization
    console.log("Add contact to org:", organizationId);
  };

  const handleDeleteContacts = (ids: string[]) => {
    // TODO: Delete contacts (verify they belong to organizationId)
    console.log("Delete contacts from org:", organizationId, ids);
  };

  const handleExportContacts = (ids: string[]) => {
    // TODO: Export contacts for this organization
    console.log("Export contacts from org:", organizationId, ids);
  };

  const handleImportContacts = () => {
    // TODO: Import contacts to this organization
    console.log("Import contacts to org:", organizationId);
  };

  const handleSendEmail = (ids: string[]) => {
    // TODO: Send email to organization contacts
    console.log("Send email from org:", organizationId, "to:", ids);
  };

  const handleSendMessage = (ids: string[]) => {
    // TODO: Send message via GHL for this organization
    console.log("Send message from org:", organizationId, "to:", ids);
  };

  const handleAddTag = (ids: string[]) => {
    // TODO: Add tags to organization contacts
    console.log("Add tag for org:", organizationId, "to:", ids);
  };

  return (
    <PageContainer>
      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs rtl:space-x-reverse">
          <TabsTrigger
            value="all"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="smart-lists"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            Smart Lists
          </TabsTrigger>
          <TabsTrigger
            value="bulk-actions"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            Bulk Actions
          </TabsTrigger>
          <TabsTrigger
            value="restore"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            Restore
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="companies"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
          >
            Companies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              {/* ContactsTable handles the action bar UI */}
            </CardHeader>
            <CardContent className="p-0">
              <ContactsTable
                contacts={contacts}
                totalRecords={45} // TODO: Get from actual database count
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                onRefresh={handleRefresh}
                onAddContact={handleAddContact}
                onDeleteContacts={handleDeleteContacts}
                onExportContacts={handleExportContacts}
                onImportContacts={handleImportContacts}
                onSendEmail={handleSendEmail}
                onSendMessage={handleSendMessage}
                onAddTag={handleAddTag}
                // Permissions based on data scope
                canEdit={dataScope.filters.canEditData}
                canDelete={dataScope.filters.canDeleteData}
                canExport={dataScope.filters.canExportData}
                canImport={dataScope.filters.canEditData}
                canMessage={dataScope.filters.canEditData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart-lists">
          <Card>
            <CardHeader>
              <CardTitle>Smart Lists</CardTitle>
              <CardDescription>
                Create and manage dynamic contact segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Smart lists feature coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-actions">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Perform actions on multiple contacts at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Select contacts to perform bulk actions...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore">
          <Card>
            <CardHeader>
              <CardTitle>Restore Contacts</CardTitle>
              <CardDescription>
                Recover recently deleted contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No deleted contacts to restore...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Manage tasks related to contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tasks management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Manage company relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Company management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
