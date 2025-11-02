/**
 * Agency Navigation Bar - White-label version of main Navbar
 *
 * Provides identical functionality to the main Navbar but with agency branding
 * instead of "SideCar" branding. Maintains all authentication logic and navigation
 * patterns while allowing agencies to present the platform as their own.
 */

"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { UserDropdown } from "@/app/(public)/_components/UserDropdown";

interface AgencyNavbarProps {
  agency: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Agency Navigation Bar Component
 *
 * White-label version of the main navigation that shows agency name instead of "SideCar"
 * while maintaining all the same functionality and user experience patterns.
 */
export function AgencyNavbar({ agency }: AgencyNavbarProps) {
  // Authentication state management - identical to main navbar
  const { data: session, isPending } = authClient.useSession();

  // Navigation items - same logic as main navbar
  const navigationItems =
    session?.user.role === "platform_admin"
      ? [
          { name: "Home", href: "/platform/admin" },
          { name: "Courses", href: "/platform/admin/courses" },
          { name: "Dashboard", href: "/platform/admin" },
          { name: "Analytics", href: "/platform/admin/analytics" },
        ]
      : session?.user?.role === "agency_owner" ||
          session?.user?.role === "agency_admin"
        ? [
            { name: "Home", href: `/church/${agency.slug}/admin` },
            { name: "Courses", href: `/church/${agency.slug}/admin/courses` },
            { name: "Team", href: `/church/${agency.slug}/admin/users` },
            {
              name: "Analytics",
              href: `/church/${agency.slug}/admin/analytics`,
            },
          ]
        : session?.user
          ? [
              // Regular agency users see learning navigation
              { name: "Home", href: `/church/${agency.slug}/learning` },
              { name: "My Courses", href: `/church/${agency.slug}/learning` },
              {
                name: "Progress",
                href: `/church/${agency.slug}/learning/progress`,
              },
            ]
          : [
              { name: "Home", href: `/church/${agency.slug}` }, // Agency homepage
              { name: "Courses", href: `/church/${agency.slug}/courses` },
              { name: "About", href: `/church/${agency.slug}/about` },
            ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-16 items-center mx-auto px-4 md:px-6 lg:px-8">
        {/* Agency Brand Logo - Key difference from main navbar */}
        <Link
          href={
            session?.user.role === "platform_admin"
              ? "/platform/admin"
              : session?.user?.role === "agency_owner" ||
                  session?.user?.role === "agency_admin"
                ? `/church/${agency.slug}/admin`
                : session?.user
                  ? `/church/${agency.slug}/learning`
                  : `/church/${agency.slug}` // Agency homepage for guests
          }
          className="flex items-center mr-4"
        >
          <span className="font-bold text-2xl">{agency.name}</span>
        </Link>

        {/* Desktop Navigation Menu - Same as main navbar */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center">
          <div className="flex items-center space-x-6">
            {navigationItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right Side - Same authentication logic as main navbar */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          <ThemeToggle />

          {isPending ? null : session ? (
            <UserDropdown
              email={session.user.email}
              image={
                session?.user.image ??
                `https://avatar.vercel.sh/${session?.user.email}`
              }
              name={
                session?.user.name && session.user.name.length > 0
                  ? session.user.name
                  : session?.user.email.split("@")[0]
              }
            />
          ) : (
            <>
              <Link
                href={`/church/${agency.slug}/login`} // Agency login page
                className={buttonVariants({ variant: "secondary" })}
              >
                Login
              </Link>
              <Link
                href={`/church/${agency.slug}/login`} // Agency login page
                className={buttonVariants()}
              >
                Free Trial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
