"use client";

import * as React from "react";
import { type Icon } from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import { getPlatformNavigation } from "@/lib/navigation";
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

// Get navigation structure from shared config (single source of truth)
const navigation = getPlatformNavigation();

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
        <NavMain items={navigation.navMain} />

        {/* Push Admin and secondary nav to bottom */}
        <div className="mt-auto space-y-1">
          {/* Admin dropdown (Courses, Analytics, API, etc.) */}
          <NavMain items={navigation.navAdmin || []} />

          {/* Bottom nav (Get Help, Search) */}
          <NavSecondary
            items={
              navigation.navSecondary as Array<{
                title: string;
                url: string;
                icon: Icon;
              }>
            }
          />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
