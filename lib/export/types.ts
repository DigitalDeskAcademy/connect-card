import { ConnectCard, Location } from "@/lib/generated/prisma";

/**
 * Connect card data with resolved location for export
 */
export type ExportableConnectCard = ConnectCard & {
  location: Pick<Location, "name"> | null;
};

/**
 * Column definition for CSV export
 */
export interface ExportColumn {
  /** Header name in the CSV */
  header: string;
  /** Function to extract value from connect card */
  getValue: (card: ExportableConnectCard) => string;
}

/**
 * Export format configuration
 */
export interface ExportFormat {
  /** Format identifier */
  id: string;
  /** Display name for UI */
  name: string;
  /** Description of what this format is for */
  description: string;
  /** Column definitions in order */
  columns: ExportColumn[];
}

/**
 * Export filter options
 */
export interface ExportFilters {
  /** Filter by location */
  locationId?: string;
  /** Start date for date range filter */
  dateFrom?: Date;
  /** End date for date range filter */
  dateTo?: Date;
  /** Only include records not yet exported */
  onlyNew?: boolean;
  /** Filter by card status */
  status?: string[];
  /** Selected field headers to include (if undefined, include all) */
  selectedFields?: string[];
}

/**
 * Export preview result
 */
export interface ExportPreview {
  /** Total records matching filters (before deduplication) */
  totalCount: number;
  /** Unique records after email deduplication */
  uniqueCount: number;
  /** Number of duplicate records skipped */
  duplicatesSkipped: number;
  /** Sample of first N records */
  sampleRecords: ExportableConnectCard[];
  /** Validation warnings */
  warnings: ExportWarning[];
}

/**
 * Export info message (e.g., deduplication results)
 */
export interface ExportWarning {
  type: "duplicates_skipped";
  count: number;
  message: string;
}
