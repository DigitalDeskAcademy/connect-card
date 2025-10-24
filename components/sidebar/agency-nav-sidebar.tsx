/**
 * Church Admin Sidebar Component
 *
 * Custom sidebar navigation for church administrators.
 * Provides admin-focused navigation with proper multi-tenant URL routing.
 *
 * Following the established pattern from church learning sidebar,
 * this component builds navigation URLs dynamically based on the church slug.
 */

"use client";

import * as React from "react";
import {
  IconHome,
  IconChartBar,
  IconSettings,
  IconHelp,
  IconSearch,
  IconSchool,
  IconAddressBook,
  IconCalendarMonth,
  IconMessage,
  IconBrain,
  IconUsers,
  IconCash,
  IconDots,
  IconUserPlus,
  IconHandHeart,
  IconPray,
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
} from "@/components/ui/sidebar";
import Link from "next/link";

interface AgencyNavSidebarProps extends React.ComponentProps<typeof Sidebar> {
  brandName?: string;
  homeUrl?: string;
  agencySlug: string;
}

export function AgencyNavSidebar({
  brandName = "SideCar.",
  homeUrl,
  agencySlug,
  ...props
}: AgencyNavSidebarProps) {
  // Build church-specific admin navigation URLs
  // Connect card workflow and core ministry features are primary
  const navMain = [
    {
      title: "Dashboard",
      url: `/church/${agencySlug}/admin`,
      icon: IconHome,
    },
    {
      title: "N2N",
      url: `/church/${agencySlug}/admin/n2n`,
      icon: IconUserPlus,
    },
    {
      title: "Volunteer",
      url: `/church/${agencySlug}/admin/volunteer`,
      icon: IconHandHeart,
    },
    {
      title: "Prayer",
      url: `/church/${agencySlug}/admin/prayer`,
      icon: IconPray,
    },
    // Collapsible "More" section for secondary features
    {
      title: "More",
      url: "#",
      icon: IconDots,
      className: "mt-4",
      items: [
        {
          title: "Calendar",
          url: `/church/${agencySlug}/admin/calendar`,
          icon: IconCalendarMonth,
        },
        {
          title: "Contacts",
          url: `/church/${agencySlug}/admin/contacts`,
          icon: IconAddressBook,
        },
        {
          title: "Payments",
          url: `/church/${agencySlug}/admin/payments`,
          icon: IconCash,
        },
        {
          title: "Conversations",
          url: `/church/${agencySlug}/admin/conversations`,
          icon: IconMessage,
        },
        {
          title: "Team",
          url: `/church/${agencySlug}/admin/team`,
          icon: IconUsers,
        },
        {
          title: "AI Insights",
          url: `/church/${agencySlug}/admin/insights`,
          icon: IconBrain,
        },
        {
          title: "Analytics",
          url: `/church/${agencySlug}/admin/analytics`,
          icon: IconChartBar,
        },
        {
          title: "Training Center",
          url: `/church/${agencySlug}/admin/courses`,
          icon: IconSchool,
        },
      ],
    },
  ];

  const navSecondary = [
    {
      title: "Settings",
      url: `/church/${agencySlug}/admin/settings`,
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: `/church/${agencySlug}/support`,
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ];

  // Use the provided homeUrl or default to church admin dashboard
  const effectiveHomeUrl = homeUrl || `/church/${agencySlug}/admin`;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={effectiveHomeUrl}>
                {/* Following existing pattern - CSS truncate like AppSidebar */}
                <span
                  className={`font-semibold truncate max-w-[180px] block ${
                    brandName === "SideCar." ? "text-[1.75rem]" : "text-base"
                  }`}
                >
                  {brandName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
