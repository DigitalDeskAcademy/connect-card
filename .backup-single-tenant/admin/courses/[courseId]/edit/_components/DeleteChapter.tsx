/**
 * Delete Chapter Component - Secure chapter deletion with cascading lesson removal
 *
 * Provides safe deletion workflow for chapters with comprehensive confirmation dialog.
 * Implements cascading deletion to remove all associated lessons and maintains data integrity.
 * Critical component for course content management with emphasis on preventing accidental deletions.
 *
 * Admin Workflow:
 * - Contextual delete button within chapter management interface
 * - Two-step confirmation process with explicit warning about cascading effects
 * - Clear indication that all lessons within chapter will be permanently deleted
 * - Loading states with visual feedback during async deletion operations
 * - Automatic UI updates reflecting successful deletion via toast notifications
 *
 * Data Safety Features:
 * - Prominent alert dialog with destructive action confirmation
 * - Clear messaging about permanent deletion and inability to undo
 * - Explicit warning about cascading lesson deletion for informed consent
 * - Server-side validation ensuring proper authorization and data integrity
 * - Transactional deletion process maintaining database consistency
 *
 * User Experience:
 * - Intuitive trash icon trigger for familiar deletion patterns
 * - Accessible alert dialog with keyboard navigation support
 * - Cancel option prominently displayed for easy dismissal
 * - Loading states preventing double-submission and providing feedback
 * - Success/error messaging with toast notifications for clear outcomes
 *
 * Technical Implementation:
 * - AlertDialog component for accessible confirmation patterns
 * - React transitions for non-blocking UI updates during async operations
 * - Comprehensive error handling with user-friendly messaging
 * - Server action integration with proper authorization checks
 * - State management for modal control and loading states
 *
 * Security Considerations:
 * - Requires admin authorization for deletion operations
 * - Server-side validation of chapter ownership and course association
 * - Transactional deletion ensuring data consistency
 * - Proper error handling preventing sensitive information exposure
 */

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
import { deleteChapter } from "../actions";

/**
 * Delete Chapter Component
 *
 * Handles secure chapter deletion with cascading lesson removal and confirmation dialog.
 * Maintains data integrity while providing clear feedback about destructive operations.
 *
 * @param chapterId - Unique identifier of the chapter to delete
 * @param courseId - Parent course ID for authorization and data validation
 */
export function DeleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        deleteChapter({ chapterId, courseId })
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
        <Button variant="outline" size="icon">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            chapter and all its lessons from the course.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={onSubmit} disabled={pending} variant="destructive">
            {pending ? "Deleting..." : "DELETE"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
