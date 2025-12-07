/**
 * Unified DataTable System
 *
 * A composable, configurable data table built on TanStack Table.
 * Provides consistent UX across all tables in the application.
 *
 * @example
 * // Full featured table
 * import { DataTable } from "@/components/data-table";
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   variant="full"
 *   enableSorting
 *   searchColumn="name"
 * />
 *
 * @example
 * // Preview table
 * import { DataTable } from "@/components/data-table";
 *
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   variant="preview"
 *   previewLimit={10}
 * />
 */

// Main component
export { DataTable } from "./data-table";

// Preview table (for export previews, confirmations)
export { PreviewTable } from "./preview-table";

// Sub-components (for advanced composition)
export { DataTableContent } from "./data-table-content";
export { DataTableToolbar } from "./data-table-toolbar";
export { DataTablePagination } from "./data-table-pagination";
export { DataTableEmpty } from "./data-table-empty";

// Types
export type {
  DataTableProps,
  DataTableVariant,
  DataTableHeightMode,
  PaginationFormat,
  PaginationConfig,
  FilterConfig,
  EmptyStateConfig,
  DataTableContextValue,
  DataTablePaginationProps,
  DataTableToolbarProps,
  DataTableContentProps,
} from "./types";
