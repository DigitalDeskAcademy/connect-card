/**
 * Public Header Component
 *
 * Mobile-only header that provides the SidebarTrigger (hamburger menu),
 * Login button for unauthenticated users, and theme toggle.
 * Follows the same pattern as authenticated pages' SiteHeader.
 */

"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export function PublicHeader() {
  const { data: session } = authClient.useSession();

  return (
    <header className="flex h-14 shrink-0 items-center border-b md:hidden w-full">
      <div className="flex w-full items-center px-4 min-w-0">
        <span className="font-bold text-xl shrink-0">Church Sync</span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {!session && (
            <Button variant="outline" size="sm" className="h-9" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
          <SidebarTrigger />
        </div>
      </div>
    </header>
  );
}
