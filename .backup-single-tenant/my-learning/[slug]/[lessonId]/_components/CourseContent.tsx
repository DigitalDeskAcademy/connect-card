/**
 * CourseContent - Main lesson viewing component with video player and completion tracking
 *
 * Renders the primary lesson interface including video playback, completion controls,
 * and rich text content display. Handles lesson progress state management with confetti
 * celebrations and toast notifications for enhanced student engagement.
 *
 * Features:
 * - Video player with multiple format support and fallback UI
 * - Interactive completion buttons with optimistic UI updates
 * - Rich text description rendering with Tiptap JSON support
 * - Error handling with user-friendly feedback
 * - Confetti celebrations for lesson completion milestones
 *
 * @component
 * @param {Object} props - Component properties
 * @param {LessonContentType} props.data - Complete lesson data with progress and course context
 * @param {string} props.data.id - Lesson identifier for progress tracking
 * @param {string} props.data.title - Lesson display title
 * @param {string|null} props.data.description - Optional rich text lesson description (JSON format)
 * @param {string|null} props.data.thumbnailKey - S3/Tigris storage key for video poster image
 * @param {string|null} props.data.videoKey - S3/Tigris storage key for lesson video content
 * @param {Object} props.data.Chapter - Parent chapter with course context for navigation
 * @param {Object} props.data.Chapter.Course - Course information for URL routing
 * @param {string} props.data.Chapter.Course.slug - Course slug for revalidation paths
 * @param {Array} props.data.lessonProgress - Student progress records (empty array = incomplete)
 *
 * @returns {JSX.Element} Video player interface with completion controls and content description
 *
 * @example
 * <CourseContent
 *   data={{
 *     id: "lesson-123",
 *     title: "Introduction to React",
 *     description: '{"type":"doc","content":[...]}',
 *     videoKey: "videos/lesson-123.mp4",
 *     thumbnailKey: "thumbnails/lesson-123.jpg",
 *     Chapter: { Course: { slug: "react-fundamentals" } },
 *     lessonProgress: []
 *   }}
 * />
 */
"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle } from "lucide-react";
import { useTransition } from "react";
import { markLessonComplete, markLessonIncomplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";

interface iAppProps {
  data: LessonContentType;
}

export function CourseContent({ data }: iAppProps) {
  const [pending, startTransition] = useTransition(); // Loading state for completion actions
  const { triggerConfetti } = useConfetti(); // Celebration animations for milestone achievements

  /**
   * VideoPlayer - Embedded video component with fallback UI for missing content
   *
   * Renders HTML5 video player with multiple format support and poster image,
   * or displays placeholder UI when video content is not yet available.
   *
   * @param {Object} props - Video player properties
   * @param {string} props.thumbnailKey - S3 storage key for poster image
   * @param {string} props.videoKey - S3 storage key for video file
   * @returns {JSX.Element} Video player or placeholder UI
   */
  function VideoPlayer({
    thumbnailKey,
    videoKey,
  }: {
    thumbnailKey: string;
    videoKey: string;
  }) {
    const videoUrl = useConstructUrl(videoKey); // Convert S3 key to full URL
    const thumbnailUrl = useConstructUrl(thumbnailKey); // Convert thumbnail key to full URL

    // Display placeholder when video content is not available
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

    // HTML5 video player with multiple format support for browser compatibility
    return (
      <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
        <video
          className="w-full h-full object-cover"
          controls
          poster={thumbnailUrl} // Poster image displayed before video loads
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  /**
   * onSubmit - Mark lesson as complete with celebration and progress tracking
   *
   * Handles lesson completion workflow including database updates, cache revalidation,
   * user feedback via toast notifications, and confetti celebration animations.
   * Uses optimistic UI patterns with loading states during server actions.
   */
  function onSubmit() {
    startTransition(async () => {
      // Execute lesson completion server action with error boundary
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, data.Chapter.Course.slug)
      );

      // Handle unexpected errors (network issues, server errors)
      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      // Process server action response and provide user feedback
      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti(); // Celebrate milestone achievement with animation
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  /**
   * onUndoSubmit - Mark lesson as incomplete and revert progress state
   *
   * Allows students to undo lesson completion for review or re-learning purposes.
   * Removes progress record from database and updates UI to reflect incomplete state.
   */
  function onUndoSubmit() {
    startTransition(async () => {
      // Execute lesson incompletion server action with error boundary
      const { data: result, error } = await tryCatch(
        markLessonIncomplete(data.id, data.Chapter.Course.slug)
      );

      // Handle unexpected errors (network issues, server errors)
      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      // Process server action response and provide user feedback
      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-background pl-6">
      {/* Video player section with S3-hosted content */}
      <VideoPlayer
        thumbnailKey={data.thumbnailKey ?? ""}
        videoKey={data.videoKey ?? ""}
      />

      {/* Completion control section with dynamic button states */}
      <div className="py-4 border-b">
        {/* Conditional rendering based on lesson progress state */}
        {data.lessonProgress.length > 0 ? (
          // Completed state button - allows undoing completion
          <Button
            variant="outline"
            className="bg-green-500/10 text-green-500 hover:text-green-600"
            onClick={onUndoSubmit}
            disabled={pending} // Disabled during server action processing
          >
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Completed
          </Button>
        ) : (
          // Incomplete state button - allows marking as complete
          <Button variant="outline" onClick={onSubmit} disabled={pending}>
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Mark as Complete
          </Button>
        )}
      </div>

      {/* Lesson content section with title and rich text description */}
      <div className="space-y-3 pt-3">
        {/* Primary lesson title for student context */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {data.title}
        </h1>

        {/* Rich text description with JSON parsing fallback */}
        {data.description && (
          <div>
            {(() => {
              try {
                // Attempt to parse and render Tiptap JSON format
                return (
                  <RenderDescription json={JSON.parse(data.description)} />
                );
              } catch {
                // Fallback for plain text descriptions from legacy content
                return (
                  <p className="text-muted-foreground">{data.description}</p>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
