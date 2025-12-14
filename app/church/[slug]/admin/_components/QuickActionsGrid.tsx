"use client";

import Link from "next/link";
import {
  IconUpload,
  IconClipboardList,
  IconPray,
  IconHeart,
  IconFileExport,
  IconSend,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

interface QuickAction {
  label: string;
  href: string;
  icon: Icon;
  color: string;
  badge?: number;
}

interface QuickActionsGridProps {
  slug: string;
  /** User's default location slug for pre-filtering. Null if user can see all locations. */
  defaultLocationSlug: string | null;
  /** Count of batches needing review for badge display */
  batchesNeedingReview: number;
}

export function QuickActionsGrid({
  slug,
  defaultLocationSlug,
  batchesNeedingReview,
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
      label: "Review Batches",
      href: `/church/${slug}/admin/connect-cards?tab=batches`,
      icon: IconClipboardList,
      color: "text-purple-500",
      badge: batchesNeedingReview,
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
      color: "text-teal-500",
    },
    {
      label: "Export Data",
      href: `/church/${slug}/admin/export`,
      icon: IconFileExport,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
      {actions.map(action => (
        <Link key={action.label} href={action.href}>
          <div className="relative h-20 flex flex-col items-center justify-center rounded-xl border bg-card shadow-sm hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group">
            {action.badge !== undefined && action.badge > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-xs">
                {action.badge}
              </Badge>
            )}
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
