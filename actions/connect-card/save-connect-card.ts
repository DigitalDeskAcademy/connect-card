"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { connectCardSchema, ConnectCardSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { validateConnectCardData } from "@/lib/validation/connect-card-quality";
import { formatPhoneNumber } from "@/lib/utils";
import {
  getOrCreateActiveBatch,
  incrementBatchCardCount,
} from "@/lib/data/connect-card-batch";
import {
  toValidationIssuesJson,
  validateJsonSize,
} from "@/lib/prisma/json-types";

/**
 * Normalize Visit Status
 *
 * Intelligently maps AI-extracted visit status text to our standard options.
 * Handles variations in terminology across different church connect cards.
 *
 * Standard options: "First Visit", "Second Visit", "Regular attendee", "Other"
 *
 * @param visitStatus - Raw text extracted by AI from connect card
 * @returns Normalized visit status or null if unrecognized/not marked
 */
function normalizeVisitStatus(visitStatus: string | null): string | null {
  if (!visitStatus) return null;

  const normalized = visitStatus.toLowerCase().trim();

  // First Visit variations (common checkbox labels across churches)
  if (
    normalized.includes("first") ||
    normalized.includes("i'm new") ||
    normalized.includes("im new") ||
    normalized.includes("new here") ||
    normalized.includes("new guest") ||
    (normalized.includes("guest") && !normalized.includes("return"))
  ) {
    return "First Visit";
  }

  // Second Visit variations
  if (normalized.includes("second") || normalized.includes("2nd")) {
    return "Second Visit";
  }

  // Regular attendee variations
  if (
    normalized.includes("regular") ||
    normalized.includes("member") ||
    normalized.includes("returning") ||
    normalized.includes("frequent") ||
    normalized.includes("attend")
  ) {
    return "Regular attendee";
  }

  // If we can't confidently map it, store the original text
  // Staff will correct it during review
  return visitStatus;
}

/**
 * Normalize Interests
 *
 * Maps AI-extracted interest checkbox labels to our standard interest options.
 * Different churches use different labels for similar interests.
 *
 * @param interests - Raw array of checkbox labels from AI extraction
 * @returns Normalized array of interests matching our standard options
 */
function normalizeInterests(interests: string[] | null): string[] {
  if (!interests || interests.length === 0) return [];

  const normalized: string[] = [];

  for (const interest of interests) {
    const lower = interest.toLowerCase().trim();

    // Volunteering variations
    if (
      lower.includes("volunteer") ||
      lower.includes("serve") ||
      lower.includes("serving") ||
      lower.includes("get involved") ||
      lower.includes("help out")
    ) {
      if (!normalized.includes("Volunteering")) {
        normalized.push("Volunteering");
      }
      continue;
    }

    // Small Groups variations
    if (
      lower.includes("small group") ||
      lower.includes("life group") ||
      lower.includes("connect group") ||
      lower.includes("community group") ||
      lower.includes("bible study")
    ) {
      if (!normalized.includes("Small Groups")) {
        normalized.push("Small Groups");
      }
      continue;
    }

    // Youth Ministry variations
    if (
      lower.includes("youth") ||
      lower.includes("student") ||
      lower.includes("teen")
    ) {
      if (!normalized.includes("Youth Ministry")) {
        normalized.push("Youth Ministry");
      }
      continue;
    }

    // Kids Ministry variations
    if (
      lower.includes("kid") ||
      lower.includes("child") ||
      lower.includes("nursery")
    ) {
      if (!normalized.includes("Kids Ministry")) {
        normalized.push("Kids Ministry");
      }
      continue;
    }

    // Worship variations
    if (
      lower.includes("worship") ||
      lower.includes("music") ||
      lower.includes("band") ||
      lower.includes("choir")
    ) {
      if (!normalized.includes("Worship")) {
        normalized.push("Worship");
      }
      continue;
    }

    // Missions variations
    if (lower.includes("mission") || lower.includes("outreach")) {
      if (!normalized.includes("Missions")) {
        normalized.push("Missions");
      }
      continue;
    }

    // If we can't map it, keep the original (staff can review)
    // But only if it's not already in the list
    if (!normalized.includes(interest)) {
      normalized.push(interest);
    }
  }

  return normalized;
}

const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 5,
  })
);

