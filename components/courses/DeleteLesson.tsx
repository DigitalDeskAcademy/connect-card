/**
 * Delete Lesson Component - Secure individual lesson deletion within course structure
 *
 * Shared component for deleting lessons in both platform and agency contexts.
 * Follows callback pattern for multi-tenant compatibility.
 *
 * Admin Workflow:
 * - Contextual delete button positioned within lesson listing interface
 * - Single-step confirmation dialog with clear warning about permanent deletion
 * - Visual feedback during async deletion with loading states
 * - Automatic UI refresh reflecting lesson removal from course structure
 * - Toast notifications providing clear success/error feedback
 *
 * Content Management Features:
 * - Granular lesson deletion without affecting sibling lessons or parent chapter
 * - Maintains proper lesson ordering after deletion via automatic position adjustment
 * - Preserves chapter structure and course hierarchy during individual lesson removal
 * - Server-side validation ensuring proper lesson ownership and authorization
 * - Clean removal of associated lesson content and media references
 *
 * User Experience:
 * - Subtle ghost button styling appropriate for secondary destructive actions
 * - Accessible confirmation dialog with clear messaging about permanent deletion
 * - Intuitive cancel option for easy dismissal of accidental deletion attempts
 * - Loading states preventing double-submission during async operations
 * - Consistent visual patterns with chapter deletion for familiar admin experience
 *
 * Technical Implementation:
 * - Multi-ID parameter structure (courseId, chapterId, lessonId) for proper authorization
 * - React transitions enabling non-blocking UI updates during deletion
 * - Comprehensive error handling with graceful fallback messaging
 * - Callback pattern for multi-tenant server action integration
 * - State management for modal control and async operation feedback
 *
 * Security & Data Integrity:
 * - Triple-ID validation ensuring lesson belongs to specified course and chapter
 * - Admin authorization required for lesson deletion operations
 * - Transactional deletion maintaining database consistency
 * - Proper error handling preventing sensitive information disclosure
 * - Automatic position recalculation for remaining lessons in chapter
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import { ApiResponse } from "@/lib/types";

interface DeleteLessonProps {
  chapterId: string;
  courseId: string;
  lessonId: string;
  onDelete: (data: {
    chapterId: string;
    courseId: string;
    lessonId: string;
  }) => Promise<ApiResponse>;
}

/**
 * Delete Lesson Component
 *
 * Handles secure individual lesson deletion with confirmation dialog and data integrity.
 * Accepts onDelete callback for multi-tenant compatibility.
 *
 * @param chapterId - Parent chapter ID for authorization and structural validation
 * @param courseId - Parent course ID for ownership verification and data integrity
 * @param lessonId - Unique identifier of the specific lesson to delete
 * @param onDelete - Callback function to handle lesson deletion (platform/agency specific)
 */
export function DeleteLesson({
  chapterId,
  courseId,
  lessonId,
  onDelete,
}: DeleteLessonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleDelete() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        onDelete({ chapterId, courseId, lessonId })
      );
      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }
      if (result && result.status === "success") {
        toast.success(result.message);
        setOpen(false);
      } else if (result && result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            lesson and remove it from the course.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={pending}
            variant="destructive"
          >
            {pending ? "Deleting..." : "DELETE"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
