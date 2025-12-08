"use client";

import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "../ui/themeToggle";
import { ThemeVariantSwitcher } from "../ui/theme-variant-switcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconSparkles,
  IconDashboard,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import {
  getPageTitle,
  getChurchNavigation,
  getPlatformNavigation,
} from "@/lib/navigation";
import { useSignOut } from "@/hooks/use-signout";
import { useNavigation } from "@/hooks/use-navigation";
import Link from "next/link";

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
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const handleSignOut = useSignOut();
  const { dashboardUrl, profileUrl, isAdmin } = useNavigation();

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
          <Suspense fallback={null}>
            <ThemeVariantSwitcher />
          </Suspense>
          <ThemeToggle />

          {/* User avatar dropdown - always visible for logout access */}
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="User menu"
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name || session.user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href={dashboardUrl}>
                        <IconDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={profileUrl}>
                      <IconUser className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <IconLogout className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* AI Sidebar toggle - mirrors left sidebar pattern */}
          {showInfoSidebar && (
            <>
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 -mr-1"
                onClick={onInfoSidebarToggle}
                aria-label="Toggle AI assistant"
              >
                <IconSparkles className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
