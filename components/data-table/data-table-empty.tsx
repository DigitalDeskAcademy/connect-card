import { Inbox } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { EmptyStateConfig } from "./types";

interface DataTableEmptyProps {
  /** Empty state configuration */
  config?: EmptyStateConfig;
  /** Number of columns (for colspan) */
  colSpan?: number;
}

/**
 * DataTableEmpty - Standardized empty state for data tables.
 *
 * Provides consistent empty state rendering across all tables.
 * Uses the shared Empty component from shadcn/ui.
 *
 * Can be used:
 * 1. Automatically by DataTable when data is empty
 * 2. Standalone within a TableCell for custom table implementations
 *
 * @example
 * // With full config
 * <DataTableEmpty
 *   config={{
 *     icon: <FileSpreadsheet className="h-8 w-8" />,
 *     title: "No exports yet",
 *     description: "Export your data to see it here",
 *     action: <Button>Create Export</Button>
 *   }}
 * />
 *
 * @example
 * // Minimal (uses defaults)
 * <DataTableEmpty config={{ title: "No results" }} />
 */
export function DataTableEmpty({ config, colSpan }: DataTableEmptyProps) {
  // Default empty state if no config provided
  const {
    icon = <Inbox className="h-8 w-8" />,
    title = "No results found",
    description,
    action,
  } = config ?? {};

  const content = (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <div className="mt-4">{action}</div>}
    </Empty>
  );

  // If colSpan provided, wrap in table structure for use inside TableBody
  // Otherwise return the empty content directly
  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="h-64 text-center">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}
