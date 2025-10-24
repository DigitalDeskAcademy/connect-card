/**
 * Platform Admin Lesson Form Wrapper
 *
 * Wraps the shared LessonForm with platform-specific logic
 * Uses direct lesson data from page component (enterprise pattern)
 */

"use client";

import { LessonForm } from "@/components/courses/LessonForm";
import { updateLesson } from "../actions";

interface PlatformLessonFormProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    videoKey: string | null;
  };
  chapterId: string;
  courseId: string;
}

export function PlatformLessonForm({
  lesson,
  chapterId,
  courseId,
}: PlatformLessonFormProps) {
  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    videoKey: lesson.videoKey,
  };

  const backUrl = `/platform/admin/courses/${courseId}/edit?tab=structure`;

  return (
    <LessonForm
      lesson={lessonData}
      chapterId={chapterId}
      courseId={courseId}
      backUrl={backUrl}
      onSubmit={updateLesson}
    />
  );
}
