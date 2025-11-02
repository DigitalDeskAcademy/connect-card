/**
 * Agency Course Layout - Nested within Learning Layout
 *
 * Provides course-specific sidebar for lesson navigation while maintaining
 * the dashboard structure from the parent learning layout.
 *
 * Layout hierarchy:
 * - Agency Learning Layout (has AgencyLearningSidebar)
 *   - Course Layout (adds CourseSidebar)
 *     - Lesson Page (displays content)
 *
 * This follows the exact pattern from the single-tenant version where
 * users have both the main dashboard sidebar AND the course navigation sidebar.
 */

import { ReactNode } from "react";
import { CourseSidebar } from "@/components/courses/CourseSidebar";
import { getCourseSidebarDataForAgency } from "@/app/data/course/get-course-sidebar-data-agency";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

interface AgencyCourseLayoutProps {
  params: Promise<{
    slug: string;
    courseSlug: string;
  }>;
  children: ReactNode;
}

export default async function AgencyCourseLayout({
  children,
  params,
}: AgencyCourseLayoutProps) {
  const { slug, courseSlug } = await params;

  // Verify organization exists
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound();
  }

  // Verify user authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/church/${slug}/login`);
  }

  // Verify user belongs to organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      organizationId: true,
      role: true,
    },
  });

  if (!user || user.organizationId !== organization.id) {
    notFound();
  }

  // Get course data for sidebar
  // This function handles all access validation internally
  const course = await getCourseSidebarDataForAgency(courseSlug);

  if (!course) {
    notFound();
  }

  return (
    <div className="flex flex-1">
      {/* Course-specific sidebar - 30% width */}
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebar course={course.course} orgSlug={slug} />
      </div>

      {/* Main Content - 70% width */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
