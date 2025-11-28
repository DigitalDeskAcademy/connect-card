"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconUpload,
  IconClipboardCheck,
  IconUserPlus,
  IconPray,
  IconHeart,
  IconChartBar,
  IconSend,
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
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Process Cards",
      description: "Review & approve",
      href: `/church/${slug}/admin/connect-cards${locationParam}`,
      icon: IconClipboardCheck,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Add Team Member",
      description: "Invite staff",
      href: `/church/${slug}/admin/team`,
      icon: IconUserPlus,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Prayer Requests",
      description: "View & assign",
      href: `/church/${slug}/admin/prayer${locationParam}`,
      icon: IconPray,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Volunteers",
      description: "Manage team",
      href: `/church/${slug}/admin/volunteer${locationParam}`,
      icon: IconHeart,
      color: "text-red-600 dark:text-red-400",
    },
    {
      label: "Message Volunteers",
      description: "Bulk outreach",
      href: `/church/${slug}/admin/volunteer/message${locationParam}`,
      icon: IconSend,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Export Data",
      description: "Download CSV",
      href: `/church/${slug}/admin/export`,
      icon: IconRefresh,
      color: "text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Analytics",
      description: "View reports",
      href: `/church/${slug}/admin/analytics`,
      icon: IconChartBar,
      color: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {actions.map(action => (
        <Link key={action.label} href={action.href}>
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <action.icon
                className={`h-8 w-8 mb-2 ${action.color} group-hover:scale-110 transition-transform`}
              />
              <span className="text-sm font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">
                {action.description}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
