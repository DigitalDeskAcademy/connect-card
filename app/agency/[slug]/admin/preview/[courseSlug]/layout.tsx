/**
 * Agency Admin Preview Layout - Nested within Admin Layout
 *
 * Provides course-specific sidebar for lesson navigation while maintaining
 * the admin dashboard structure from the parent admin layout.
 *
 * This follows the exact pattern from platform admin preview, keeping
 * admins in their admin context when previewing courses.
 *
 * Layout hierarchy:
 * - Agency Admin Layout (has AgencyAdminSidebar)
 *   - Preview Layout (adds CourseSidebar)
 *     - Lesson Page (displays content)
 */

import { ReactNode } from "react";
import { CourseSidebar } from "@/components/courses/CourseSidebar";
import { requireAgencyAdmin } from "@/app/data/agency/require-agency-admin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

interface AgencyPreviewLayoutProps {
  params: Promise<{
    slug: string;
    courseSlug: string;
  }>;
  children: ReactNode;
}

export default async function AgencyPreviewLayout({
  children,
  params,
}: AgencyPreviewLayoutProps) {
  const { slug, courseSlug } = await params;

  // Verify agency admin access
  const { organization } = await requireAgencyAdmin(slug);

  // Get course data with full structure for sidebar
  // Platform courses (organizationId = null) are accessible to all agencies
  // Agency courses must belong to this organization
  const course = await prisma.course.findFirst({
    where: {
      slug: courseSlug,
      OR: [
        { organizationId: null }, // Platform courses
        { organizationId: organization.id }, // This agency's courses
      ],
    },
    include: {
      chapter: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              description: true,
              lessonProgress: {
                take: 0, // No progress in admin preview
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="flex flex-1">
      {/* Course-specific sidebar - 30% width */}
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebar course={course} orgSlug={slug} />
      </div>

      {/* Main Content - 70% width */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
