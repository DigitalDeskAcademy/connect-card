import "server-only";

import { prisma } from "@/lib/db";
import { S3 } from "@/lib/S3Client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";
import type { ExtractedData } from "@/lib/types/connect-card";
import type { VolunteerOnboardingStatus } from "@/lib/generated/prisma";

/**
 * Connect card for review with image URL
 */
export interface ConnectCardForReview {
  id: string;
  imageKey: string;
  imageUrl: string; // Signed S3 URL for image display
  extractedData: ExtractedData | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  prayerRequest: string | null;
  visitType: string | null;
  interests: string[];
  scannedAt: Date;
  // Volunteer onboarding fields
  volunteerOnboardingStatus: VolunteerOnboardingStatus | null;
  volunteerDocumentsSent: unknown;
  volunteerOrientationDate: Date | null;
  volunteerOnboardingNotes: string | null;
}

/**
 * Get Connect Cards for Review
 *
 * Fetches connect cards that need manual review and correction.
 * Cards with status "EXTRACTED" are awaiting staff review.
 * Generates signed S3 URLs for secure image display.
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @returns Array of connect cards awaiting review with signed image URLs
 */
export async function getConnectCardsForReview(
  organizationId: string
): Promise<ConnectCardForReview[]> {
  // Fetch cards needing review
  const cards = await prisma.connectCard.findMany({
    where: {
      organizationId,
      status: "EXTRACTED", // Only cards awaiting review
    },
    orderBy: {
      scannedAt: "desc", // Most recent first
    },
    select: {
      id: true,
      imageKey: true,
      extractedData: true,
      name: true,
      email: true,
      phone: true,
      prayerRequest: true,
      visitType: true,
      interests: true,
      scannedAt: true,
      volunteerOnboardingStatus: true,
      volunteerDocumentsSent: true,
      volunteerOrientationDate: true,
      volunteerOnboardingNotes: true,
    },
  });

  // Generate signed URLs for all images
  const cardsWithUrls = await Promise.all(
    cards.map(async card => {
      const imageUrl = await generateSignedImageUrl(card.imageKey);
      return {
        ...card,
        imageUrl,
        extractedData: card.extractedData as ExtractedData | null,
      };
    })
  );

  return cardsWithUrls;
}

/**
 * Get Single Connect Card for Review
 *
 * Fetches a specific connect card by ID with signed image URL.
 * Used for individual card review workflow.
 *
 * @param cardId - Connect card ID
 * @param organizationId - Organization ID for multi-tenant security
 * @returns Connect card with signed image URL, or null if not found
 */
export async function getConnectCardForReview(
  cardId: string,
  organizationId: string
): Promise<ConnectCardForReview | null> {
  const card = await prisma.connectCard.findFirst({
    where: {
      id: cardId,
      organizationId, // Multi-tenant isolation
      status: "EXTRACTED",
    },
    select: {
      id: true,
      imageKey: true,
      extractedData: true,
      name: true,
      email: true,
      phone: true,
      prayerRequest: true,
      visitType: true,
      interests: true,
      scannedAt: true,
      volunteerOnboardingStatus: true,
      volunteerDocumentsSent: true,
      volunteerOrientationDate: true,
      volunteerOnboardingNotes: true,
    },
  });

  if (!card) return null;

  const imageUrl = await generateSignedImageUrl(card.imageKey);

  return {
    ...card,
    imageUrl,
    extractedData: card.extractedData as ExtractedData | null,
  };
}

/**
 * Generate Signed Image URL
 *
 * Creates a temporary signed URL for secure S3 image access.
 * URLs expire after 1 hour for security.
 *
 * @param imageKey - S3 object key for the connect card image
 * @returns Signed URL for direct image access, or empty string if generation fails
 */
async function generateSignedImageUrl(imageKey: string): Promise<string> {
  try {
    // Validate imageKey is not empty
    if (!imageKey || imageKey.trim() === "") {
      console.error("[S3 URL Generation] Empty imageKey provided");
      return "";
    }

    const command = new GetObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: imageKey,
    });

    // Generate signed URL with 1-hour expiration
    const signedUrl = await getSignedUrl(S3, command, {
      expiresIn: 3600, // 1 hour
    });

    // Ensure we never return an empty string
    if (!signedUrl || signedUrl.trim() === "") {
      console.error(
        "[S3 URL Generation] Empty URL generated for key:",
        imageKey
      );
      return "";
    }

    return signedUrl;
  } catch (error) {
    console.error("[S3 URL Generation] Failed to generate signed URL:", {
      imageKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return ""; // Return empty string on error, UI will show fallback
  }
}

/**
 * Get Connect Cards for Batch Review
 *
 * Fetches connect cards for a specific batch that need manual review.
 * Only returns cards with status "EXTRACTED" awaiting staff review.
 * Generates signed S3 URLs for secure image display.
 *
 * @param batchId - Batch ID to fetch cards from
 * @param organizationId - Organization ID for multi-tenant security
 * @returns Array of connect cards awaiting review with signed image URLs
 */
export async function getConnectCardsForBatchReview(
  batchId: string,
  organizationId: string
): Promise<ConnectCardForReview[]> {
  // Fetch cards needing review in this batch
  const cards = await prisma.connectCard.findMany({
    where: {
      organizationId, // Multi-tenant isolation
      batchId, // Filter by batch
      status: "EXTRACTED", // Only cards awaiting review
    },
    orderBy: {
      scannedAt: "asc", // Review in order scanned
    },
    select: {
      id: true,
      imageKey: true,
      extractedData: true,
      name: true,
      email: true,
      phone: true,
      prayerRequest: true,
      visitType: true,
      interests: true,
      scannedAt: true,
      volunteerOnboardingStatus: true,
      volunteerDocumentsSent: true,
      volunteerOrientationDate: true,
      volunteerOnboardingNotes: true,
    },
  });

  // Generate signed URLs for all images
  const cardsWithUrls = await Promise.all(
    cards.map(async card => {
      const imageUrl = await generateSignedImageUrl(card.imageKey);
      return {
        ...card,
        imageUrl,
        extractedData: card.extractedData as ExtractedData | null,
      };
    })
  );

  return cardsWithUrls;
}

/**
 * Get Review Queue Count
 *
 * Returns the number of connect cards awaiting review.
 * Used for dashboard metrics and navigation badges.
 *
 * @param organizationId - Organization ID for multi-tenant filtering
 * @returns Count of cards needing review
 */
export async function getReviewQueueCount(
  organizationId: string
): Promise<number> {
  return await prisma.connectCard.count({
    where: {
      organizationId,
      status: "EXTRACTED",
    },
  });
}
