/**
 * Enrollment Button - Primary conversion call-to-action component
 *
 * Critical conversion component that serves as the primary call-to-action for course
 * enrollment. Optimized for maximum conversion rates with compelling messaging,
 * visual feedback, error handling, and seamless payment flow integration.
 *
 * Business Objectives:
 * - Drive course enrollments and revenue through compelling CTA design
 * - Provide seamless user experience from interest to enrollment completion
 * - Handle both free and paid course enrollment flows transparently
 * - Build user confidence through clear loading states and error handling
 * - Maximize conversion rates through optimized button design and messaging
 *
 * Conversion Optimization Features:
 * - Compelling CTA text: "Enroll Now!" creates urgency and clear action
 * - Full-width button design for maximum clickable area and prominence
 * - Loading states with spinner to prevent confusion during processing
 * - Immediate feedback through toast notifications for user reassurance
 * - Automatic UI refresh for free course enrollments to show instant access
 * - Disabled state during processing to prevent duplicate submissions
 *
 * User Experience Strategy:
 * - Clear visual feedback for all interaction states (normal, loading, disabled)
 * - Optimistic UI updates that provide immediate user feedback
 * - Comprehensive error handling with user-friendly messages
 * - Seamless redirect handling for paid course Stripe checkout
 * - Professional loading animations that maintain user engagement
 *
 * Technical Implementation:
 * - React useTransition for non-blocking state updates
 * - Client-side component for interactive functionality
 * - Server action integration for secure enrollment processing
 * - Toast notifications for user feedback and error handling
 * - Router integration for page refresh and navigation
 * - Error boundary handling for unexpected failures
 *
 * Payment Flow Integration:
 * - Free Courses: Immediate enrollment with success feedback and UI refresh
 * - Paid Courses: Redirect to Stripe checkout with seamless flow
 * - Error Handling: User-friendly messages for payment failures
 * - Loading States: Clear feedback during payment processing
 *
 * Accessibility Considerations:
 * - Semantic button element for proper screen reader support
 * - Disabled state communicated to assistive technologies
 * - Loading state with accessible text and visual indicators
 * - High contrast design for visual accessibility
 * - Keyboard navigation support through native button element
 *
 * @component EnrollmentButton
 * @param {Object} props - Component properties
 * @param {string} props.courseId - Database ID of the course to enroll in
 * @returns {JSX.Element} Interactive enrollment button with loading states
 *
 * @example
 * // Used in course detail page enrollment card
 * <EnrollmentButton courseId={course.id} />
 *
 * // User interaction flow:
 * // 1. User clicks "Enroll Now!" button
 * // 2. Button shows loading spinner and "Loading..." text
 * // 3. Server action processes enrollment
 * // 4. For free courses: Success toast + page refresh
 * // 5. For paid courses: Redirect to Stripe checkout
 * // 6. For errors: Error toast with helpful message
 */

"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { enrollInCourseAction } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Enrollment Button Component
 *
 * Core conversion component that handles enrollment initiation with optimal
 * user experience, comprehensive error handling, and seamless payment flow.
 *
 * State Management:
 * - useTransition: Non-blocking UI updates during enrollment processing
 * - Router: Page navigation and refresh for free course enrollments
 * - Toast: User feedback and error messaging system
 *
 * Conversion Flow:
 * 1. User clicks enrollment button
 * 2. Loading state activates with visual feedback
 * 3. Server action processes enrollment and payment
 * 4. Success/error feedback through toast notifications
 * 5. UI updates or redirects based on course type
 *
 * @param {Object} props - Component properties
 * @param {string} props.courseId - Course database ID for enrollment
 * @returns {JSX.Element} Interactive enrollment button with states
 */
export function EnrollmentButton({ courseId }: { courseId: string }) {
  // Non-blocking transition for better UX during enrollment processing
  const [pending, startTransition] = useTransition();

  // Router for page refresh after free course enrollment
  const router = useRouter();

  /**
   * Enrollment Submission Handler
   *
   * Handles the complete enrollment flow with proper error handling,
   * user feedback, and state management. Optimized for conversion
   * with clear loading states and immediate feedback.
   *
   * Flow Logic:
   * - Free Courses: Returns success response → Toast + Page refresh
   * - Paid Courses: Redirects to Stripe → Handled by Next.js navigation
   * - Errors: Shows user-friendly error messages via toast
   *
   * Error Handling Strategy:
   * - Enrollment errors: Display specific error messages to user
   * - Redirect errors: Let Next.js handle navigation (expected behavior)
   * - System errors: Generic user-friendly fallback message
   *
   * UX Considerations:
   * - Loading state prevents multiple submissions
   * - Immediate feedback builds user confidence
   * - Page refresh shows updated enrollment status
   * - Error messages provide actionable guidance
   */
  function onSubmit() {
    startTransition(async () => {
      try {
        // Call server action to process enrollment
        const result = await enrollInCourseAction(courseId);

        // Handle responses (only free courses return here; paid courses redirect)
        if (result.status === "success") {
          // Show success feedback for free course enrollment
          toast.success(result.message);

          // Refresh page to show updated UI (enrolled state)
          if (result.shouldRefresh) {
            router.refresh();
          }
        } else if (result.status === "error") {
          // Display enrollment error to user
          toast.error(result.message);
        }
      } catch (error) {
        // Error handling for unexpected failures and redirects
        // NEXT_REDIRECT is expected behavior for paid courses - don't show error
        if (
          error instanceof Error &&
          !error.message.includes("NEXT_REDIRECT")
        ) {
          // Show generic error for unexpected failures
          toast.error("An unexpected error occurred. Please try again.");
        }
        // NEXT_REDIRECT errors are handled by Next.js navigation system
      }
    });
  }

  return (
    /* Primary Enrollment CTA - Conversion-optimized button design */
    <Button onClick={onSubmit} disabled={pending} className="w-full">
      {pending ? (
        /* Loading State - Clear feedback during enrollment processing */
        <>
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </>
      ) : (
        /* Default State - Compelling call-to-action text */
        "Start Course"
      )}
    </Button>
  );
}
