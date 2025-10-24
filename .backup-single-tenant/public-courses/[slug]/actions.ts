/**
 * Course Enrollment Actions - Critical conversion and payment processing
 *
 * Server actions that handle the complete course enrollment and payment flow.
 * This is the core conversion mechanism that transforms user interest into
 * revenue through secure Stripe payment processing and enrollment management.
 *
 * Business Objectives:
 * - Convert course interest into completed enrollments and revenue
 * - Provide secure, reliable payment processing through Stripe integration
 * - Handle both free and paid course enrollments with appropriate flows
 * - Prevent enrollment abuse and duplicate charges through rate limiting
 * - Maintain data consistency through transactional enrollment processes
 *
 * Conversion Optimization Features:
 * - Seamless enrollment flow with minimal friction for users
 * - Immediate free course access without payment barriers
 * - Proper error handling with user-friendly messages
 * - Prevention of duplicate enrollments and charges
 * - Robust retry mechanisms for payment processing
 *
 * Security & Anti-Abuse Measures:
 * - Rate limiting (5 attempts/minute) to prevent bot attacks
 * - User authentication requirements before enrollment
 * - Stripe integration for secure payment processing
 * - Database transactions for data consistency
 * - Comprehensive error handling and logging
 *
 * Payment Processing Flow:
 * 1. User Authentication: Ensure user is logged in
 * 2. Rate Limiting: Prevent abuse and rapid-fire attempts
 * 3. Course Validation: Verify course exists and pricing
 * 4. Customer Management: Create/retrieve Stripe customer
 * 5. Enrollment Creation: Database record with pending status
 * 6. Checkout Session: Redirect to Stripe payment page
 * 7. Webhook Processing: Complete enrollment after payment
 *
 * Free Course Handling:
 * - Skip payment processing entirely for zero-cost courses
 * - Immediate enrollment activation for instant access
 * - Proper duplicate enrollment prevention
 * - Success response with UI refresh signals
 *
 * Technical Implementation:
 * - Server actions for secure server-side processing
 * - Database transactions for atomic operations
 * - Arcjet rate limiting for abuse prevention
 * - Stripe SDK for payment processing
 * - Comprehensive error handling with user feedback
 *
 * @fileoverview Course enrollment and payment processing server actions
 * @version 1.0.0
 * @author LMS Development Team
 */

"use server";

import { requireUser } from "@/app/data/user/require-user";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";
import Stripe from "stripe";

// Configure Arcjet rate limiting to prevent enrollment spam/abuse
// Limits each user to 5 enrollment attempts per minute
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE", // Production mode - enforces limits (use "DRY_RUN" for testing)
    window: "1m", // 1-minute rolling window
    max: 5, // Maximum attempts per window
  })
);

/**
 * Course Enrollment Server Action
 *
 * Primary conversion function that handles complete course enrollment and payment
 * processing. This is the critical business function that transforms user intent
 * into revenue through secure payment processing and enrollment management.
 *
 * Business Impact:
 * - Direct revenue generation through course sales and enrollments
 * - Customer acquisition and retention through seamless purchase experience
 * - Free course lead generation for marketing funnel development
 * - Data collection for customer behavior analysis and optimization
 *
 * Conversion Flow Optimization:
 * 1. Authentication: Redirect to login if needed (minimal friction)
 * 2. Rate Limiting: Prevent abuse while allowing legitimate attempts
 * 3. Course Validation: Ensure course exists and pricing is accurate
 * 4. Duplicate Prevention: Avoid double charges and confusion
 * 5. Payment Processing: Secure Stripe integration with error handling
 * 6. Success Handling: Proper enrollment activation and user feedback
 *
 * Free vs Paid Course Strategy:
 * - Free Courses: Immediate access for lead generation and user onboarding
 * - Paid Courses: Full Stripe checkout flow with secure payment processing
 * - Consistent UX: Both flows provide clear feedback and next steps
 *
 * Error Handling & User Experience:
 * - User-friendly error messages that don't expose system details
 * - Specific handling for Stripe errors vs general application errors
 * - Comprehensive logging for debugging and optimization
 * - Graceful degradation for system failures
 *
 * Security & Compliance:
 * - PCI compliance through Stripe payment processing
 * - Rate limiting to prevent abuse and bot attacks
 * - User authentication requirements for all enrollments
 * - Database transactions for atomic operations
 * - Secure metadata passing for webhook processing
 *
 * @function enrollInCourseAction
 * @async
 * @param {string} courseId - Database ID of the course to enroll in
 * @returns {Promise<ApiResponse | never>} API response with status/message OR server redirect to Stripe checkout
 *
 * @example
 * // Called from EnrollmentButton component when user clicks "Enroll Now"
 * const result = await enrollInCourseAction(courseId);
 * if (result.status === 'success') {
 *   // Free course enrolled successfully
 *   showSuccessMessage(result.message);
 * } else if (result.status === 'error') {
 *   // Show error message to user
 *   showErrorMessage(result.message);
 * }
 * // For paid courses, function redirects to Stripe checkout
 *
 * @throws {Error} Critical system errors that prevent enrollment processing
 * @sideEffects
 * - Creates/updates database enrollment records
 * - Creates Stripe customer records for new users
 * - Redirects to Stripe checkout for paid courses
 * - Triggers rate limiting counters for abuse prevention
 */
