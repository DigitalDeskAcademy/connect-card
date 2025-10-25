"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "../ui/themeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconBell,
  IconSearch,
  IconLayoutSidebarRight,
} from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import {
  getPageTitle,
  getChurchNavigation,
  getPlatformNavigation,
} from "@/lib/navigation";

/**
 * Top Bar - Global utility navigation
 *
 * Contains utility icon buttons and page title:
 * - Sidebar toggle (left)
 * - Page title
 * - Trial badge (if applicable)
 * - Search
 * - Notifications
 * - Info sidebar toggle (right)
 * - Theme toggle
 */
interface Organization {
  id: string;
  name: string;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
}

interface iAppProps {
  brandName?: string;
  organization?: Organization;
  showInfoSidebar?: boolean;
  onInfoSidebarToggle?: () => void;
}

export function SiteHeader({
  organization,
  showInfoSidebar = false,
  onInfoSidebarToggle,
}: iAppProps) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  // Determine navigation config based on current path
  const getNavigationConfig = () => {
    if (pathname.startsWith("/platform/admin")) {
      return getPlatformNavigation();
    }
    // Extract church slug from pathname: /church/[slug]/...
    const churchMatch = pathname.match(/^\/church\/([^/]+)\//);
    if (churchMatch) {
      const slug = churchMatch[1];
      return getChurchNavigation(slug);
    }
    // Fallback for other routes
    return null;
  };

  const navigationConfig = getNavigationConfig();
  const pageTitle = navigationConfig
    ? getPageTitle(pathname, navigationConfig)
    : "Dashboard";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {/* Page title */}
        <h1 className="text-2xl font-bold">{pageTitle}</h1>

        {/* Utility buttons - right aligned */}
        <div className="ml-auto flex items-center gap-2">
          {/* Trial badge - just before search */}
          {organization?.subscriptionStatus === "TRIAL" && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Trial -{" "}
              {organization.trialEndsAt
                ? `Ends ${new Date(organization.trialEndsAt).toLocaleDateString()}`
                : "Active"}
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconSearch className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconBell className="h-4 w-4" />
          </Button>
          <ThemeToggle />

          {/* User avatar - visible on mobile when sidebar is closed, always on far right */}
          {isMobile && !openMobile && session && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpenMobile(true)}
              aria-label="Open user menu"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={
                    session.user.image ??
                    `https://avatar.vercel.sh/${session.user.email}`
                  }
                  alt={session.user.name ?? "User"}
                />
                <AvatarFallback>
                  {session.user.name?.[0]?.toUpperCase() ??
                    session.user.email?.[0]?.toUpperCase() ??
                    "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>

        {/* Right sidebar toggle - mirrors left sidebar toggle */}
        {showInfoSidebar && (
          <>
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 -mr-1"
              onClick={onInfoSidebarToggle}
            >
              <IconLayoutSidebarRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
