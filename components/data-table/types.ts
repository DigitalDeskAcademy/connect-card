import { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";
import { ReactNode } from "react";

/**
 * DataTable variant determines the overall behavior and default settings.
 *
 * - 'full': Complete table with all features (pagination, sorting, filtering)
 * - 'preview': Limited rows, no pagination, fixed height (for export previews)
 * - 'compact': Minimal features, auto height (for simple lists)
 */
export type DataTableVariant = "full" | "preview" | "compact";

/**
 * Height strategy for the table container.
 *
 * - 'auto': Natural height based on content (may need pagination for long lists)
 * - 'flex': Fill available space in flex container (parent must be flex)
 * - 'fixed': Explicit max-height with scroll
 */
export type DataTableHeightMode = "auto" | "flex" | "fixed";

/**
 * Pagination display format.
 *
 * - 'range': "Showing 1-25 of 150 results" (standard for admin tables)
 * - 'page': "Page 1 of 6" (compact)
 * - 'simple': "1 of 6" (minimal)
 */
export type PaginationFormat = "range" | "page" | "simple";

/**
 * Pagination configuration options.
 */
export interface PaginationConfig {
  /** Show page size selector dropdown */
  showPageSize?: boolean;
  /** Show individual page number buttons */
  showPageNumbers?: boolean;
  /** Show first/last page buttons */
  showFirstLast?: boolean;
  /** Display format for pagination info */
  format?: PaginationFormat;
}

/**
 * Filter configuration for faceted filtering.
 */
export interface FilterConfig {
  /** Column accessor key to filter */
  column: string;
  /** Display title for the filter */
  title: string;
  /** Available filter options */
  options: Array<{ label: string; value: string }>;
  /** Allow multiple selections */
  multiSelect?: boolean;
}

/**
 * Empty state configuration.
 */
export interface EmptyStateConfig {
  /** Icon to display (typically from Lucide) */
  icon?: ReactNode;
  /** Main title text */
  title: string;
  /** Supporting description text */
  description?: string;
  /** Optional action button/element */
  action?: ReactNode;
}

/**
 * Main DataTable component props.
 */
export interface DataTableProps<TData, TValue> {
  // ═══════════════════════════════════════════════════════════════
  // REQUIRED
  // ═══════════════════════════════════════════════════════════════

  /** Column definitions (TanStack Table format) */
  columns: ColumnDef<TData, TValue>[];

  /** Data array to display */
  data: TData[];

  // ═══════════════════════════════════════════════════════════════
  // VARIANT & DISPLAY
  // ═══════════════════════════════════════════════════════════════

  /** Table variant - determines default behaviors */
  variant?: DataTableVariant;

  /** Optional title displayed above table */
  title?: string;

  /** Optional description below title */
  description?: string;

  /** Element to render in header (e.g., "Add New" button) */
  headerAction?: ReactNode;

  /** Wrap table in Card component */
  wrapInCard?: boolean;

  // ═══════════════════════════════════════════════════════════════
  // HEIGHT & SCROLLING
  // ═══════════════════════════════════════════════════════════════

  /** Height strategy */
  height?: DataTableHeightMode;

  /** Max height when using 'fixed' mode (e.g., '400px', '60vh') */
  maxHeight?: string;

  // ═══════════════════════════════════════════════════════════════
  // PAGINATION
  // ═══════════════════════════════════════════════════════════════

  /** Enable pagination (true, false, or config object) */
  pagination?: boolean | PaginationConfig;

  /** Rows per page (default: 25) */
  pageSize?: number;

  /** Available page size options */
  pageSizeOptions?: number[];

  // ═══════════════════════════════════════════════════════════════
  // FEATURES (opt-in)
  // ═══════════════════════════════════════════════════════════════

  /** Enable column sorting */
  enableSorting?: boolean;

  /** Enable column filtering */
  enableFiltering?: boolean;

  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;

  /** Enable row selection checkboxes */
  enableRowSelection?: boolean;

  /** Enable column resizing */
  enableColumnResizing?: boolean;

  // ═══════════════════════════════════════════════════════════════
  // SEARCH & FILTERS
  // ═══════════════════════════════════════════════════════════════

  /** Column to search (enables search input) */
  searchColumn?: string;

  /** Placeholder text for search input */
  searchPlaceholder?: string;

  /** Filter configurations for toolbar */
  filters?: FilterConfig[];

  // ═══════════════════════════════════════════════════════════════
  // PREVIEW MODE
  // ═══════════════════════════════════════════════════════════════

  /** Enable preview mode (limits rows, disables pagination) */
  previewMode?: boolean;

  /** Max rows to show in preview mode (default: 10) */
  previewLimit?: number;

  // ═══════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ═══════════════════════════════════════════════════════════════

  /** Empty state configuration */
  emptyState?: EmptyStateConfig;

  // ═══════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════

  /** Called when a row is clicked */
  onRowClick?: (row: TData) => void;

  /** Called when row selection changes */
  onSelectionChange?: (rows: TData[]) => void;

  // ═══════════════════════════════════════════════════════════════
  // STYLING
  // ═══════════════════════════════════════════════════════════════

  /** Additional class names for the container */
  className?: string;
}

/**
 * Context value for DataTable internals.
 * Passed to child components via React Context.
 */
export interface DataTableContextValue<TData> {
  /** TanStack Table instance */
  table: TanStackTable<TData>;

  /** Current variant */
  variant: DataTableVariant;

  /** Whether in preview mode */
  isPreview: boolean;

  /** Total data count (before pagination) */
  totalCount: number;

  /** Current page size */
  pageSize: number;

  /** Empty state config */
  emptyState?: EmptyStateConfig;
}

/**
 * Props for DataTablePagination component.
 */
export interface DataTablePaginationProps {
  /** Pagination config */
  config?: PaginationConfig;

  /** Page size options */
  pageSizeOptions?: number[];

  /** Entity name for display (e.g., "records", "payments") */
  entityName?: string;
}

/**
 * Props for DataTableToolbar component.
 */
export interface DataTableToolbarProps {
  /** Search column accessor */
  searchColumn?: string;

  /** Search placeholder */
  searchPlaceholder?: string;

  /** Filter configurations */
  filters?: FilterConfig[];

  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;

  /** Additional toolbar content (right side) */
  children?: ReactNode;
}

/**
 * Props for DataTableContent component.
 */
export interface DataTableContentProps {
  /** Height mode */
  height?: DataTableHeightMode;

  /** Max height for fixed mode */
  maxHeight?: string;
}
