"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      color: "text-blue-500",
    },
    {
      label: "Process Cards",
      description: "Review & approve",
      href: `/church/${slug}/admin/connect-cards${locationParam}`,
      icon: IconClipboardCheck,
      color: "text-green-500",
    },
    {
      label: "Add Team Member",
      description: "Invite staff",
      href: `/church/${slug}/admin/team`,
      icon: IconUserPlus,
      color: "text-purple-500",
    },
    {
      label: "Prayer Requests",
      description: "View & assign",
      href: `/church/${slug}/admin/prayer${locationParam}`,
      icon: IconPray,
      color: "text-amber-500",
    },
    {
      label: "Volunteers",
      description: "Manage team",
      href: `/church/${slug}/admin/volunteer${locationParam}`,
      icon: IconHeart,
      color: "text-red-500",
    },
    {
      label: "Message",
      description: "Bulk outreach",
      href: `/church/${slug}/admin/volunteer/message${locationParam}`,
      icon: IconSend,
      color: "text-teal-500",
    },
    {
      label: "Sync Data",
      description: "Export to ChMS",
      href: `/church/${slug}/admin/integrations`,
      icon: IconRefresh,
      color: "text-cyan-500",
    },
    {
      label: "Analytics",
      description: "View reports",
      href: `/church/${slug}/admin/analytics`,
      icon: IconChartBar,
      color: "text-indigo-500",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {actions.map(action => (
            <Link key={action.label} href={action.href}>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group">
                <action.icon
                  className={`h-6 w-6 mb-1.5 ${action.color} group-hover:scale-110 transition-transform`}
                />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
