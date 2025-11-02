"use server";

import { requireChurchAdmin } from "@/app/data/church/require-church-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { placeholderCourseThumbnail } from "@/lib/constants/placeholder-assets";

/**
 * Configure Arcjet rate limiting for agency course creation
 * Limits: 5 course creations per minute per agency admin
 * Uses combined userId_organizationId fingerprint for multi-tenant isolation
 */
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

/**
 * Server action to create a new course for an agency
 *
 * Key differences from platform course creation:
 * - Uses requireChurchAdmin for organization-scoped authentication
 * - Automatically sets organizationId for multi-tenant data isolation
 * - No Stripe product creation (agencies use subscription model)
 * - Rate limiting uses combined fingerprint for per-organization limits
 *
 * @param slug - Organization slug from URL
 * @param values - Course form data from the agency admin UI
 * @returns ApiResponse with success/error status and message
 */
export async function createAgencyCourse(
  slug: string,
  values: CourseSchemaType
): Promise<ApiResponse> {
  // Ensure only authenticated agency admins can create courses
  const { session, organization } = await requireChurchAdmin(slug);

  try {
    // Set up rate limiting protection with multi-tenant fingerprint
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: `${session.user.id}_${organization.id}`, // Per-org rate limiting
    });

    // Check if request was denied by rate limiting
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "Rate limit exceeded. Please try again later.",
        };
      } else {
        // Bot detection triggered
        return {
          status: "error",
          message: "Request blocked for security reasons.",
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
     * Create agency course with automatic organization scoping
     * Key differences from platform courses:
     * - organizationId is always set (CRITICAL for multi-tenancy)
     * - stripePriceId is always null (subscription model)
     * - isFree is always true (included in subscription)
     */
    await prisma.course.create({
      data: {
        ...validation.data,
        // Use placeholder if no fileKey provided
        fileKey: validation.data.fileKey || placeholderCourseThumbnail,
        userId: session.user.id, // Link to admin who created it
        organizationId: organization.id, // CRITICAL: Scope to organization
        stripePriceId: null, // Agencies use subscription model
        isFree: true, // Always free within subscription
      },
    });

    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch {
    // Generic error handling - no console.error per coding patterns
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}
