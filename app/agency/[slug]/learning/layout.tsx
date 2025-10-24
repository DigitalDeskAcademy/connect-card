/**
 * Agency Learning Layout
 *
 * Provides a full dashboard experience for agency students/clients.
 * Features sidebar navigation, theme toggle, and user profile management.
 *
 * Security:
 * - Validates organization membership
 * - Ensures user has access to learning portal
 * - Provides organization-scoped navigation
 */

import { ReactNode } from "react";
import { AgencyLearningSidebar } from "./_components/AgencyLearningSidebar";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { OrganizationProvider } from "@/app/providers/organization-context";
import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface AgencyLearningLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Agency Learning Layout Component
 *
 * Creates a complete dashboard environment for agency students with:
 * - Custom sidebar navigation for learning content
 * - Organization branding
 * - User profile management
 * - Theme switching
 * - Responsive design
 */
export default async function AgencyLearningLayout({
  children,
  params,
}: AgencyLearningLayoutProps) {
  const { slug } = await params;

  // Verify organization exists
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound();
  }

  // Get current user session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/agency/${slug}/login`);
  }

  // Verify user belongs to this organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!user || user.organizationId !== organization.id) {
    redirect(`/unauthorized`);
  }

  // Get user's learning statistics for sidebar
  const [enrolledCount, completedLessons] = await Promise.all([
    prisma.enrollment.count({
      where: {
        userId: session.user.id,
        status: "Active",
      },
    }),
    prisma.lessonProgress.count({
      where: {
        userId: session.user.id,
        completed: true,
      },
    }),
  ]);

  const learningStats = {
    enrolledCourses: enrolledCount,
    completedLessons: completedLessons,
  };

  return (
    <OrganizationProvider organization={organization}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        {/* Custom sidebar for agency learning */}
        <AgencyLearningSidebar
          variant="inset"
          organization={organization}
          stats={learningStats}
          agencySlug={slug}
        />

        <SidebarInset>
          <div className="flex flex-col h-screen">
            {/* Sticky header wrapper */}
            <div className="sticky top-0 z-50 bg-background">
              {/* Header with theme toggle and user menu - agency branded */}
              <SiteHeader brandName={organization.name} />

              {/* Organization branding header */}
              <div className="border-b px-4 lg:px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {organization.name}
                    </span>
                    <span className="text-sm text-muted-foreground">›</span>
                    <span className="text-sm font-medium">Learning Portal</span>
                  </div>
                  {/* Quick stats badges */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Enrolled:
                      </span>
                      <span className="text-xs font-medium">
                        {enrolledCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Completed:
                      </span>
                      <span className="text-xs font-medium">
                        {completedLessons} lessons
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="@container/main flex flex-col gap-2">
                {/* Main content area */}
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
