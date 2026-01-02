"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconCalendar,
  IconDotsVertical,
} from "@tabler/icons-react";

// =============================================================================
// Types
// =============================================================================

export type ViewMode = "card" | "list" | "calendar";

interface ToolbarProps {
  /** Search input value */
  searchValue?: string;
  /** Search input change handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Currently active view mode */
  activeView?: ViewMode;
  /** View mode change handler */
  onViewChange?: (view: ViewMode) => void;
  /** Show view toggle buttons */
  showViewToggle?: boolean;
  /** Additional filter components (dropdowns, etc.) */
  filters?: ReactNode;
  /** Action buttons on the left (create, etc.) */
  actions?: ReactNode;
  /** Action buttons on the right */
  rightActions?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// View Toggle Button
// =============================================================================

interface ViewToggleButtonProps {
  view: ViewMode;
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  icon: React.ElementType;
  label: string;
}

function ViewToggleButton({
  view,
  activeView,
  onViewChange,
  icon: Icon,
  label,
}: ViewToggleButtonProps) {
  const isActive = activeView === view;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
            isActive
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onViewChange(view)}
          aria-label={label}
          aria-pressed={isActive}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// =============================================================================
// Toolbar Component
// =============================================================================

/**
 * Toolbar Component
 *
 * A reusable toolbar with search, filters, actions, and view toggles.
 * Designed for consistent use across list/grid pages.
 *
 * Features:
 * - Search input with icon
 * - Flexible filter slot for dropdowns
 * - Action slot for buttons (create, etc.)
 * - View toggle (card/list/calendar)
 * - Tooltips on icon buttons
 * - Responsive overflow menu (3 dots) on smaller screens
 */
export function Toolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  activeView = "card",
  onViewChange,
  showViewToggle = true,
  filters,
  actions,
  rightActions,
  className,
}: ToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  // Use ResizeObserver to detect when toolbar needs to collapse
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Collapse at 640px (sm breakpoint)
        setIsCompact(entry.contentRect.width < 640);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={containerRef}
        className={cn(
          "flex flex-wrap items-center gap-3 py-3 px-4",
          "bg-card/80 backdrop-blur-sm rounded-xl border-2 shadow-sm",
          className
        )}
      >
        {/* Left Actions (Create, etc.) - Always visible */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Search Input - Fills available space */}
        <div className="relative flex-1 min-w-[140px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={e => onSearchChange?.(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>

        {/* Filters Slot - Hidden when compact */}
        {filters && !isCompact && (
          <div className="flex items-center gap-2">{filters}</div>
        )}

        {/* Right Actions Slot - Hidden when compact */}
        {rightActions && !isCompact && (
          <div className="flex items-center gap-2">{rightActions}</div>
        )}

        {/* View Toggle - Hidden when compact */}
        {showViewToggle && onViewChange && !isCompact && (
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
            <ViewToggleButton
              view="card"
              activeView={activeView}
              onViewChange={onViewChange}
              icon={IconLayoutGrid}
              label="Card View"
            />
            <ViewToggleButton
              view="list"
              activeView={activeView}
              onViewChange={onViewChange}
              icon={IconList}
              label="List View"
            />
            <ViewToggleButton
              view="calendar"
              activeView={activeView}
              onViewChange={onViewChange}
              icon={IconCalendar}
              label="Calendar View"
            />
          </div>
        )}

        {/* Overflow Menu - Visible when compact */}
        {isCompact &&
          (filters || rightActions || (showViewToggle && onViewChange)) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                {/* View Toggle in dropdown */}
                {showViewToggle && onViewChange && (
                  <>
                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      View
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={activeView}
                      onValueChange={value => onViewChange(value as ViewMode)}
                    >
                      <DropdownMenuRadioItem value="card" className="gap-2">
                        <IconLayoutGrid className="h-4 w-4" />
                        Card View
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="list" className="gap-2">
                        <IconList className="h-4 w-4" />
                        List View
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="calendar" className="gap-2">
                        <IconCalendar className="h-4 w-4" />
                        Calendar View
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    {(filters || rightActions) && <DropdownMenuSeparator />}
                  </>
                )}

                {/* Filters in dropdown */}
                {filters && (
                  <>
                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Filters
                    </DropdownMenuLabel>
                    <div className="px-2 py-2 space-y-2 bg-muted/30 rounded-md mx-1 mb-1">
                      {filters}
                    </div>
                    {rightActions && <DropdownMenuSeparator />}
                  </>
                )}

                {/* Right Actions in dropdown */}
                {rightActions && (
                  <>
                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Actions
                    </DropdownMenuLabel>
                    <div className="px-2 py-2 space-y-2 bg-muted/30 rounded-md mx-1 mb-1">
                      {rightActions}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </div>
    </TooltipProvider>
  );
}

// =============================================================================
// Toolbar Action Button (Icon with Tooltip)
// =============================================================================

interface ToolbarActionProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

/**
 * Toolbar action button with icon and tooltip
 */
export function ToolbarAction({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  className,
}: ToolbarActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={cn("h-9 w-9", className)}
          onClick={onClick}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// =============================================================================
// Toolbar Filter (Select wrapper with icon)
// =============================================================================

interface ToolbarFilterProps {
  label: string;
  children: ReactNode;
}

/**
 * Wrapper for filter dropdowns in toolbar
 */
export function ToolbarFilter({ label, children }: ToolbarFilterProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex">{children}</div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
