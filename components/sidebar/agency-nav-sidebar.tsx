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
import { type Icon } from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import { getChurchNavigation } from "@/lib/navigation";
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
  brandName = "Newlife",
  homeUrl,
  agencySlug,
  ...props
}: AgencyNavSidebarProps) {
  // Get navigation structure from shared config (single source of truth)
  const navigation = getChurchNavigation(agencySlug);

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
        <NavMain items={navigation.navMain} />
        <NavSecondary
          items={
            navigation.navSecondary as Array<{
              title: string;
              url: string;
              icon: Icon;
            }>
          }
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
