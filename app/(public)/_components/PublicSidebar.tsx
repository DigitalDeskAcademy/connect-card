/**
 * Public Sidebar Component
 *
 * Mobile navigation sidebar for public pages. Matches modern auth sidebar
 * styling with appropriate sizing and spacing. Automatically becomes a
 * Sheet overlay on mobile devices.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/sidebar/nav-main";
import { Button } from "@/components/ui/button";
import { IconHome, IconStar, IconCurrencyDollar } from "@tabler/icons-react";
import Image from "next/image";

export function PublicSidebar() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const isAgencyPage = pathname.startsWith("/agency");

  // Navigation items based on user role (matching Navbar logic)
  const baseNavigationItems =
    session?.user.role === "platform_admin"
      ? [
          {
            title: "Home",
            url: "/platform/admin",
            icon: IconHome,
          },
          {
            title: "Courses",
            url: "/platform/admin/courses",
            icon: IconStar,
          },
          {
            title: "Dashboard",
            url: "/platform/admin",
            icon: IconHome,
          },
          {
            title: "Analytics",
            url: "/platform/admin/analytics",
            icon: IconStar,
          },
        ]
      : session?.user
        ? [
            {
              title: "Home",
              url: "/home",
              icon: IconHome,
            },
            {
              title: "Features",
              url: "/features",
              icon: IconStar,
            },
            {
              title: "Pricing",
              url: "/pricing",
              icon: IconCurrencyDollar,
            },
          ]
        : [
            {
              title: "Home",
              url: "/",
              icon: IconHome,
            },
            {
              title: "Features",
              url: "/features",
              icon: IconStar,
            },
            {
              title: "Pricing",
              url: "/pricing",
              icon: IconCurrencyDollar,
            },
          ];

  // Filter out Pricing on agency pages for unauthenticated users
  const navigationItems =
    isAgencyPage && !session?.user
      ? baseNavigationItems.filter(item => item.title !== "Pricing")
      : baseNavigationItems;

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link
                href={
                  session?.user.role === "platform_admin"
                    ? "/platform/admin"
                    : session?.user
                      ? "/home"
                      : "/"
                }
              >
                <span className="font-semibold text-[1.75rem] truncate max-w-[180px] block">
                  Church Sync AI
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navigationItems} />
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        {session ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Image
                src={
                  session?.user.image ??
                  `https://avatar.vercel.sh/${session?.user.email}`
                }
                alt="User avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  {session?.user.name && session.user.name.length > 0
                    ? session.user.name
                    : session?.user.email.split("@")[0]}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="default"
              className="w-full"
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/";
                    },
                  },
                });
              }}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button asChild variant="outline" size="default" className="w-full">
              <Link href="/login">Login</Link>
            </Button>
            {!isAgencyPage && (
              <Button asChild size="default" className="w-full">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
