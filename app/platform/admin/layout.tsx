/**
 * Admin Dashboard Layout - Consistent interface framework for all admin operations
 *
 * Provides unified navigation and layout structure for administrative functions.
 * Optimizes admin productivity with persistent sidebar navigation and responsive design.
 *
 * Admin Experience:
 * - Persistent sidebar navigation for quick feature access
 * - Consistent header with breadcrumbs and user controls
 * - Responsive layout adapting to various screen sizes
 * - Contextual spacing and typography for content readability
 *
 * Layout Structure:
 * - AppSidebar: Navigation menu with role-based feature access
 * - SiteHeader: Breadcrumb navigation and user account controls
 * - Content Area: Responsive container with consistent padding
 * - Container Queries: Adaptive layout based on available space
 *
 * Performance Features:
 * - CSS custom properties for consistent spacing calculations
 * - Efficient layout rendering with Flexbox
 * - Sidebar state persistence for user preference
 *
 * Accessibility:
 * - Semantic layout structure for screen readers
 * - Keyboard navigation support via SidebarProvider
 * - Focus management for admin workflow efficiency
 */

import { PlatformNavSidebar } from "@/components/sidebar/platform-nav-sidebar";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { DashboardContentWrapper } from "@/components/layout/dashboard-content-wrapper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

/**
 * Admin Layout Component
 *
 * Wraps all admin pages with consistent navigation and layout structure.
 * Ensures optimal admin user experience with persistent UI elements.
 *
 * Security: Enforces admin-only access for entire admin area.
 *
 * @param children - Admin page content to render within layout
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Enforce admin authentication for all admin routes
  await requireAdmin();

  // Platform admin always sees "Church Connect" branding
  const brandName = "Church Connect";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 58)", // 232px - accommodates larger icons/text
          "--sidebar-width-icon": "calc(var(--spacing) * 11)", // 44px - just icons, no text bleeding
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <PlatformNavSidebar
        variant="inset"
        brandName={brandName}
        homeUrl="/platform/admin"
      />
      <SidebarInset>
        <DashboardContentWrapper brandName={brandName} showInfoSidebar={true}>
          {children}
        </DashboardContentWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
