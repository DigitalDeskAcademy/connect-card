/**
 * Shared Course Sidebar Component
 *
 * A unified course navigation sidebar that works across all contexts:
 * - Platform admin preview (no progress tracking)
 * - Agency admin preview (no progress tracking)
 * - Student learning (with progress tracking)
 *
 * This component follows the shared component pattern to eliminate
 * code duplication between platform and agency implementations.
 *
 * @param course - Course data with chapters and lessons
 * @param orgSlug - Organization slug ("platform" for platform admin, agency slug for agencies)
 * @param isAdminPreview - Whether this is an admin previewing (disables progress, changes routes)
 * @param isPlatformPreview - Whether this is specifically a platform admin preview
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  CollapsibleContent,
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Play } from "lucide-react";
import { usePathname } from "next/navigation";
import { SharedLessonItem } from "./SharedLessonItem";

// Define the course structure that works for both preview and learning contexts
interface CourseSidebarCourse {
  id: string;
  title: string;
  slug: string;
  category?: string;
  chapter?: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      position: number;
      description?: string | null;
      lessonProgress?: Array<{
        lessonId: string;
        completed: boolean;
      }>;
    }>;
  }>;
  // Support both naming conventions (chapter vs chapters)
  chapters?: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      position: number;
      description?: string | null;
      lessonProgress?: Array<{
        lessonId: string;
        completed: boolean;
      }>;
    }>;
  }>;
}

interface CourseSidebarProps {
  course: CourseSidebarCourse;
  orgSlug: string;
}

export function CourseSidebar({ course, orgSlug }: CourseSidebarProps) {
  const pathname = usePathname();
  const currentLessonId = pathname.split("/").pop();

  // Use chapters or chapter depending on what's provided
  const chapters = course.chapters || course.chapter || [];

  // Detect context from URL (following nav-main.tsx pattern)
  const isAdminPreview = pathname.includes("/admin/preview/");
  const showProgress = !isAdminPreview;

  // Calculate progress manually for flexibility across different course data structures
  let completedLessons = 0;
  let totalLessons = 0;

  if (showProgress) {
    chapters.forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        totalLessons++;
        const isCompleted =
          lesson.lessonProgress?.some(p => p.completed) || false;
        if (isCompleted) {
          completedLessons++;
        }
      });
    });
  }

  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Course Header */}
      <div className="pb-4 pr-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Play className="size-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base leading-tight truncate">
              {course.title}
            </h1>
            {course.category && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {course.category}
              </p>
            )}
          </div>
        </div>

        {/* Progress Section - Only show for students */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {progressPercentage}% complete
            </p>
          </div>
        )}

        {/* Admin Preview Notice */}
        {isAdminPreview && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
              Preview Mode - Progress tracking disabled
            </p>
          </div>
        )}
      </div>

      {/* Chapters and Lessons */}
      <div className="py-4 pr-4 space-y-3 overflow-y-auto">
        {chapters.map((chapter, index) => (
          <Collapsible key={chapter.id} defaultOpen={index === 0}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full p-3 h-auto flex items-center gap-2"
              >
                <div className="shrink-0">
                  <ChevronDown className="size-4 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground">
                    {chapter.position}: {chapter.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate">
                    {chapter.lessons.length} lessons
                  </p>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 pl-6 border-l-2 space-y-3">
              {chapter.lessons.map(lesson => {
                // Determine if lesson is completed (only for non-preview modes)
                const isCompleted =
                  (showProgress &&
                    lesson.lessonProgress?.some(p => p.completed)) ||
                  false;

                return (
                  <SharedLessonItem
                    key={lesson.id}
                    lesson={lesson}
                    courseSlug={course.slug}
                    orgSlug={orgSlug}
                    isActive={currentLessonId === lesson.id}
                    completed={isCompleted}
                  />
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
