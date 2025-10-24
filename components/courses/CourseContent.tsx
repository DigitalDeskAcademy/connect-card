/**
 * CourseContent - Shared lesson viewing component with video player and completion tracking
 *
 * This component is used by both platform admins (preview mode) and end users (learning mode)
 * to view lesson content. It handles video playback, progress tracking, and rich text display.
 *
 * Multi-tenant aware: Works across different organizational contexts
 * No enrollment checks: Users have automatic access to their agency's courses
 *
 * Following the single-tenant pattern: This client component imports and calls
 * server actions directly, just like the original implementation.
 */
"use client";

import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import {
  markLessonComplete,
  markLessonIncomplete,
} from "@/app/church/[slug]/learning/[courseSlug]/[lessonId]/actions";

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  thumbnailKey: string | null;
  videoKey: string | null;
  lessonProgress: Array<{
    completed: boolean;
    lessonId: string;
  }>;
}

interface CourseContentProps {
  lesson: LessonData;
  courseSlug: string;
  orgSlug: string;
  showAdminControls?: boolean; // For admin preview mode
  isPreviewMode?: boolean; // Disable progress tracking in preview
  isAdminPreview?: boolean; // New prop for admin preview context
}

/**
 * VideoPlayer - Embedded video component with content protection
 *
 * Content Protection Strategy (3 Levels):
 *
 * Level 1 (Current - MVP): Browser-level protection
 * - Disables native download button via controlsList="nodownload"
 * - Prevents right-click context menu downloads
 * - Disables picture-in-picture to prevent capture workarounds
 * - Effectiveness: Stops 95% of non-technical users
 * - Cost: Free, implemented below
 *
 * Level 2 (Post-Launch): Visual deterrents
 * - User email watermark overlay on video player
 * - Makes downloads traceable back to original user
 * - Psychological deterrent against sharing
 * - Cost: ~2 hours development time
 *
 * Level 3 (Post-$10k MRR): DRM + HLS streaming
 * - Adaptive bitrate streaming (HLS/DASH)
 * - Token-based authentication with expiring URLs
 * - DRM encryption (Widevine, FairPlay, PlayReady)
 * - Services: Cloudflare Stream, Mux, Vimeo OTT
 * - Cost: $200-500/month + implementation time
 * - When: After $10k MRR when content protection ROI justifies cost
 *
 * Note: Even with Level 1, tech-savvy users can access videos via DevTools Network tab.
 * This is acceptable for MVP launch - B2B customers care about reputation and won't pirate.
 */
function VideoPlayer({
  thumbnailKey,
  videoKey,
}: {
  thumbnailKey: string | null;
  videoKey: string | null;
}) {
  const videoUrl = useConstructUrl(videoKey ?? "");
  const thumbnailUrl = useConstructUrl(thumbnailKey ?? "");

  if (!videoKey) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
        <BookIcon className="size-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          This lesson does not have a video yet
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
      <video
        className="w-full h-full object-cover"
        controls
        controlsList="nodownload" // Disables native download button
        disablePictureInPicture // Prevents picture-in-picture capture workarounds
        onContextMenu={e => e.preventDefault()} // Disables right-click menu
        poster={thumbnailUrl}
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export function CourseContent({
  lesson,
  courseSlug,
  orgSlug,
  showAdminControls = false,
  isPreviewMode = false,
  isAdminPreview = false,
}: CourseContentProps) {
  // Set preview mode based on admin preview
  const effectivePreviewMode = isPreviewMode || isAdminPreview;
  const effectiveShowAdminControls = showAdminControls || isAdminPreview;
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();

  const isCompleted = lesson.lessonProgress.length > 0;

  /**
   * Handle marking lesson as complete - calls server action directly
   * Following the single-tenant pattern from ../actions
   */
  function handleMarkComplete() {
    if (effectivePreviewMode) {
      toast.info("Progress tracking is disabled in preview mode");
      return;
    }

    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(lesson.id, courseSlug, orgSlug)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti(); // Celebrate!
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  /**
   * Handle marking lesson as incomplete - calls server action directly
   * Following the single-tenant pattern from ../actions
   */
  function handleMarkIncomplete() {
    if (effectivePreviewMode) {
      toast.info("Progress tracking is disabled in preview mode");
      return;
    }

    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonIncomplete(lesson.id, courseSlug, orgSlug)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-background pl-6">
      {/* Admin preview notice */}
      {effectiveShowAdminControls && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Admin Preview Mode - Progress tracking disabled
          </p>
        </div>
      )}

      {/* Video player section */}
      <VideoPlayer
        thumbnailKey={lesson.thumbnailKey}
        videoKey={lesson.videoKey}
      />

      {/* Completion control section */}
      {!effectivePreviewMode && (
        <div className="py-4 border-b">
          {isCompleted ? (
            <Button
              variant="outline"
              className="bg-green-500/10 text-green-500 hover:text-green-600"
              onClick={handleMarkIncomplete}
              disabled={pending}
            >
              <CheckCircle className="size-4 mr-2 text-green-500" />
              Completed
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleMarkComplete}
              disabled={pending}
            >
              <CheckCircle className="size-4 mr-2 text-green-500" />
              Mark as Complete
            </Button>
          )}
        </div>
      )}

      {/* Lesson content section */}
      <div className="space-y-3 pt-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {lesson.title}
        </h1>

        {/* Rich text description */}
        {lesson.description && (
          <div>
            {(() => {
              try {
                // Try to parse as JSON for rich text
                return (
                  <RenderDescription json={JSON.parse(lesson.description)} />
                );
              } catch {
                // Fallback for plain text
                return (
                  <p className="text-muted-foreground">{lesson.description}</p>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
