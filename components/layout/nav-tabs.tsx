/**
 * NavTabs - URL-based navigation tabs for page content
 *
 * Generic tab component that uses query parameters for state.
 * Lives in page content (NOT in header).
 *
 * Features:
 * - URL-based navigation with query params
 * - Active state highlighting
 * - Responsive horizontal scroll on mobile
 * - Optional count badges
 *
 * Usage:
 * <NavTabs
 *   baseUrl="/platform/admin/contacts"
 *   tabs={[
 *     { label: "All", value: "all" },
 *     { label: "Smart Lists", value: "smart-lists", count: 5 },
 *   ]}
 * />
 */

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface NavTab {
  label: string;
  value: string;
  count?: number;
}

interface NavTabsProps {
  tabs: NavTab[];
  baseUrl: string;
  paramName?: string; // Default: "tab"
  className?: string;
}

export function NavTabs({
  tabs,
  baseUrl,
  paramName = "tab",
  className,
}: NavTabsProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get(paramName) || tabs[0]?.value || "";

  return (
    <div className={cn("border-b bg-background", className)}>
      <nav className="flex gap-6 px-4 lg:px-6 py-3 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          // First tab = no query param (cleaner URLs)
          const href =
            tab.value === tabs[0].value
              ? baseUrl
              : `${baseUrl}?${paramName}=${tab.value}`;

          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "border-b-2 px-1 text-sm font-medium transition-colors hover:text-foreground whitespace-nowrap flex items-center gap-2",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {tab.count}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
