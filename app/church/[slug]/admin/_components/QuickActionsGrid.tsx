"use client";

import Link from "next/link";
import {
  IconUpload,
  IconUserPlus,
  IconPray,
  IconHeart,
  IconRefresh,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: Icon;
  color: string;
}

interface QuickActionsGridProps {
  slug: string;
  /** User's default location slug for pre-filtering. Null if user can see all locations. */
  defaultLocationSlug: string | null;
}

export function QuickActionsGrid({
  slug,
  defaultLocationSlug,
}: QuickActionsGridProps) {
  // Build location query param if user has a default location
  const locationParam = defaultLocationSlug
    ? `?location=${defaultLocationSlug}`
    : "";

  const actions: QuickAction[] = [
    {
      label: "Upload Cards",
      description: "Scan connect cards",
      href: `/church/${slug}/admin/connect-cards${locationParam}`,
      icon: IconUpload,
      color: "text-blue-500",
    },
    {
      label: "Invite Staff",
      description: "Add team members",
      href: `/church/${slug}/admin/team`,
      icon: IconUserPlus,
      color: "text-purple-500",
    },
    {
      label: "Assign Prayers",
      description: "Route to prayer team",
      href: `/church/${slug}/admin/prayer${locationParam}`,
      icon: IconPray,
      color: "text-amber-500",
    },
    {
      label: "Find Volunteers",
      description: "Match to ministries",
      href: `/church/${slug}/admin/volunteer${locationParam}`,
      icon: IconHeart,
      color: "text-red-500",
    },
    {
      label: "Export Data",
      description: "Sync to ChMS",
      href: `/church/${slug}/admin/integrations`,
      icon: IconRefresh,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {actions.map(action => (
        <Link key={action.label} href={action.href}>
          <div className="aspect-square flex flex-col items-center justify-center p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group">
            <action.icon
              className={`h-8 w-8 mb-2 ${action.color} group-hover:scale-110 transition-transform`}
            />
            <span className="text-sm font-medium text-center leading-tight">
              {action.label}
            </span>
            <span className="text-xs text-muted-foreground text-center mt-1">
              {action.description}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
