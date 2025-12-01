import { ExportFormat, ExportableConnectCard } from "../types";

/**
 * Format date for generic export (ISO 8601)
 */
function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString();
}

/**
 * Format interests array as comma-separated list
 */
function formatInterests(interests: string[]): string {
  if (!interests || interests.length === 0) return "";
  return interests.join(", ");
}

/**
 * Generic CSV format
 *
 * Includes all available fields with human-readable column names.
 * Compatible with any spreadsheet or database import.
 */
export const genericFormat: ExportFormat = {
  id: "generic",
  name: "Generic CSV",
  description: "All fields with standard column names - works with any system",
  columns: [
    {
      header: "ID",
      getValue: (card: ExportableConnectCard) => card.id,
    },
    {
      header: "Full Name",
      getValue: (card: ExportableConnectCard) => card.name || "",
    },
    {
      header: "Email",
      getValue: (card: ExportableConnectCard) => card.email || "",
    },
    {
      header: "Phone",
      getValue: (card: ExportableConnectCard) => card.phone || "",
    },
    {
      header: "Address",
      getValue: (card: ExportableConnectCard) => card.address || "",
    },
    {
      header: "Visit Type",
      getValue: (card: ExportableConnectCard) => card.visitType || "",
    },
    {
      header: "Interests",
      getValue: (card: ExportableConnectCard) =>
        formatInterests(card.interests),
    },
    {
      header: "Volunteer Category",
      getValue: (card: ExportableConnectCard) => card.volunteerCategory || "",
    },
    {
      header: "Location",
      getValue: (card: ExportableConnectCard) => card.location?.name || "",
    },
    {
      header: "Status",
      getValue: (card: ExportableConnectCard) => card.status,
    },
    {
      header: "Scanned At",
      getValue: (card: ExportableConnectCard) => formatDate(card.scannedAt),
    },
    {
      header: "Created At",
      getValue: (card: ExportableConnectCard) => formatDate(card.createdAt),
    },
  ],
};
