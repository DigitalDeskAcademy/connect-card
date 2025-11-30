"use client";

import Link from "next/link";
import {
  IconUpload,
  IconUserPlus,
  IconPray,
  IconHeart,
  IconRefresh,
  IconSend,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";

interface QuickAction {
  label: string;
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
      href: `/church/${slug}/admin/connect-cards${locationParam}`,
      icon: IconUpload,
      color: "text-blue-500",
    },
    {
      label: "Invite Staff",
      href: `/church/${slug}/admin/team`,
      icon: IconUserPlus,
      color: "text-purple-500",
    },
    {
      label: "Assign Prayers",
      href: `/church/${slug}/admin/prayer${locationParam}`,
      icon: IconPray,
      color: "text-amber-500",
    },
    {
      label: "Find Volunteers",
      href: `/church/${slug}/admin/volunteer${locationParam}`,
      icon: IconHeart,
      color: "text-red-500",
    },
    {
      label: "Message Volunteers",
      href: `/church/${slug}/admin/volunteer/message${locationParam}`,
      icon: IconSend,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Export Data",
      href: `/church/${slug}/admin/integrations`,
      icon: IconRefresh,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
      {actions.map(action => (
        <Link key={action.label} href={action.href}>
          <div className="h-20 flex flex-col items-center justify-center rounded-xl border bg-card shadow-sm hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group">
            <action.icon
              className={`h-6 w-6 mb-1.5 ${action.color} group-hover:scale-110 transition-transform`}
            />
            <span className="text-xs font-medium text-center leading-tight px-2">
              {action.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
