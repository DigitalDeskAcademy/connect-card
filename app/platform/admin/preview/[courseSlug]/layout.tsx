/**
 * Platform Admin Preview Layout - Course-specific sidebar
 *
 * Nested within Platform Admin Layout to maintain dashboard structure.
 * Follows exact same pattern as agency learning layout.
 *
 * Layout hierarchy:
 * - Platform Admin Layout (has AppSidebar + SiteHeader)
 *   - Preview Layout (adds CourseSidebar)
 *     - Lesson Page (displays content)
 */

import { ReactNode } from "react";
import { CourseSidebar } from "@/components/courses/CourseSidebar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

interface PlatformPreviewLayoutProps {
  params: Promise<{ courseSlug: string }>;
  children: ReactNode;
}

export default async function PlatformPreviewLayout({
  children,
  params,
}: PlatformPreviewLayoutProps) {
  const { courseSlug } = await params;

  // Get platform course with full structure
  const course = await prisma.course.findFirst({
    where: {
      slug: courseSlug,
      organizationId: null, // Platform courses only
    },
    select: {
      id: true,
      title: true,
      slug: true,
      fileKey: true,
      duration: true,
      level: true,
      category: true,
      chapter: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              description: true,
              lessonProgress: {
                take: 0, // No progress in preview
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
      {/* Course-specific sidebar for platform admin preview */}
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebar course={course} orgSlug="platform" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
