"use client";

import { useMemo } from "react";

// Structural type - accepts any course data with this minimal shape
// This allows the hook to work with different query types (enrolled courses, sidebar data, etc.)
interface MinimalCourseData {
  chapter: Array<{
    lessons: Array<{
      id: string;
      lessonProgress: Array<{
        lessonId: string;
        completed: boolean;
      }>;
    }>;
  }>;
}

interface iAppProps {
  courseData: MinimalCourseData;
}

interface CourseProgressResult {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

export function useCourseProgress({
  courseData,
}: iAppProps): CourseProgressResult {
  return useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;

    courseData.chapter.forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        totalLessons++;

        //check if this lesson is completed
        const isCompleted = lesson.lessonProgress.some(
          progress => progress.lessonId === lesson.id && progress.completed
        );

        if (isCompleted) {
          completedLessons++;
        }
      });
    });

    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  }, [courseData]);
}
