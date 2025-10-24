/**
 * ContactsPageClient - Client wrapper for contacts table
 *
 * Handles client-side state and interactions for the contacts table.
 * Server component passes data, this handles UI state.
 */

"use client";

import { useState } from "react";
import ContactsTable, {
  type Contact,
} from "@/components/contacts/ContactsTable";

interface ContactsPageClientProps {
  contacts: Contact[];
  totalRecords: number;
}

export function ContactsPageClient({
  contacts,
  totalRecords,
}: ContactsPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Handler functions for ContactsTable
  const handleRefresh = () => {
    // TODO: Refresh contacts from database
    console.log("Refreshing contacts...");
  };

  const handleAddContact = () => {
    // TODO: Open add contact modal
    console.log("Add contact");
  };

  const handleDeleteContacts = (ids: string[]) => {
    // TODO: Delete selected contacts
    console.log("Delete contacts:", ids);
  };

  const handleExportContacts = (ids: string[]) => {
    // TODO: Export contacts to CSV
    console.log("Export contacts:", ids);
  };

  const handleImportContacts = () => {
    // TODO: Open import modal
    console.log("Import contacts");
  };

  const handleSendEmail = (ids: string[]) => {
    // TODO: Open email composer
    console.log("Send email to:", ids);
  };

  const handleSendMessage = (ids: string[]) => {
    // TODO: Open message composer
    console.log("Send message to:", ids);
  };

  const handleAddTag = (ids: string[]) => {
    // TODO: Open tag modal
    console.log("Add tag to:", ids);
  };

  return (
    <ContactsTable
      contacts={contacts}
      totalRecords={totalRecords}
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
      // Platform admin has full permissions
      canEdit={true}
      canDelete={true}
      canExport={true}
      canImport={true}
      canMessage={true}
    />
  );
}
