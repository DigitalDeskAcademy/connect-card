/**
 * Navigation Bar - Primary site navigation and conversion optimization
 *
 * Global navigation component that provides consistent site-wide navigation,
 * authentication-aware user experience, and conversion-optimized call-to-action
 * placement. Adapts intelligently based on user authentication status and role.
 *
 * Business Objectives:
 * - Guide users through optimal conversion paths based on authentication state
 * - Provide seamless navigation between marketing and application areas
 * - Reduce friction in user authentication and account management
 * - Establish consistent branding and trust through professional design
 * - Drive trial signups and course enrollment through strategic CTA placement
 *
 * User Experience Strategy:
 * - Role-based navigation: Different menu items for admin vs regular users
 * - Authentication state awareness: Dynamic CTAs based on login status
 * - Progressive disclosure: Show relevant options without overwhelming
 * - Visual hierarchy: Logo → Navigation → Actions flows naturally left-to-right
 * - Accessibility: Proper semantic markup and keyboard navigation support
 *
 * Conversion Optimization Features:
 * - Dual CTA strategy for unauthenticated users (Login + Free Trial)
 * - Strategic placement of "Free Trial" as primary action
 * - Clear visual distinction between secondary (Login) and primary (Free Trial) actions
 * - Sticky positioning maintains CTAs visibility during scroll
 * - Theme toggle for user preference and engagement
 *
 * Navigation Logic:
 * - Admin Users: Admin-focused navigation with dashboard access
 * - Regular Users: Customer-focused navigation with marketing pages
 * - Unauthenticated: Marketing navigation with clear conversion paths
 * - Smart logo linking: Home for regular users, admin dashboard for admins
 *
 * Technical Implementation:
 * - Client-side authentication state management with Better Auth
 * - Responsive design with mobile-first approach
 * - Backdrop blur and transparency for modern glass morphism effect
 * - Sticky positioning (top-0 z-50) for persistent navigation access
 * - Optimized image loading with Next.js Image component
 *
 * Performance Considerations:
 * - Minimal JavaScript footprint with optimized auth state checking
 * - Efficient re-rendering only when authentication state changes
 * - Lazy-loaded user avatar images with fallback generation
 * - CSS-based responsive behavior for fast mobile performance
 *
 * @component Navbar
 * @returns {JSX.Element} Complete navigation bar with authentication state
 *
 * @example
 * // Automatically included in PublicLayout for all public pages
 * <Navbar />
 *
 * // Navigation adapts based on user state:
 * // - Unauthenticated: Marketing nav + Login/Free Trial CTAs
 * // - Regular User: Course nav + User dropdown
 * // - Admin: Admin nav + Dashboard access + User dropdown
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { UserDropdown } from "./UserDropdown";

/**
 * Navigation Bar Component
 *
 * Renders the main site navigation with role-based menu items, authentication-aware
 * actions, and conversion-optimized call-to-action buttons. Provides consistent
 * branding and user experience across all public pages.
 *
 * Authentication Flow:
 * 1. Fetches user session state using Better Auth client hook
 * 2. Renders different navigation items based on user role (admin vs regular)
 * 3. Shows appropriate authentication actions (login/trial vs user dropdown)
 * 4. Handles loading states gracefully during authentication checks
 *
 * Navigation Strategy:
 * - Admin users get admin-focused navigation with dashboard and analytics access
 * - Regular users get customer-focused navigation with marketing pages
 * - All users can access the courses catalog for browsing and enrollment
 * - Smart routing based on user context and business objectives
 *
 * @component Navbar
 * @returns {JSX.Element} Navigation bar with role-based menu and auth actions
 */
export function Navbar() {
  // Authentication state management - drives all conditional rendering
  const { data: session, isPending } = authClient.useSession();

  // Agency page detection for conditional navigation rendering
  const pathname = usePathname();
  const isAgencyPage = pathname.startsWith("/agency");

  /**
   * Dynamic Navigation Items
   *
   * Configures navigation menu items based on user authentication status and role.
   * Provides different navigation paths to optimize user journey and reduce cognitive load.
   * Filters out Pricing link on agency pages for unauthenticated users.
   *
   * Admin Navigation:
   * - Home → /admin/courses (course management as primary workflow)
   * - Courses → /courses (public course catalog for oversight)
   * - Dashboard → /admin (admin overview and analytics)
   * - Analytics → /admin/analytics (detailed platform metrics)
   *
   * Regular User Navigation:
   * - Home → / (marketing homepage for brand reinforcement)
   * - Courses → /courses (primary course discovery and enrollment)
   * - My Learning → /my-learning (personalized learning dashboard)
   * - Pricing → /pricing (pricing information and plan selection)
   *
   * Guest User Navigation:
   * - Home → / (marketing homepage)
   * - Courses → /courses (course catalog for discovery)
   * - Features → /features (feature exploration)
   * - Pricing → /pricing (pricing information) - Hidden on agency pages
   *
   * @constant {Array<{name: string, href: string}>} navigationItems - Role-based menu items
   */
  const baseNavigationItems =
    session?.user.role === "platform_admin"
      ? [
          { name: "Home", href: "/platform/admin" },
          { name: "Courses", href: "/platform/admin/courses" },
          { name: "Dashboard", href: "/platform/admin" },
          { name: "Analytics", href: "/platform/admin/analytics" },
        ]
      : session?.user
        ? [
            // For authenticated non-admin users, use smart home route
            // This will redirect them to their appropriate dashboard
            { name: "Home", href: "/home" },
            { name: "Features", href: "/features" },
            { name: "Pricing", href: "/pricing" },
          ]
        : [
            { name: "Home", href: "/" },
            { name: "Features", href: "/features" },
            { name: "Pricing", href: "/pricing" },
          ];

  // Filter out Pricing on agency pages for unauthenticated users
  const navigationItems =
    isAgencyPage && !session?.user
      ? baseNavigationItems.filter(item => item.name !== "Pricing")
      : baseNavigationItems;
  return (
    /* Main Navigation Header - Sticky positioning for persistent access */
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-16 items-center mx-auto px-4 md:px-6 lg:px-8">
        {/* Brand Logo and Company Name - Smart routing based on user role */}
        <Link
          href={
            session?.user.role === "platform_admin"
              ? "/platform/admin"
              : session?.user
                ? "/home" // Use smart home route for all authenticated users
                : "/" // Public homepage for unauthenticated users
          }
          className="flex items-center mr-4"
        >
          <span className="font-bold text-2xl">Church Sync</span>
        </Link>

        {/* Desktop Navigation Menu - Hidden on mobile, full width on desktop */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center">
          {/* Center - Main Navigation Links */}
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

        {/* Right Side - User Actions and Authentication */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          {/* Theme Toggle - User preference and engagement */}
          <ThemeToggle />

          {/* Authentication-Aware Action Area */}
          {isPending ? null : session ? (
            /* Authenticated User - Show user dropdown with account management */
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
            /* Unauthenticated User - Conversion-optimized dual CTA strategy */
            <>
              {/* Secondary CTA - Login for existing users */}
              <Link
                href="/login"
                className={buttonVariants({ variant: "secondary" })}
              >
                Login
              </Link>

              {/* Primary CTA - Free trial for new users (conversion focus) */}
              {!isAgencyPage && (
                <Link href="/signup" className={buttonVariants()}>
                  Free Trial
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
