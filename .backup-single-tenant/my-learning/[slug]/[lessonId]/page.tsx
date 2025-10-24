/**
 * LessonContentPage - Individual lesson viewing interface with async data loading
 *
 * Handles the display of specific lesson content within the student learning dashboard.
 * Implements React Suspense pattern for optimal loading performance with skeleton states
 * during data fetching operations.
 *
 * Architecture Pattern:
 * - Page component handles params extraction and Suspense boundary setup
 * - Separate async loader component manages data fetching and content rendering
 * - Skeleton loading state provides immediate visual feedback during database queries
 * - CourseContent component handles the rich lesson display with video player integration
 *
 * Features:
 * - Async lesson content loading with progress tracking integration
 * - Suspense boundary with custom skeleton loading state
 * - Component separation for optimal data streaming in Next.js 15
 * - Integration with course progress tracking and completion system
 *
 * @page
 * @param {Object} props - Component properties
 * @param {Promise<{lessonId: string}>} props.params - Dynamic route parameters from Next.js
 * @returns {JSX.Element} Lesson content interface with Suspense loading boundary
 *
 * @example
 * // Route: /my-learning/react-fundamentals/lesson-123
 * // Displays individual lesson with video player and completion tracking
 * // Integrates with confetti celebrations on lesson completion
 */
import { getLessonContent } from "@/app/data/course/get-lesson-content";
import { CourseContent } from "./_components/CourseContent";
import { Suspense } from "react";
import { LessonSkeleton } from "./_components/LessonSkeleton";

type Params = Promise<{ lessonId: string }>;

export default async function LessonContentPage({
  params,
}: {
  params: Params;
}) {
  // Extract lessonId from dynamic route parameters using Next.js 15 async params pattern
  const { lessonId } = await params;

  return (
    /* Suspense Boundary: Provides immediate visual feedback while lesson data loads from database */
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContentLoader lessonId={lessonId} />
    </Suspense>
  );
}

/**
 * LessonContentLoader - Async data fetching component for lesson content
 *
 * Separated from main page component to enable proper data streaming with React Suspense.
 * This pattern ensures skeleton loading states display immediately while database queries execute.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.lessonId - Unique identifier for the lesson to load
 * @returns {JSX.Element} Populated CourseContent component with lesson data
 */
async function LessonContentLoader({ lessonId }: { lessonId: string }) {
  // Fetch lesson content including video URLs, descriptions, and progress tracking data
  const data = await getLessonContent(lessonId);
  return <CourseContent data={data} />;
}
