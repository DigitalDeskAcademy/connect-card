/**
 * Admin Enrollment Button - Direct course enrollment for testing and administration
 *
 * Provides admin users with the ability to manually enroll in courses for testing,
 * preview, and administrative purposes. Integrates with the same enrollment system
 * used by regular students while providing admin-specific feedback.
 *
 * Admin Workflow:
 * - One-click enrollment for course testing and preview access
 * - Real-time feedback via toast notifications for enrollment status
 * - Loading states with visual indicators for async operations
 * - Error handling with user-friendly messaging for admin debugging
 *
 * Business Operations:
 * - Course quality assurance through admin enrollment
 * - Testing enrollment workflows before student access
 * - Administrative course access for content review
 * - Integration with Stripe payment processing (test mode)
 *
 * Technical Implementation:
 * - Uses React transitions for non-blocking UI updates
 * - Comprehensive error handling with tryCatch wrapper
 * - Optimistic UI patterns with loading states
 * - Server action integration for secure enrollment processing
 *
 * Security Considerations:
 * - Admin authentication required for enrollment access
 * - Server-side validation of enrollment permissions
 * - Proper error handling to prevent sensitive data exposure
 */

"use client";

import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useTransition } from "react";
import { enrollInCourseAction } from "@/app/(public)/courses/[slug]/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiResponse } from "@/lib/types";

/**
 * Admin Enrollment Button Component
 *
 * Handles manual course enrollment for administrative testing and preview access.
 * Provides immediate feedback and error handling for admin operations.
 *
 * @param courseId - Unique identifier for the course to enroll in
 */
export function EnrollmentButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch<ApiResponse>(
        enrollInCourseAction(courseId)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result?.status === "success") {
        toast.success(result.message);
      } else if (result?.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button onClick={onSubmit} disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Enroll Now!"
      )}
    </Button>
  );
}
