/**
 * Agency Learning Sidebar Component
 *
 * Custom sidebar navigation for agency students/clients.
 * Provides learning-focused navigation with progress tracking.
 */

"use client";

import * as React from "react";
import {
  IconHome,
  IconBook,
  IconListDetails,
  IconHelp,
  IconSettings,
  IconProgress,
} from "@tabler/icons-react";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

interface AgencyLearningSidebarProps {
  variant?: "floating" | "inset" | "sidebar";
  organization: {
    id: string;
    name: string;
  };
  stats: {
    enrolledCourses: number;
    completedLessons: number;
  };
  agencySlug: string;
}

export function AgencyLearningSidebar({
  variant = "sidebar",
  organization,
  stats,
  agencySlug,
  ...props
}: AgencyLearningSidebarProps & React.ComponentProps<typeof Sidebar>) {
  // Navigation items for students
  const learningNav = [
    {
      title: "Dashboard",
      url: `/church/${agencySlug}/learning`,
      icon: IconHome,
      isActive: true,
    },
    {
      title: "My Courses",
      url: `/church/${agencySlug}/learning`,
      icon: IconBook,
      badge:
        stats.enrolledCourses > 0
          ? stats.enrolledCourses.toString()
          : undefined,
    },
    {
      title: "Browse Courses",
      url: `/church/${agencySlug}/learning/courses`,
      icon: IconListDetails,
    },
    {
      title: "My Progress",
      url: `/church/${agencySlug}/progress`,
      icon: IconProgress,
      items: [
        {
          title: "Overview",
          url: `/church/${agencySlug}/progress`,
        },
        {
          title: "Achievements",
          url: `/church/${agencySlug}/achievements`,
        },
        {
          title: "Certificates",
          url: `/church/${agencySlug}/certificates`,
        },
      ],
    },
  ];

  const secondaryNav = [
    {
      title: "Support",
      url: `/church/${agencySlug}/support`,
      icon: IconHelp,
    },
    {
      title: "Settings",
      url: `/church/${agencySlug}/settings`,
      icon: IconSettings,
    },
  ];

  return (
    <Sidebar variant={variant} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/church/${agencySlug}/learning`}>
                <div className="flex flex-col gap-0.5 leading-none">
                  {/* Following existing pattern - CSS truncate for long names */}
                  <span className="font-semibold truncate max-w-[150px]">
                    {organization.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Learning Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Stats Card */}
        <div className="px-3 py-2">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Your Progress
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Active Courses</span>
                <span className="font-medium">{stats.enrolledCourses}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Lessons Complete</span>
                <span className="font-medium">{stats.completedLessons}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <NavMain items={learningNav} />

        {/* Secondary Navigation */}
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
