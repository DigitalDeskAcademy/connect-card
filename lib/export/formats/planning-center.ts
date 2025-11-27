import { ExportFormat, ExportableConnectCard } from "../types";

/**
 * Split a full name into first and last name parts
 * Handles common patterns: "John Smith", "John", "John David Smith"
 */
function splitName(fullName: string | null): {
  firstName: string;
  lastName: string;
} {
  if (!fullName || !fullName.trim()) {
    return { firstName: "", lastName: "" };
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  // First part is first name, rest is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  return { firstName, lastName };
}

/**
 * Format phone number for Planning Center (10-digit format)
 * Planning Center accepts various formats but prefers clean numbers
 */
function formatPhone(phone: string | null): string {
  if (!phone) return "";
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // Return formatted if valid length
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Return original if can't format
  return phone;
}

/**
 * Map visit type to Planning Center membership status
 */
function mapMembershipStatus(visitType: string | null): string {
  if (!visitType) return "Visitor";

  const normalized = visitType.toLowerCase();

  if (normalized.includes("first") || normalized.includes("new")) {
    return "Visitor";
  }
  if (normalized.includes("second") || normalized.includes("return")) {
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
 * Format date for Planning Center (MM/DD/YYYY)
 */
function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Planning Center People import format
 *
 * Column names match Planning Center's expected import headers.
 * See: https://support.planningcenter.com/hc/en-us/articles/360045169434
 *
 * Required columns: First name, Last name
 * Optional columns: Email, Mobile phone, Home address, etc.
 */
export const planningCenterFormat: ExportFormat = {
  id: "planning_center",
  name: "Planning Center",
  description: "Ready for People → Import in Planning Center Online",
  columns: [
    {
      header: "First name",
      getValue: (card: ExportableConnectCard) => splitName(card.name).firstName,
    },
    {
      header: "Last name",
      getValue: (card: ExportableConnectCard) => splitName(card.name).lastName,
    },
    {
      header: "Email",
      getValue: (card: ExportableConnectCard) => card.email || "",
    },
    {
      header: "Mobile phone",
      getValue: (card: ExportableConnectCard) => formatPhone(card.phone),
    },
    {
      header: "Home address",
      getValue: (card: ExportableConnectCard) => card.address || "",
    },
    {
      header: "Membership",
      getValue: (card: ExportableConnectCard) =>
        mapMembershipStatus(card.visitType),
    },
    {
      header: "Campus",
      getValue: (card: ExportableConnectCard) => card.location?.name || "",
    },
    {
      header: "Created at",
      getValue: (card: ExportableConnectCard) => formatDate(card.scannedAt),
    },
  ],
};
