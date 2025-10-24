/**
 * InfoMessage Component
 *
 * A read-only informational state component for displaying messages
 * without action buttons. Used when content is unavailable but no
 * user action is possible or needed.
 *
 * Use Cases:
 * - Platform courses not yet available
 * - Features coming soon
 * - Read-only states in multi-tenant contexts
 * - Informational placeholders
 *
 * Design Pattern:
 * Follows the Single Responsibility Principle by focusing only on
 * displaying information, unlike EmptyState which includes actions.
 */

import { Info } from "lucide-react";

interface InfoMessageProps {
  title: string;
  description: string;
  icon?: React.ElementType;
}

/**
 * InfoMessage
 *
 * Displays an informational message in empty content areas where
 * no user action is available. Provides visual consistency with
 * EmptyState but without action buttons.
 *
 * @param title - Main message title
 * @param description - Detailed description or context
 * @param icon - Optional custom icon (defaults to Info)
 */
export function InfoMessage({
  title,
  description,
  icon: Icon = Info,
}: InfoMessageProps) {
  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center rounded-md border-dashed border p-8 text-center animate-in fade-in-50">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <Icon className="size-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-center text-sm leading-tight text-muted-foreground max-w-sm">
        {description}
      </p>
    </div>
  );
}
