"use server";

/**
 * Create Pending Connect Card
 *
 * Creates a PENDING connect card immediately after S3 upload.
 * This is the first step in async processing - card is created as a placeholder
 * while Claude Vision extraction happens in parallel.
 *
 * Security:
 * - Supports Better Auth session (admin flow) OR scan session cookie (phone flow)
 * - Rate limited via Arcjet (60/min - supports batch scanning)
 * - Multi-tenant isolation via organizationId
 *
 * @param slug - Organization slug for multi-tenant context
 * @param data - Image keys and hashes from S3 upload
 * @param locationId - Optional location ID override
 * @returns ApiResponse with cardId, batchId, and batchName
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow, arcjetMode } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import {
  getOrCreateActiveBatch,
  incrementBatchCardCount,
} from "@/lib/data/connect-card-batch";
import { validateScanSession } from "@/lib/auth/scan-session";
import { z } from "zod";

// Validation schema for pending card creation
const createPendingCardSchema = z.object({
  imageKey: z.string().min(1, "Image key is required"),
  imageHash: z.string().min(1, "Image hash is required"),
  backImageKey: z.string().nullable().optional(),
  backImageHash: z.string().nullable().optional(),
});

export type CreatePendingCardInput = z.infer<typeof createPendingCardSchema>;

export interface CreatePendingCardResult {
  cardId: string;
  batchId: string;
  batchName: string;
}

// Rate limit: 60 cards per minute (supports batch scanning sessions)
const aj = arcjet.withRule(
  fixedWindow({
    mode: arcjetMode,
    window: "1m",
    max: 60,
  })
);

export async function createPendingCard(
  slug: string,
  data: CreatePendingCardInput,
  locationId?: string | null
): Promise<ApiResponse<CreatePendingCardResult>> {
  // 1. Authentication - supports Better Auth session OR scan session cookie
  let userId: string;
  let organizationId: string;

  // Check for scan session first (phone QR code flow)
  const scanSession = await validateScanSession();

  if (scanSession && scanSession.slug === slug) {
    // Phone scanning via QR code - already validated via token
    userId = scanSession.userId;
    organizationId = scanSession.organizationId;
  } else {
    // Standard dashboard access (logged-in user)
    const { session, organization } = await requireDashboardAccess(slug);
    userId = session.user.id;
    organizationId = organization.id;
  }

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${userId}_${organizationId}_create_pending_card`,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "Rate limit exceeded. Please wait before scanning more cards.",
      };
    }
    return {
      status: "error",
      message: "Request blocked by security policy",
    };
  }

  // 3. Validation
  const validation = createPendingCardSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid data: " + validation.error.issues[0]?.message,
    };
  }

  // 4. Location validation
  let finalLocationId: string | null = null;

  if (locationId) {
    finalLocationId = locationId;
  } else {
    // Fallback to user's default location
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultLocationId: true },
    });
    finalLocationId = user?.defaultLocationId || null;
  }

  // Validate location belongs to organization
  if (finalLocationId) {
    const locationExists = await prisma.location.findFirst({
      where: {
        id: finalLocationId,
        organizationId: organizationId,
        isActive: true,
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
    // 5. Check for duplicate image (save Claude API costs)
    const existingCard = await prisma.connectCard.findFirst({
      where: {
        organizationId,
        imageHash: validation.data.imageHash,
      },
      select: { id: true },
    });

    if (existingCard) {
      return {
        status: "error",
        message:
          "Duplicate image detected - this card has already been scanned",
      };
    }

    // 6. Get or create active batch
    const batch = await getOrCreateActiveBatch(userId, organizationId);

    // 7. Create pending card with minimal data
    const connectCard = await prisma.connectCard.create({
      data: {
        organizationId,
        imageKey: validation.data.imageKey,
        imageHash: validation.data.imageHash,
        backImageKey: validation.data.backImageKey || null,
        backImageHash: validation.data.backImageHash || null,
        // All extracted fields left null - will be filled by updateCardExtraction
        status: "PENDING",
        scannedBy: userId,
        scannedAt: new Date(),
        locationId: finalLocationId,
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
      message: "Card created - awaiting extraction",
      data: {
        cardId: connectCard.id,
        batchId: batch.id,
        batchName: batch.name,
      },
    };
  } catch (error) {
    console.error("[createPendingCard] Error:", error);
    return {
      status: "error",
      message: "Failed to create pending card",
    };
  }
}
