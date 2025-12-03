import { DataExportFormat } from "@/lib/generated/prisma";
import { getExportFormat } from "./formats";
import { ExportableConnectCard } from "./types";

/**
 * Escape a CSV field value
 * - Wrap in quotes if contains comma, quote, or newline
 * - Escape quotes by doubling them
 */
function escapeCSVField(value: string): string {
  if (!value) return "";

  // Check if value needs escaping
  const needsEscape =
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r");

  if (needsEscape) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Generate a single CSV row from column values
 */
function generateRow(values: string[]): string {
  return values.map(escapeCSVField).join(",");
}

/**
 * Generate CSV content from connect cards
 *
 * @param cards - Array of connect cards with location data
 * @param format - Export format determining column structure
 * @returns CSV string content
 */
export function generateCSV(
  cards: ExportableConnectCard[],
  format: DataExportFormat
): string {
  const formatConfig = getExportFormat(format);
  const columns = formatConfig.columns;

  // Generate header row
  const headerRow = generateRow(columns.map(col => col.header));

  // Generate data rows
  const dataRows = cards.map(card => {
    const values = columns.map(col => col.getValue(card));
    return generateRow(values);
  });

  // Combine with newlines
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Generate a filename for the export
 *
 * @param format - Export format
 * @param date - Export date (defaults to now)
 * @returns Filename string
 */
export function generateExportFilename(
  format: DataExportFormat,
  date: Date = new Date()
): string {
  const formatConfig = getExportFormat(format);
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

  // Sanitize format name for filename
  const formatName = formatConfig.id.toLowerCase().replace(/_/g, "-");

  return `connect-cards-${formatName}-${dateStr}.csv`;
}

/**
 * Calculate byte size of CSV content
 */
export function getCSVByteSize(csvContent: string): number {
  return new Blob([csvContent]).size;
}

/**
 * Get column headers for preview UI
 */
export function getFormatHeaders(format: DataExportFormat): string[] {
  const formatConfig = getExportFormat(format);
  return formatConfig.columns.map(col => col.header);
}

/**
 * Get preview data for UI (transform cards to row arrays)
 */
export function getPreviewRows(
  cards: ExportableConnectCard[],
  format: DataExportFormat,
  limit: number = 5
): string[][] {
  const formatConfig = getExportFormat(format);
  const columns = formatConfig.columns;

  return cards.slice(0, limit).map(card => {
    return columns.map(col => col.getValue(card));
  });
}
