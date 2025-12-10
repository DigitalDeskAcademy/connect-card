/**
 * Universal Dashboard Layout
 *
 * Shared layout for all user tiers:
 * - Platform admins (see all data across all churches)
 * - Church admins (see organization data, all locations)
 * - Church staff (see organization data, assigned location)
 *
 * All users see the same UI components, with data scoped by role.
 *
 * Features:
 * - Unified sidebar navigation for all roles
 * - Organization branding in header
 * - Automatic data scoping based on user role
 * - Subscription status checking
 */

import { ReactNode } from "react";
import { AgencyNavSidebar } from "@/components/sidebar/agency-nav-sidebar";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { OrganizationProvider } from "@/app/providers/organization-context";
import { DashboardContentWrapper } from "@/components/layout/dashboard-content-wrapper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Agency Admin Layout Component
 *
 * Wraps all agency admin pages with consistent navigation and security.
 * Validates organization access before rendering any admin content.
 *
 * @param children - Page content to render within layout
 * @param params - Route parameters including organization slug
 */
export default async function AgencyAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // Await params (Next.js 15 pattern)
  const { slug } = await params;

  // Universal access control for all three tiers
  // Platform admins, agency admins, and end users all use same UI
  const { organization } = await requireDashboardAccess(slug);

  // Use organization name for branding
  const brandName = organization.name;
  const homeUrl = `/church/${slug}/admin`;

  return (
    <OrganizationProvider organization={organization}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 16)",
          } as React.CSSProperties
        }
      >
        <AgencyNavSidebar
          variant="inset"
          brandName={brandName}
          homeUrl={homeUrl}
          agencySlug={slug}
        />

        <SidebarInset>
          <DashboardContentWrapper
            brandName={brandName}
            organization={organization}
            showInfoSidebar={true}
          >
            {children}
          </DashboardContentWrapper>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
