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
 * - Optional icons (GitHub-style)
 * - Optional count badges
 *
 * Usage:
 * <NavTabs
 *   baseUrl="/platform/admin/contacts"
 *   tabs={[
 *     { label: "All", value: "all", icon: Users },
 *     { label: "Smart Lists", value: "smart-lists", count: 5 },
 *   ]}
 * />
 */

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type LucideIcon } from "lucide-react";

export interface NavTab {
  label: string;
  value: string;
  icon?: LucideIcon;
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
    <div className={cn("border-b bg-card -mx-4 md:-mx-6", className)}>
      <nav className="flex gap-4 sm:gap-6 px-4 lg:px-6 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;
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
                "border-b-2 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <span className="px-2 py-1 rounded hover:bg-accent transition-colors flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
                {tab.count !== undefined && (
                  <Badge className="text-xs px-1.5 py-0 min-w-[1.25rem] h-5 justify-center">
                    {tab.count}
                  </Badge>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
