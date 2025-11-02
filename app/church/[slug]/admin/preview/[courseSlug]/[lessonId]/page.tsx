/**
 * Agency Admin Preview Lesson Page
 *
 * Allows agency admins to preview lessons while maintaining admin context.
 * Uses the same CourseContent component but within admin layout hierarchy.
 */

import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { CourseContent } from "@/components/courses/CourseContent";
import { LessonSkeleton } from "@/app/church/[slug]/learning/[courseSlug]/[lessonId]/LessonSkeleton";
import { requireChurchAdmin } from "@/app/data/church/require-church-admin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

type Params = Promise<{
  slug: string;
  courseSlug: string;
  lessonId: string;
}>;

export default async function AgencyAdminPreviewLessonPage({
  params,
}: {
  params: Params;
}) {
  const { slug, courseSlug, lessonId } = await params;

  // Verify agency admin access
  const { organization } = await requireChurchAdmin(slug);

  return (
    <PageContainer variant="none">
      <Suspense fallback={<LessonSkeleton />}>
        <AdminPreviewLessonContentLoader
          lessonId={lessonId}
          orgSlug={slug}
          courseSlug={courseSlug}
          organizationId={organization.id}
        />
      </Suspense>
    </PageContainer>
  );
}

async function AdminPreviewLessonContentLoader({
  lessonId,
  orgSlug,
  courseSlug,
  organizationId,
}: {
  lessonId: string;
  orgSlug: string;
  courseSlug: string;
  organizationId: string;
}) {
  // Get lesson data with organization scoping
  // Platform courses (organizationId = null) are accessible to all agencies
  // Agency courses must belong to this organization
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: {
        Course: {
          OR: [
            { organizationId: null }, // Platform courses
            { organizationId: organizationId }, // This agency's courses
          ],
        },
      },
    },
    include: {
      Chapter: {
        include: {
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  // Transform to match expected format for CourseContent
  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    videoKey: lesson.videoKey,
    description: lesson.description,
    thumbnailKey: lesson.thumbnailKey,
    lessonProgress: [], // No progress in admin preview
  };

  // Pass lesson data for preview (CourseContent will handle as admin preview)
  return (
    <CourseContent
      lesson={lessonData}
      courseSlug={courseSlug}
      orgSlug={orgSlug}
      isAdminPreview={true}
    />
  );
}
