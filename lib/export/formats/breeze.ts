import { ExportFormat, ExportableConnectCard } from "../types";

/**
 * Format phone number for Breeze
 * Breeze accepts most formats, returns clean 10-digit
 */
function formatPhone(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return phone;
}

/**
 * Map visit type to Breeze person status
 */
function mapStatus(visitType: string | null): string {
  if (!visitType) return "Visitor";

  const normalized = visitType.toLowerCase();

  if (normalized.includes("first") || normalized.includes("new")) {
    return "Visitor";
  }
  if (normalized.includes("regular") || normalized.includes("attend")) {
    return "Attendee";
  }
  if (normalized.includes("member")) {
    return "Member";
  }

  return "Visitor";
}

/**
 * Format date for Breeze (YYYY-MM-DD)
 */
function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

/**
 * Format interests array as comma-separated tags
 */
function formatTags(interests: string[]): string {
  if (!interests || interests.length === 0) return "";
  return interests.join(", ");
}

/**
 * Breeze ChMS import format
 *
 * Column names match Breeze's expected import headers.
 * Breeze uses "Name" as a single field (not split first/last).
 *
 * See: https://support.breezechms.com/hc/en-us/articles/360001085494
 */
export const breezeFormat: ExportFormat = {
  id: "breeze",
  name: "Breeze",
  description: "Ready for People → Import People in Breeze ChMS",
  columns: [
    {
      header: "Name",
      getValue: (card: ExportableConnectCard) => card.name || "",
    },
    {
      header: "Email Address",
      getValue: (card: ExportableConnectCard) => card.email || "",
    },
    {
      header: "Mobile Phone",
      getValue: (card: ExportableConnectCard) => formatPhone(card.phone),
    },
    {
      header: "Street Address",
      getValue: (card: ExportableConnectCard) => card.address || "",
    },
    {
      header: "Status",
      getValue: (card: ExportableConnectCard) => mapStatus(card.visitType),
    },
    {
      header: "Campus",
      getValue: (card: ExportableConnectCard) => card.location?.name || "",
    },
    {
      header: "Tags",
      getValue: (card: ExportableConnectCard) => formatTags(card.interests),
    },
    {
      header: "Created On",
      getValue: (card: ExportableConnectCard) => formatDate(card.scannedAt),
    },
  ],
};
