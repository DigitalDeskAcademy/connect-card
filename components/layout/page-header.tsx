"use client";

import { cn } from "@/lib/utils";

/**
 * PageHeader - Minimal page header for @header Named Slot
 *
 * Part of the core layout framework. Renders in the sticky header area.
 *
 * Features:
 * - Page title (required)
 * - Optional subtitle with separator (e.g., "Edit Course › Course Name")
 * - Primary action button (optional, single button only)
 * - Compact mode for detail pages
 * - Minimal height, clean design
 *
 * IMPORTANT: Tabs belong in page content, NOT in this header.
 * Use NavTabs component in your page content instead.
 * See: /components/layout/nav-tabs.tsx
 */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  compact?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  compact = false,
}: PageHeaderProps) {
  return (
    <div className="bg-background">
      {/* Header section with title and actions */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 lg:px-6",
          compact ? "py-2" : "py-4"
        )}
      >
        <div className="flex items-center gap-2">
          <h1
            className={cn(
              "font-semibold tracking-tight",
              compact ? "text-xl" : "text-2xl"
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <>
              <span className="text-muted-foreground">›</span>
              <h2 className="text-lg text-primary font-medium">{subtitle}</h2>
            </>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