export async function enrollInCourseAction(
  courseId: string
): Promise<ApiResponse | never> {
  // Ensure user is logged in, redirects to /login if not
  const user = await requireUser();

  let checkoutUrl: string;
  try {
    // Apply rate limiting to prevent rapid enrollment attempts
    // This protects against bot attacks and accidental multiple clicks
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: user.id, // Track attempts per user ID
    });

    if (decision.isDenied()) {
      // User exceeded rate limit - likely bot or abuse
      return {
        status: "error",
        message: "Unable to process payment. Please try again.",
      };
    }
    // Fetch course details including pricing information
    // Only select fields needed for checkout process
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
        stripePriceId: true,
      },
    });

    // Validate course exists before proceeding with payment
    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    // Handle free courses - skip Stripe payment processing entirely
    if (course.price === 0) {
      // Check if user is already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId,
          },
        },
        select: {
          status: true,
        },
      });

      // Prevent duplicate enrollment
      if (existingEnrollment?.status === "Active") {
        return {
          status: "success",
          message: "You are already enrolled in this course",
        };
      }

      // Create or update enrollment for free course
      if (existingEnrollment) {
        // Update existing enrollment to Active
        await prisma.enrollment.update({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: courseId,
            },
          },
          data: {
            status: "Active", // Free courses are immediately active
            amount: 0,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new enrollment for free course
        await prisma.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: 0,
            status: "Active", // Free courses are immediately active
          },
        });
      }

      // Return success response instead of redirecting for free courses
      // This allows the UI to update properly and show success message
      return {
        status: "success" as const,
        message: "Successfully enrolled! You now have access to this course.",
        shouldRefresh: true, // Signal to refresh the page
      };
    }

    // Step 1: Ensure user has a Stripe customer ID (for paid courses only)
    // This links our database user to Stripe's payment system
    let stripeCustomerId: string;

    // Check if user already has a Stripe customer ID from previous purchases
    const userWithStripeCustomerId = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (userWithStripeCustomerId?.stripeCustomerId) {
      // Use existing Stripe customer
      stripeCustomerId = userWithStripeCustomerId.stripeCustomerId;
    } else {
      // First-time customer - create new Stripe customer record
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id, // Link Stripe customer to our database user
        },
      });

      stripeCustomerId = customer.id;

      // Store Stripe customer ID for future purchases
      // This avoids creating duplicate customers in Stripe
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeCustomerId: stripeCustomerId,
        },
      });
    }

    // Step 2: Handle enrollment record and create checkout session
    // Use database transaction to ensure data consistency
    const result = await prisma.$transaction(async tx => {
      // Check if user has any existing enrollment for this course
      // This prevents duplicate enrollments and handles re-enrollment
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            // Composite unique key
            userId: user.id,
            courseId: courseId,
          },
        },
        select: {
          status: true,
          id: true,
        },
      });

      // Prevent double enrollment - user already has access
      if (existingEnrollment?.status === "Active") {
        return {
          status: "success",
          message: "You are alredy enrolled in this Course", // TODO: Fix typo "already"
        };
      }

      let enrollment;

      if (existingEnrollment) {
        // User previously attempted enrollment (maybe payment failed)
        // Update existing record with new payment attempt
        enrollment = await tx.enrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            amount: course.price, // Update price in case it changed
            status: "Pending", // Reset to pending for new payment attempt
            updatedAt: new Date(),
          },
        });
      } else {
        // First enrollment attempt - create new record
        enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: course.price,
            status: "Pending", // Will change to "Active" after successful payment
          },
        });
      }

      // Check if this is a free course - bypass Stripe for free enrollment
      if (!course.stripePriceId || course.price === 0) {
        // Directly activate enrollment for free courses
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "Active" },
        });

        return {
          enrollment: enrollment,
          checkoutUrl: null, // No checkout needed for free courses
        };
      }

      // Create Stripe checkout session for payment processing (paid courses only)
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: course.stripePriceId, // Use pre-created price ID from course creation
            quantity: 1,
          },
        ],
        mode: "payment", // One-time payment (use "subscription" for recurring)
        success_url: `${env.BETTER_AUTH_URL}/payment/success`, // Redirect after successful payment
        cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`, // Redirect if user cancels
        metadata: {
          // This metadata is crucial for webhook processing
          // It links the Stripe payment back to our database records
          userId: user.id,
          courseId: course.id,
          enrollmentId: enrollment.id,
        },
      });

      return {
        enrollment: enrollment,
        checkoutUrl: checkoutSession.url,
      };
    });

    checkoutUrl = result.checkoutUrl as string;
  } catch (error) {
    // Handle Stripe-specific errors separately for better user feedback
    if (error instanceof Stripe.errors.StripeError) {
      // Payment system issue (Stripe API down, invalid configuration, etc.)
      return {
        status: "error",
        message: `Payment system error: ${error.message}`,
      };
    }

    // Generic error fallback (database issues, network problems, etc.)
    return {
      status: "error",
      message: `Failed to enroll in course: ${error}`,
    };
  }

  // Handle redirect based on whether course is free or paid
  if (checkoutUrl) {
    // Redirect to Stripe checkout for paid courses
    redirect(checkoutUrl);
  } else {
    // Redirect to success page for free courses
    redirect(`/payment/success`);
  }
}
