"use client";

import * as React from "react";
import {
  IconCalendar,
  IconMessage,
  IconCreditCard,
  IconHome,
  IconHelp,
  IconSearch,
  IconSettings,
  IconCode,
  IconUsers,
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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/platform/admin",
      icon: IconHome,
    },
    {
      title: "Contacts",
      url: "/platform/admin/contacts",
      icon: IconUsers,
    },
    {
      title: "Calendar",
      url: "/platform/admin/appointments",
      icon: IconCalendar,
    },
    {
      title: "Conversations",
      url: "/platform/admin/conversations",
      icon: IconMessage,
    },
    {
      title: "Payments",
      url: "/platform/admin/payments",
      icon: IconCreditCard,
    },
  ],
  navAdmin: [
    {
      title: "Dev",
      isActive: false,
      url: "#",
      icon: IconCode,
      items: [
        {
          title: "Courses",
          url: "/platform/admin/courses",
        },
        {
          title: "Analytics",
          url: "/platform/admin/analytics",
        },
        {
          title: "API",
          url: "/platform/admin/api",
        },
        {
          title: "Projects",
          url: "/platform/admin/projects",
        },
        {
          title: "Team",
          url: "/platform/admin/team",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/platform/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/platform/admin/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/platform/admin/search",
      icon: IconSearch,
    },
  ],
};

// Following existing pattern with iAppProps
interface iAppProps extends React.ComponentProps<typeof Sidebar> {
  brandName?: string;
  homeUrl?: string;
}

export function PlatformNavSidebar({
  brandName = "SideCar.",
  homeUrl = "/",
  ...props
}: iAppProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={homeUrl}>
                {/* Following existing pattern - CSS truncate like CourseSidebar */}
                <span
                  className={`font-semibold truncate max-w-[180px] block group-data-[collapsible=icon]:invisible ${
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
        {/* Core operational features */}
        <NavMain items={data.navMain} />

        {/* Push Admin and secondary nav to bottom */}
        <div className="mt-auto space-y-1">
          {/* Admin dropdown (Courses, Analytics, API, etc.) */}
          <NavMain items={data.navAdmin} />

          {/* Bottom nav (Get Help, Search) */}
          <NavSecondary items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