/**
 * Save Connect Card
 *
 * Saves extracted connect card data to database after Claude Vision processing.
 *
 * Security:
 * - Requires dashboard access (church admin or staff)
 * - Multi-tenant data isolation via organizationId
 * - Rate limiting via Arcjet (5 saves per minute)
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Connect card image key and extracted data
 * @param locationId - Optional location ID to override user's default location
 * @returns ApiResponse with success/error status and saved record ID
 */
export async function saveConnectCard(
  slug: string,
  data: ConnectCardSchemaType,
  locationId?: string | null
): Promise<ApiResponse<{ id: string }>> {
  // 1. Authentication and authorization
  const { session, organization } = await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_save_connect_card`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // 3. Validation
  const validation = connectCardSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid form data",
    };
  }

  // 3b. JSON Size Validation (prevents storage exhaustion attacks)
  const sizeCheck = validateJsonSize(validation.data.extractedData);
  if (!sizeCheck.valid) {
    return {
      status: "error",
      message: "Extracted data exceeds maximum size limit",
    };
  }
  // Log warning for large payloads (monitoring)
  if (sizeCheck.warning) {
    console.warn(
      `[MONITORING] Large extractedData payload: ${sizeCheck.bytes} bytes`,
      { organizationId: organization.id, userId: session.user.id }
    );
  }

  // 4. Data Quality Validation
  const validationResult = validateConnectCardData(
    validation.data.extractedData
  );

  /**
   * Location Assignment & Validation
   *
   * Priority:
   * 1. If locationId provided → use it (manual override from UI)
   * 2. Otherwise → fetch user's default campus location
   * 3. Validate locationId belongs to organization (multi-tenant security)
   */
  let finalLocationId: string | null = null;

  if (locationId) {
    // User explicitly selected a location
    finalLocationId = locationId;
  } else {
    // Fallback to user's default location
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultLocationId: true },
    });
    finalLocationId = user?.defaultLocationId || null;
  }

  // Multi-tenant security: Validate locationId belongs to organization
  if (finalLocationId) {
    const locationExists = await prisma.location.findFirst({
      where: {
        id: finalLocationId,
        organizationId: organization.id, // Multi-tenant isolation
        isActive: true, // Only accept active locations
      },
      select: { id: true },
    });

    if (!locationExists) {
      return {
        status: "error",
        message: "Invalid location - location not found or inactive",
      };
    }
  }

  try {
    // 5. Get imageHash from validated data (calculated in extract API)
    // Duplicate check already done in extract API before Claude Vision call
    const imageHash = validation.data.imageHash;
    const backImageKey = validation.data.backImageKey || null;
    const backImageHash = validation.data.backImageHash || null;

    // Note: We intentionally do NOT check for duplicate person data here.
    // Returning members filling out prayer requests or updating info should be allowed.
    // Future enhancement: Link to existing ChurchMember records instead of blocking.

    // 6. Get or create active batch for this upload
    const batch = await getOrCreateActiveBatch(
      session.user.id,
      organization.id
    );

    // 7. Save to database with batch assignment and image hash
    const connectCard = await prisma.connectCard.create({
      data: {
        organizationId: organization.id,
        imageKey: validation.data.imageKey,
        imageHash,
        backImageKey,
        backImageHash,
        extractedData: validation.data.extractedData,
        // Map extracted fields to database columns
        name: validation.data.extractedData.name,
        email: validation.data.extractedData.email,
        phone: formatPhoneNumber(validation.data.extractedData.phone),
        address: validation.data.extractedData.address,
        prayerRequest: validation.data.extractedData.prayer_request,
        // Only use AI-detected visit_status - no fallback to "First Visit"
        // Staff will select during review if not detected
        visitType: normalizeVisitStatus(
          validation.data.extractedData.visit_status || null
        ),
        interests: normalizeInterests(validation.data.extractedData.interests),
        // Status: All cards go to review queue initially (EXTRACTED)
        // Staff can batch approve or review individually
        status: "EXTRACTED",
        // Store validation issues for review UI (type-safe JSON conversion)
        validationIssues: toValidationIssuesJson(validationResult.issues),
        scannedBy: session.user.id,
        scannedAt: new Date(),
        // Use provided locationId or staff member's default campus
        locationId: finalLocationId,
        // Assign to active batch
        batchId: batch.id,
      },
      select: {
        id: true,
      },
    });

    // 8. Increment batch card count
    await incrementBatchCardCount(batch.id);

    return {
      status: "success",
      message: "Connect card saved - added to review queue",
      data: { id: connectCard.id },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to save connect card",
    };
  }
}
