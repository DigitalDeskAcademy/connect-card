/**
 * Delete Course Confirmation Component - Shared course deletion interface
 *
 * Provides a confirmation dialog for permanently deleting courses in both
 * platform and agency contexts. Follows callback pattern for multi-tenant compatibility.
 *
 * User Experience:
 * - Centered card layout with clear warning messaging
 * - Type-to-confirm safety mechanism (must type course slug)
 * - Destructive action styling for delete button
 * - Loading states with visual feedback during async operations
 * - Cancel option for easy dismissal
 * - Celebratory confetti on successful deletion
 *
 * Technical Implementation:
 * - React transitions for non-blocking UI updates
 * - Callback pattern for platform/agency specific server actions
 * - Comprehensive error handling with user-friendly messaging
 * - Automatic navigation after successful deletion
 *
 * Security:
 * - Requires explicit user confirmation before deletion (type course slug)
 * - Server-side validation of ownership and authorization
 * - Transactional deletion maintaining database consistency
 * - Rate limiting on delete operations
 */

"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import type { ApiResponse } from "@/lib/types";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { deleteCourse, OrganizationContext } from "@/actions/delete-course";

interface DeleteCourseConfirmationProps {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  organizationContext: OrganizationContext;
  cancelHref: string;
  redirectPath: string;
  cardDescription?: string;
  deleteButtonText?: string;
}

/**
 * Delete Course Confirmation Component
 *
 * Confirmation interface for course deletion with type-to-confirm safety mechanism.
 * Follows ADR-001: Direct server action imports with context parameters.
 *
 * @param courseId - ID of the course to delete
 * @param courseTitle - Name of the course being deleted (shown in warning)
 * @param courseSlug - Slug that must be typed to confirm deletion
 * @param organizationContext - Platform or agency context (data, not callback)
 * @param cancelHref - URL for cancel button navigation
 * @param redirectPath - Path to redirect after successful deletion
 * @param cardDescription - Custom warning message for the confirmation dialog
 * @param deleteButtonText - Text for the delete button
 */
export function DeleteCourseConfirmation({
  courseId,
  courseTitle,
  courseSlug,
  organizationContext,
  cancelHref,
  redirectPath,
  cardDescription = "This action cannot be undone. This will permanently delete the course and all of its content.",
  deleteButtonText = "Delete Course",
}: DeleteCourseConfirmationProps) {
  const [pending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();
  const { triggerConfetti } = useConfetti();

  const isConfirmed = confirmText === courseSlug;

  function handleSubmit() {
    if (!isConfirmed) {
      toast.error("Please type the course slug to confirm deletion");
      return;
    }

    startTransition(async () => {
      // Direct action call with context parameter (ADR-001 pattern)
      const { data: result, error } = await tryCatch(
        deleteCourse({ courseId, context: organizationContext })
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      const typedResult = result as ApiResponse;
      if (typedResult.status === "success") {
        toast.success(typedResult.message);
        triggerConfetti();
        router.push(redirectPath);
      } else if (typedResult.status === "error") {
        toast.error(typedResult.message);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <Card className="mt-32 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            Delete Course
          </CardTitle>
          <CardDescription className="text-base">
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course being deleted */}
          <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
            <p className="text-sm text-muted-foreground mb-1">
              Course to be deleted:
            </p>
            <p className="font-semibold text-lg">{courseTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Slug: <code className="font-mono">{courseSlug}</code>
            </p>
          </div>

          {/* Warning message */}
          <div className="space-y-2">
            <p className="text-sm font-medium">This will permanently delete:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>All course content and metadata</li>
              <li>All chapters and lessons</li>
              <li>All videos and thumbnails from storage</li>
              <li>All student enrollment and progress data</li>
            </ul>
          </div>

          {/* Type to confirm */}
          <div className="space-y-2">
            <Label htmlFor="confirm-slug">
              Type <code className="font-mono font-semibold">{courseSlug}</code>{" "}
              to confirm deletion
            </Label>
            <Input
              id="confirm-slug"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={courseSlug}
              disabled={pending}
              className="font-mono"
              autoComplete="off"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={cancelHref}
            >
              Cancel
            </Link>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!isConfirmed || pending}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  {deleteButtonText}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
