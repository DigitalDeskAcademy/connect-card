/**
 * Platform Admin Preview Lesson Page
 *
 * Displays lesson content in preview mode for platform admins.
 * Follows exact same pattern as agency learning lesson page.
 */

import { Suspense } from "react";
import { CourseContent } from "@/components/courses/CourseContent";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

type Params = Promise<{
  courseSlug: string;
  lessonId: string;
}>;

export default async function PlatformPreviewLessonPage({
  params,
}: {
  params: Params;
}) {
  const { courseSlug, lessonId } = await params;

  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContentLoader lessonId={lessonId} courseSlug={courseSlug} />
    </Suspense>
  );
}

/**
 * Async loader for lesson content
 */
async function LessonContentLoader({
  lessonId,
  courseSlug,
}: {
  lessonId: string;
  courseSlug: string;
}) {
  // Fetch lesson for platform course
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      Chapter: {
        include: {
          Course: true,
        },
      },
      lessonProgress: {
        take: 0, // No progress in preview
      },
    },
  });

  if (!lesson || !lesson.Chapter?.Course) {
    notFound();
  }

  // Verify this is a platform course
  if (
    lesson.Chapter.Course.organizationId !== null ||
    lesson.Chapter.Course.slug !== courseSlug
  ) {
    notFound();
  }

  // Format lesson data for CourseContent
  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    thumbnailKey: lesson.thumbnailKey,
    videoKey: lesson.videoKey,
    lessonProgress: [], // Empty for preview
  };

  return (
    <CourseContent
      lesson={lessonData}
      courseSlug={courseSlug}
      orgSlug="platform"
      isPreviewMode={true} // Preview mode - no progress tracking
      showAdminControls={false}
    />
  );
}

/**
 * Loading skeleton
 */
function LessonSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-3/4" />
      <div className="aspect-video bg-muted rounded-lg" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}
