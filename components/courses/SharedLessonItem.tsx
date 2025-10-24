/**
 * Shared Lesson Item Component
 *
 * Individual lesson navigation component that works across all contexts.
 * Detects context from URL pattern (following nav-main.tsx pattern).
 *
 * Route patterns:
 * - Platform admin preview: /platform/admin/preview/[courseSlug]/[lessonId]
 * - Agency admin preview: /agency/[slug]/admin/preview/[courseSlug]/[lessonId]
 * - Student learning: /agency/[slug]/learning/[courseSlug]/[lessonId]
 *
 * Based on the original LessonItem from agency learning components.
 */

"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Play } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SharedLessonItemProps {
  lesson: {
    id: string;
    title: string;
    position: number;
    description?: string | null;
  };
  courseSlug: string;
  orgSlug: string;
  isActive?: boolean;
  completed: boolean;
}

export function SharedLessonItem({
  lesson,
  courseSlug,
  orgSlug,
  isActive,
  completed,
}: SharedLessonItemProps) {
  const pathname = usePathname();

  // Detect context from URL pattern (like nav-main.tsx does)
  const isPlatformPreview = pathname.includes("/platform/admin/preview/");
  const isAgencyPreview =
    pathname.includes("/admin/preview/") && !isPlatformPreview;

  // Determine the correct link based on detected context
  const getLessonHref = () => {
    if (isPlatformPreview) {
      // Platform admin preview route
      return `/platform/admin/preview/${courseSlug}/${lesson.id}`;
    } else if (isAgencyPreview) {
      // Agency admin preview route
      return `/agency/${orgSlug}/admin/preview/${courseSlug}/${lesson.id}`;
    } else {
      // Regular student learning route
      return `/agency/${orgSlug}/learning/${courseSlug}/${lesson.id}`;
    }
  };

  return (
    <Link
      href={getLessonHref()}
      className={buttonVariants({
        variant: "outline",
        className: cn(
          "w-full p-2.5 h-auto justify-start transition-all",
          // Completed lesson styling - matches CourseContent completed button exactly
          completed && "!bg-green-500/10 !text-green-500 hover:!text-green-600",

          // Active lesson styling - primary theme when currently viewing this lesson
          isActive &&
            !completed &&
            "bg-primary/10 dark:bg-primary/20 border-primary/50 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary"
        ),
      })}
    >
      <div className="flex items-center gap-2.5 w-full min-w-0">
        <div className="shrink-0">
          {/* Completion status indicator - checkmark for completed, play button for pending */}
          {completed ? (
            <div className="size-5 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
              <Check className="size-3 text-white" />
            </div>
          ) : (
            <div
              className={cn(
                "size-5 rounded-full border-2 bg-background flex justify-center items-center",
                // Active lesson gets primary styling, inactive gets muted
                isActive
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-muted-foreground/60"
              )}
            >
              <Play
                className={cn(
                  "size-2.5 fill-current",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          {/* Lesson title with truncation for long titles */}
          <p
            className={cn(
              "text-xs font-medium truncate",
              completed
                ? "text-green-500 dark:text-green-400"
                : isActive
                  ? "text-primary font-semibold"
                  : "text-foreground"
            )}
          >
            {lesson.position}. {lesson.title}
          </p>

          {/* Status text for completed lessons */}
          {completed && (
            <p className="text-[10px] text-green-500 dark:text-green-400 font-medium">
              Completed
            </p>
          )}

          {/* Status text for active lesson */}
          {isActive && !completed && (
            <p className="text-[10px] text-primary font-medium">
              Currently Watching
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
