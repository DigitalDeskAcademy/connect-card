/**
 * LessonItem - Individual lesson navigation component for course sidebar
 *
 * Renders a clickable lesson item with completion status, active state indicators,
 * and visual feedback for student progress tracking. Part of the course navigation
 * system that allows students to jump between lessons within a course.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {Object} props.lesson - Lesson data object
 * @param {string} props.lesson.id - Unique lesson identifier for navigation
 * @param {string} props.lesson.title - Display title for the lesson
 * @param {number} props.lesson.position - Lesson order number within chapter
 * @param {string|null} props.lesson.description - Optional lesson description
 * @param {string} props.slug - Course slug for URL construction
 * @param {boolean} [props.isActive] - Whether this lesson is currently being viewed
 * @param {boolean} props.completed - Whether student has completed this lesson
 *
 * @returns {JSX.Element} Clickable lesson item with status indicators
 *
 * @example
 * <LessonItem
 *   lesson={{id: "123", title: "Introduction", position: 1, description: null}}
 *   slug="react-basics"
 *   isActive={true}
 *   completed={false}
 * />
 */

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Play } from "lucide-react";
import Link from "next/link";

interface iAppProps {
  lesson: {
    id: string;
    title: string;
    position: number;
    description: string | null;
  };
  courseSlug: string;
  orgSlug: string;
  isActive?: boolean;
  completed: boolean;
}

export function LessonItem({
  lesson,
  courseSlug,
  orgSlug,
  isActive,
  completed,
}: iAppProps) {
  return (
    <Link
      href={`/church/${orgSlug}/learning/${courseSlug}/${lesson.id}`}
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
