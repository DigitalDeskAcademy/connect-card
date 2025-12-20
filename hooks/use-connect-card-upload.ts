/**
 * Connect Card Upload Hook
 *
 * Shared hook for uploading and processing connect card images.
 * Used by both admin upload page and phone scan wizard.
 *
 * Flow:
 * 1. Upload image(s) to S3 via presigned URL
 * 2. Extract data via Claude Vision API
 * 3. Save to database via server action
 */

import { useState, useCallback } from "react";
import { saveConnectCard } from "@/actions/connect-card/save-connect-card";

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request: string | null;
  visit_status?: string | null;
  first_time_visitor?: boolean | null;
  interests: string[] | null;
  address: string | null;
  age_group: string | null;
  family_info: string | null;
  additional_notes: string | null;
}

export type CardUploadStatus =
  | "pending"
  | "uploading"
  | "extracting"
  | "saving"
  | "done"
  | "error";

export interface CardUploadState {
  id: string;
  status: CardUploadStatus;
  progress: number; // 0-100
  error?: string;
  savedId?: string;
}

export interface UploadOptions {
  slug: string;
  locationId?: string | null;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Convert File to base64 string (without data URL prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Normalize extracted data from Claude Vision response
 */
function normalizeExtractedData(data: Record<string, unknown>): ExtractedData {
  return {
    name: typeof data.name === "string" ? data.name : null,
    email: typeof data.email === "string" ? data.email : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    prayer_request:
      typeof data.prayer_request === "string" ? data.prayer_request : null,
    visit_status:
      typeof data.visit_status === "string" ? data.visit_status : null,
    first_time_visitor:
      typeof data.first_time_visitor === "boolean"
        ? data.first_time_visitor
        : null,
    interests: Array.isArray(data.interests)
      ? data.interests.filter((i): i is string => typeof i === "string")
      : null,
    address: typeof data.address === "string" ? data.address : null,
    age_group: typeof data.age_group === "string" ? data.age_group : null,
    family_info: typeof data.family_info === "string" ? data.family_info : null,
    additional_notes:
      data.additional_notes === null || data.additional_notes === undefined
        ? null
        : typeof data.additional_notes === "string"
          ? data.additional_notes
          : JSON.stringify(data.additional_notes),
  };
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload an image to S3 via presigned URL
 *
 * @param image - File object or base64 data URL
 * @param slug - Organization slug
 * @param side - "front" or "back"
 * @returns S3 key or null on failure
 */
export async function uploadToS3(
  image: File | string,
  slug: string,
  side: "front" | "back"
): Promise<string | null> {
  try {
    const blob = typeof image === "string" ? base64ToBlob(image) : image;
    const contentType = blob.type || "image/jpeg";
    const fileName = `card-${Date.now()}-${side}.jpg`;

    // Get presigned URL
    const presignedResponse = await fetch("/api/s3/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        contentType,
        size: blob.size,
        isImage: true,
        fileType: "connect-card",
        organizationSlug: slug,
        cardSide: side,
      }),
    });

    if (!presignedResponse.ok) {
      const errorData = await presignedResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get presigned URL");
    }

    const { presignedUrl, key } = await presignedResponse.json();

    // Upload to S3
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload to S3");
    }

    return key;
  } catch (error) {
    console.error("S3 upload error:", error);
    return null;
  }
}

/**
 * Extract data from connect card image via Claude Vision
 *
 * @param image - File object or base64 data URL
 * @param slug - Organization slug
 * @returns Extracted data and image hash
 */
export async function extractFromImage(
  image: File | string,
  slug: string
): Promise<{ data: ExtractedData; imageHash: string } | null> {
  try {
    // Get base64 data
    let base64Data: string;
    let mediaType: string;

    if (typeof image === "string") {
      const parts = image.split(",");
      base64Data = parts[1];
      mediaType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    } else {
      base64Data = await fileToBase64(image);
      mediaType = image.type;
    }

    const response = await fetch("/api/connect-cards/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageData: base64Data,
        mediaType,
        organizationSlug: slug,
      }),
    });

    const result = await response.json();

    // Handle duplicate detection
    if (response.status === 409 && result.duplicate) {
      throw new Error(result.message || "Duplicate image detected");
    }

    if (!response.ok) {
      throw new Error(result.error || "Extraction failed");
    }

    return {
      data: normalizeExtractedData(result.data),
      imageHash: result.imageHash,
    };
  } catch (error) {
    console.error("Extraction error:", error);
    return null;
  }
}

