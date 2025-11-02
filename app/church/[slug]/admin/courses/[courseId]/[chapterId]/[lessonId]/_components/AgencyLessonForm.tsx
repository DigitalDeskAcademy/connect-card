/**
 * Agency Admin Lesson Form Wrapper
 *
 * Wraps the shared LessonForm with agency-specific logic
 */

"use client";

import { LessonForm, LessonData } from "@/components/courses/LessonForm";
import { updateLesson } from "../actions";

interface AgencyLessonFormProps {
  lesson: LessonData;
  chapterId: string;
  courseId: string;
  agencySlug: string;
}

export function AgencyLessonForm({
  lesson,
  chapterId,
  courseId,
  agencySlug,
}: AgencyLessonFormProps) {
  const backUrl = `/church/${agencySlug}/admin/courses/${courseId}/edit?tab=structure`;

  return (
    <LessonForm
      lesson={lesson}
      chapterId={chapterId}
      courseId={courseId}
      backUrl={backUrl}
      onSubmit={updateLesson}
    />
  );
}
