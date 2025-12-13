/**
 * NavTabs - URL-based navigation tabs with responsive overflow menu
 *
 * Generic tab component that uses query parameters for state.
 * Lives in page content (NOT in header).
 *
 * Features:
 * - URL-based navigation with query params
 * - Active state highlighting
 * - GitHub-style overflow menu (tabs that don't fit collapse to "•••" dropdown)
 * - ResizeObserver for container-aware responsiveness
 * - Optional icons and count badges
 * - Accessible keyboard navigation
 *
 * Implementation inspired by GitHub's UnderlineNav:
 * - Container uses overflow-hidden to clip tabs
 * - Overflow button is position-absolute right-0
 * - Uses visibility toggle instead of conditional rendering
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

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

/**
 * Calculate href for a tab
 * First tab uses clean URL (no query param)
 */
function getTabHref(
  tab: NavTab,
  tabs: NavTab[],
  baseUrl: string,
  paramName: string
): string {
  return tab.value === tabs[0].value
    ? baseUrl
    : `${baseUrl}?${paramName}=${tab.value}`;
}

export function NavTabs({
  tabs,
  baseUrl,
  paramName = "tab",
  className,
}: NavTabsProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get(paramName) || tabs[0]?.value || "";

  // Track which tabs are overflowing (hidden by overflow-hidden)
  const [overflowTabs, setOverflowTabs] = useState<NavTab[]>([]);

  // Refs for measurement
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const overflowButtonRef = useRef<HTMLDivElement>(null);

  // Setup ResizeObserver for overflow calculation
  // All state updates happen inside the observer callback (event-driven pattern)
  useEffect(() => {
    const container = containerRef.current;
    const tabsList = tabsListRef.current;
    if (!container || !tabsList) return;

    /**
     * Calculate which tabs are overflowing
     * Uses the container's overflow-hidden to clip, we just need to know which are clipped
     * This function is defined inside useEffect so it captures current refs
     */
    const calculateAndSetOverflow = () => {
      const containerRect = container.getBoundingClientRect();
      const overflowButtonWidth = overflowButtonRef.current?.offsetWidth ?? 48;
      const availableWidth = containerRect.width - overflowButtonWidth - 32; // 32 for padding

      const tabElements = tabsList.querySelectorAll("[data-tab-item]");
      const overflow: NavTab[] = [];

      let accumulatedWidth = 0;
      tabElements.forEach((el, index) => {
        const tabWidth = el.getBoundingClientRect().width;
        const gap = index > 0 ? 16 : 0; // gap between tabs

        if (accumulatedWidth + tabWidth + gap > availableWidth) {
          // This tab overflows
          overflow.push(tabs[index]);
        }
        accumulatedWidth += tabWidth + gap;
      });

      setOverflowTabs(overflow);
    };

    // Create observer with callback that updates state
    const observer = new ResizeObserver(calculateAndSetOverflow);
    observer.observe(container);

    // Cleanup
    return () => observer.disconnect();
  }, [tabs]);

  // Check if active tab is in overflow
  const isActiveInOverflow = overflowTabs.some(tab => tab.value === activeTab);
  const hasOverflow = overflowTabs.length > 0;

  return (
    <div className={cn("border-b bg-card -mx-4 md:-mx-6", className)}>
      {/* Container with overflow-hidden - GitHub pattern */}
      <div ref={containerRef} className="relative overflow-hidden">
        <nav
          ref={tabsListRef}
          className="flex items-center gap-4 px-4 lg:px-6 pr-16"
          aria-label="Page navigation"
        >
          {/* All tabs rendered - overflow-hidden clips them */}
          {tabs.map(tab => {
            const isActive = activeTab === tab.value;
            const isOverflowing = overflowTabs.some(t => t.value === tab.value);
            const Icon = tab.icon;
            const href = getTabHref(tab, tabs, baseUrl, paramName);

            return (
              <div
                key={tab.value}
                data-tab-item={tab.value}
                className={cn(
                  // Hide overflowing tabs visually but keep in DOM for measurement
                  isOverflowing && "invisible"
                )}
              >
                <Link
                  href={href}
                  className={cn(
                    "border-b-2 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground"
                  )}
                  tabIndex={isOverflowing ? -1 : 0}
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
              </div>
            );
          })}
        </nav>

        {/* Overflow button - position-absolute right like GitHub */}
        <div
          ref={overflowButtonRef}
          className={cn(
            "absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 bg-card",
            // Use visibility like GitHub - keeps space reserved
            hasOverflow ? "visible" : "invisible"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  isActiveInOverflow && "border-primary"
                )}
                aria-label={`${overflowTabs.length} more tabs`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-[180px]">
              {overflowTabs.map(tab => {
                const isActive = activeTab === tab.value;
                const Icon = tab.icon;
                const href = getTabHref(tab, tabs, baseUrl, paramName);

                return (
                  <DropdownMenuItem key={tab.value} asChild>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 w-full",
                        isActive && "bg-accent"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="flex-1">{tab.label}</span>
                      {tab.count !== undefined && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0 min-w-[1.25rem] h-5 justify-center"
                        >
                          {tab.count}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
