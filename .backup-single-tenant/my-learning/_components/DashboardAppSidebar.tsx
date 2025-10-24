"use client";

import * as React from "react";
import {
  IconBook,
  IconHome,
  IconSchool,
  IconTrophy,
  IconCalendar,
  IconSettings,
  IconHelpCircle,
  IconSearch,
} from "@tabler/icons-react";
import Logo from "@/public/digital_desk_icon_blue.svg";

// TODO: After MVP, create student-specific nav components
// For now, reusing admin nav components (pragmatic approach)
import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";

// Shared UI components - these are fine to reuse
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
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/my-learning",
      icon: IconHome,
    },
    {
      title: "My Courses",
      url: "/my-learning",
      icon: IconBook,
    },
    {
      title: "Browse Courses",
      url: "/courses",
      icon: IconSearch,
    },
    {
      title: "Progress",
      url: "/my-learning/progress",
      icon: IconSchool,
    },
    {
      title: "Achievements",
      url: "/my-learning/achievements",
      icon: IconTrophy,
    },
    {
      title: "Schedule",
      url: "/my-learning/schedule",
      icon: IconCalendar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/my-learning/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/support",
      icon: IconHelpCircle,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src={Logo} alt="Logo" className="size-5" />
                <span className="text-base font-semibold">DigitalDesk.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
