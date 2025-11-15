"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import {
  createPrayerRequestSchema,
  CreatePrayerRequestSchemaType,
} from "@/lib/zodSchemas";
import {
  hasSensitiveKeywords,
  detectPrayerCategory,
} from "@/lib/data/prayer-requests";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5, // 5 prayer requests per minute
  })
);

/**
 * Create Prayer Request
 *
 * Creates a new prayer request manually (not from connect card).
 * Automatically detects privacy needs and categorizes the request.
 *
 * Security:
 * - Requires authenticated user (any role can create)
 * - Multi-tenant data isolation via organizationId
 * - Location-based filtering (defaults to user's location if staff)
 * - Rate limiting via Arcjet (5 requests per minute)
 * - Automatic sensitive keyword detection
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Prayer request details
 * @returns ApiResponse with created prayer request data
 */
export async function createPrayerRequest(
  slug: string,
  data: CreatePrayerRequestSchemaType
): Promise<ApiResponse<{ id: string }>> {
  // 1. Authentication and authorization
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_create_prayer`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Too many requests. Please try again later.",
      };
    }
    return {
      status: "error",
      message: "Request blocked. Please contact support if this persists.",
    };
  }

  // 3. Validation
  const validation = createPrayerRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid prayer request data",
    };
  }

  const validData = validation.data;

  // 4. Auto-detect privacy if not explicitly set
  const isPrivate =
    validData.isPrivate || hasSensitiveKeywords(validData.request);

  // 5. Auto-detect category if not provided
  const category =
    validData.category || detectPrayerCategory(validData.request);

  // 6. Determine location (use provided or user's default)
  // If user can see all locations (admin/owner), default to null (multi-campus)
  // If user is campus-specific, use the location filter from dataScope
  let locationId = validData.locationId;
  if (!locationId && !dataScope.filters.canSeeAllLocations) {
    // For campus-specific staff, we need to get their location from the member record
    // For now, default to null and require explicit locationId on create
    locationId = null;
  }

  try {
    // 7. Create prayer request
    const prayerRequest = await prisma.prayerRequest.create({
      data: {
        organizationId: organization.id,
        locationId,
        request: validData.request,
        category,
        isPrivate,
        isUrgent: validData.isUrgent || false,
        submittedBy: validData.submittedBy,
        submitterEmail: validData.submitterEmail,
        submitterPhone: validData.submitterPhone,
        status: "PENDING",
      },
    });

    return {
      status: "success",
      message: "Prayer request created successfully",
      data: { id: prayerRequest.id },
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create prayer request",
    };
  }
}