/**
 * Process a single connect card (upload + extract + save)
 *
 * @param frontImage - Front image (File or base64)
 * @param backImage - Back image (File or base64, optional)
 * @param options - Upload options (slug, locationId)
 * @param onProgress - Progress callback
 * @returns Saved card ID or null on failure
 */
export async function processConnectCard(
  frontImage: File | string,
  backImage: File | string | null,
  options: UploadOptions,
  onProgress?: (status: CardUploadStatus, progress: number) => void
): Promise<{ id: string } | { error: string }> {
  const { slug, locationId } = options;

  try {
    // Stage 1: Upload front image
    onProgress?.("uploading", 10);
    const frontKey = await uploadToS3(frontImage, slug, "front");
    if (!frontKey) {
      return { error: "Failed to upload front image" };
    }

    // Stage 1b: Upload back image if provided
    let backKey: string | null = null;
    if (backImage) {
      onProgress?.("uploading", 30);
      backKey = await uploadToS3(backImage, slug, "back");
      if (!backKey) {
        return { error: "Failed to upload back image" };
      }
    }

    // Stage 2: Extract data from front image
    onProgress?.("extracting", 50);
    const extraction = await extractFromImage(frontImage, slug);
    if (!extraction) {
      return { error: "Failed to extract data from image" };
    }

    // Stage 3: Save to database
    onProgress?.("saving", 80);
    const saveResult = await saveConnectCard(
      slug,
      {
        imageKey: frontKey,
        imageHash: extraction.imageHash,
        backImageKey: backKey,
        backImageHash: null,
        extractedData: extraction.data,
      },
      locationId
    );

    if (saveResult.status === "error") {
      return { error: saveResult.message };
    }

    onProgress?.("done", 100);
    return { id: saveResult.data!.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: message };
  }
}

// ============================================================================
// HOOK
// ============================================================================

interface CardToProcess {
  id: string;
  frontImage: File | string;
  backImage: File | string | null;
}

interface UseConnectCardUploadOptions {
  slug: string;
  locationId?: string | null;
}

interface UseConnectCardUploadReturn {
  /** Current upload states for all cards */
  uploadStates: Map<string, CardUploadState>;
  /** Whether any upload is in progress */
  isUploading: boolean;
  /** Process a batch of cards */
  processCards: (cards: CardToProcess[]) => Promise<{
    successCount: number;
    errorCount: number;
  }>;
  /** Process a single card */
  processSingleCard: (card: CardToProcess) => Promise<{
    success: boolean;
    savedId?: string;
    error?: string;
  }>;
  /** Reset all upload states */
  reset: () => void;
}

/**
 * Hook for managing connect card uploads
 *
 * Provides state management and processing for batch uploads.
 */
export function useConnectCardUpload(
  options: UseConnectCardUploadOptions
): UseConnectCardUploadReturn {
  const { slug, locationId } = options;
  const [uploadStates, setUploadStates] = useState<
    Map<string, CardUploadState>
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const updateCardState = useCallback(
    (id: string, updates: Partial<CardUploadState>) => {
      setUploadStates(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(id) || {
          id,
          status: "pending" as CardUploadStatus,
          progress: 0,
        };
        newMap.set(id, { ...current, ...updates });
        return newMap;
      });
    },
    []
  );

  const processSingleCard = useCallback(
    async (card: CardToProcess) => {
      const result = await processConnectCard(
        card.frontImage,
        card.backImage,
        { slug, locationId },
        (status, progress) => {
          updateCardState(card.id, { status, progress });
        }
      );

      if ("error" in result) {
        updateCardState(card.id, {
          status: "error",
          error: result.error,
        });
        return { success: false, error: result.error };
      }

      updateCardState(card.id, {
        status: "done",
        progress: 100,
        savedId: result.id,
      });
      return { success: true, savedId: result.id };
    },
    [slug, locationId, updateCardState]
  );

  const processCards = useCallback(
    async (cards: CardToProcess[]) => {
      setIsUploading(true);
      let successCount = 0;
      let errorCount = 0;

      // Initialize states
      for (const card of cards) {
        updateCardState(card.id, { status: "pending", progress: 0 });
      }

      // Process sequentially to respect rate limits
      for (const card of cards) {
        const result = await processSingleCard(card);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      setIsUploading(false);
      return { successCount, errorCount };
    },
    [processSingleCard, updateCardState]
  );

  const reset = useCallback(() => {
    setUploadStates(new Map());
    setIsUploading(false);
  }, []);

  return {
    uploadStates,
    isUploading,
    processCards,
    processSingleCard,
    reset,
  };
}
