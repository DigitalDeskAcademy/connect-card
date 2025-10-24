"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";

import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";

/**
 * Configure Arcjet rate limiting for course creation
 * Limits: 5 course creations per minute per admin user
 * This prevents abuse and accidental duplicate submissions
 */
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

/**
 * Server action to create a new course with Stripe product integration
 *
 * This function:
 * 1. Validates admin authorization
 * 2. Enforces rate limiting to prevent abuse
 * 3. Validates form data against the course schema
 * 4. Creates a Stripe product with pricing (for payment processing)
 * 5. Saves the course to the database with Stripe price ID reference
 *
 * @param values - Course form data from the admin UI
 * @returns ApiResponse with success/error status and message
 */
export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  // Ensure only authenticated admins can create courses
  const session = await requireAdmin();

  try {
    // Set up rate limiting protection
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id, // Track rate limits per admin user
    });

    // Check if request was denied by rate limiting
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You have been blocked due to rate limiting",
        };
      } else {
        // Bot detection triggered
        return {
          status: "error",
          message: "You are a bot! if this is a mistake contact our support",
        };
      }
    }

    // Validate form data against Zod schema
    const validation = courseSchema.safeParse(values);

    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid Form Data",
      };
    }

    /**
     * Conditionally create Stripe product for paid courses
     * Free courses (price = 0) don't need Stripe products
     * This aligns with B2B subscription model where courses are free within subscription
     */
    let stripePriceId: string | null = null;

    if (validation.data.price > 0) {
      const data = await stripe.products.create({
        name: validation.data.title,
        description: validation.data.smallDescription,
        default_price_data: {
          currency: "usd",
          unit_amount: validation.data.price * 100, // Convert dollars to cents for Stripe
        },
      });
      stripePriceId = data.default_price as string;
    }

    /**
     * Save course to database
     * Links the course to:
     * - The admin who created it (userId)
     * - The Stripe price ID for checkout sessions (if paid course)
     */
    await prisma.course.create({
      data: {
        ...validation.data, // Spread all validated course fields
        userId: session?.user.id as string, // Link to admin creator
        stripePriceId, // Store Stripe price ID (null for free courses)
        isFree: validation.data.price === 0, // Mark as free if price is 0
      },
    });

    return {
      status: "success",
      message: "Course created succesfully",
    };
  } catch {
    // Generic error handling - could be improved with specific error types
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}
