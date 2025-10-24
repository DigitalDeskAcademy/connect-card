/**
 * Agency Lesson Page - Following original single-tenant pattern
 *
 * Minimal changes from original:
 * - Added agency slug to route
 * - Will use agency-aware data fetching
 * - Everything else stays the same
 */
import { Suspense } from "react";
import { CourseContent } from "@/components/courses/CourseContent";
import { LessonSkeleton } from "./LessonSkeleton";
import { getLessonContentForAgency } from "@/app/data/course/get-lesson-content-agency";

type Params = Promise<{
  slug: string;
  courseSlug: string;
  lessonId: string;
}>;

export default async function AgencyLessonPage({ params }: { params: Params }) {
  // Extract params - just like original
  const { slug, courseSlug, lessonId } = await params;

  return (
    /* Same Suspense pattern as original */
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContentLoader
        lessonId={lessonId}
        orgSlug={slug}
        courseSlug={courseSlug}
      />
    </Suspense>
  );
}

/**
 * Async loader - exactly like original pattern
 */
async function LessonContentLoader({
  lessonId,
  orgSlug,
  courseSlug,
}: {
  lessonId: string;
  orgSlug: string;
  courseSlug: string;
}) {
  // Fetch lesson content - agency aware version
  const data = await getLessonContentForAgency(lessonId, orgSlug);

  // Pass lesson data and context info to CourseContent
  // CourseContent will handle the actions internally as a client component
  return (
    <CourseContent lesson={data} courseSlug={courseSlug} orgSlug={orgSlug} />
  );
}
