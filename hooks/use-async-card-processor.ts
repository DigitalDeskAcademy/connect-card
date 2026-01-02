/**
 * Async Card Processor Hook
 *
 * Core processing engine for parallel connect card scanning.
 * Processes cards through: Upload → Create PENDING → Extract → Update to EXTRACTED
 *
 * Features:
 * - Parallel processing with configurable concurrency limits
 * - Real-time progress tracking
 * - Session persistence (survives page refresh)
 * - Retry logic with exponential backoff
 * - Failure handling with manual retry option
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createPendingCard } from "@/actions/connect-card/create-pending-card";
import { updateCardExtraction } from "@/actions/connect-card/update-card-extraction";
import { ExtractedData } from "@/lib/zodSchemas";

// ============================================================================
// TYPES
// ============================================================================

export type ProcessingStatus =
  | "queued"
  | "uploading"
  | "creating"
  | "extracting"
  | "complete"
  | "failed"
  | "duplicate";

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
}

export interface ProcessingItem {
  id: string;
  frontImage: CapturedImage;
  backImage: CapturedImage | null;
  status: ProcessingStatus;
  progress: number; // 0-100
  cardId?: string; // Set after createPendingCard
  batchId?: string;
  batchName?: string;
  error?: string;
  retryCount: number;
}

export interface ProcessingStats {
  queued: number;
  processing: number; // uploading + creating + extracting
  complete: number;
  failed: number;
  duplicate: number;
  total: number;
}

export interface AsyncCardProcessorOptions {
  slug: string;
  locationId: string | null;
  onCardComplete?: (cardId: string) => void;
  onBatchInfo?: (batchId: string, batchName: string) => void;
  onFailure?: (itemId: string, error: string) => void;
  maxRetries?: number;
  concurrentUploads?: number;
  concurrentExtractions?: number;
}

export interface AsyncCardProcessorReturn {
  /** Add a new card to the processing queue */
  addCard: (front: CapturedImage, back: CapturedImage | null) => string;
  /** Retry a failed card */
  retryCard: (itemId: string) => void;
  /** Remove a card from the queue */
  removeCard: (itemId: string) => void;
  /** All processing items */
  items: ProcessingItem[];
  /** Processing statistics */
  stats: ProcessingStats;
  /** Whether any processing is active */
  isProcessing: boolean;
  /** Whether there are any failures */
  hasFailures: boolean;
  /** Current batch info (set after first successful card) */
  batchInfo: { id: string; name: string } | null;
  /** Clear all items and reset state */
  reset: () => void;
  /** Check for and restore a previous session */
  hasPendingSession: boolean;
  /** Resume a previous session */
  resumeSession: () => void;
  /** Discard a previous session */
  discardSession: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SESSION_STORAGE_KEY = "async-card-processor-session";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CONCURRENT_UPLOADS = 5;
const DEFAULT_CONCURRENT_EXTRACTIONS = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // Exponential backoff

// ============================================================================
// SEMAPHORE (Concurrency Control)
// ============================================================================

class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Blob to base64 string (without data URL prefix)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Calculate SHA-256 hash of base64 data (for duplicate detection)
 */
async function calculateHash(base64Data: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(base64Data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Upload image to S3 via presigned URL
 */
async function uploadToS3(
  blob: Blob,
  slug: string,
  side: "front" | "back"
): Promise<{ key: string; hash: string }> {
  console.log(`[DEBUG UPLOAD] Starting ${side} upload, blob size:`, blob.size);

  const base64 = await blobToBase64(blob);
  const hash = await calculateHash(base64);

  console.log(`[DEBUG UPLOAD] ${side} base64 length:`, base64.length);
  console.log(`[DEBUG UPLOAD] ${side} SHA-256 hash:`, hash);

  const fileName = `connect-card-${side}-${Date.now()}.jpg`;

  const presignedResponse = await fetch("/api/s3/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName,
      contentType: "image/jpeg",
      size: blob.size,
      isImage: true,
      fileType: "connect-card",
      organizationSlug: slug,
      cardSide: side,
    }),
  });

  if (!presignedResponse.ok) {
    const error = await presignedResponse.json().catch(() => ({}));
    throw new Error(error.error || "Failed to get presigned URL");
  }

  const { presignedUrl, key } = await presignedResponse.json();

  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload to S3");
  }

  return { key, hash };
}

/**
 * Extract data from image using Claude Vision API
 */
async function extractFromImage(
  frontBlob: Blob,
  backBlob: Blob | null,
  slug: string
): Promise<{
  data: ExtractedData;
  frontHash: string;
  backHash: string | null;
}> {
  console.log("[DEBUG EXTRACT] Starting extraction...");
  console.log("[DEBUG EXTRACT] Front blob size:", frontBlob.size);
  console.log("[DEBUG EXTRACT] Back blob size:", backBlob?.size ?? "N/A");

  const frontBase64 = await blobToBase64(frontBlob);
  const backBase64 = backBlob ? await blobToBase64(backBlob) : null;

  // Calculate hash client-side for comparison with server
  const clientFrontHash = await calculateHash(frontBase64);
  console.log("[DEBUG EXTRACT] Client-calculated front hash:", clientFrontHash);

  const requestBody: Record<string, string> = {
    organizationSlug: slug,
  };

  if (backBase64) {
    requestBody.frontImageData = frontBase64;
    requestBody.frontMediaType = "image/jpeg";
    requestBody.backImageData = backBase64;
    requestBody.backMediaType = "image/jpeg";
    console.log("[DEBUG EXTRACT] Sending two-sided card (front + back)");
  } else {
    requestBody.imageData = frontBase64;
    requestBody.mediaType = "image/jpeg";
    console.log("[DEBUG EXTRACT] Sending single-sided card");
  }

  const response = await fetch("/api/connect-cards/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();
  console.log("[DEBUG EXTRACT] Response status:", response.status);
  console.log(
    "[DEBUG EXTRACT] Response result:",
    JSON.stringify(result).slice(0, 200)
  );

  if (response.status === 409 && result.duplicate) {
    console.log("[DEBUG EXTRACT] DUPLICATE DETECTED!");
    console.log("[DEBUG EXTRACT] Existing card:", result.existingCard);
    const error = new Error(
      result.message || "Duplicate image detected"
    ) as Error & {
      isDuplicate: boolean;
    };
    error.isDuplicate = true;
    throw error;
  }

  if (!response.ok) {
    throw new Error(result.error || "Extraction failed");
  }

  return {
    data: result.data,
    frontHash: result.imageHash,
    backHash: result.backImageHash || null,
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useAsyncCardProcessor(
  options: AsyncCardProcessorOptions
): AsyncCardProcessorReturn {
  const {
    slug,
    locationId,
    onCardComplete,
    onBatchInfo,
    onFailure,
    maxRetries = DEFAULT_MAX_RETRIES,
    concurrentUploads = DEFAULT_CONCURRENT_UPLOADS,
    concurrentExtractions = DEFAULT_CONCURRENT_EXTRACTIONS,
  } = options;

  // State
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [batchInfo, setBatchInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [hasPendingSession, setHasPendingSession] = useState(false);

  // Refs for semaphores (don't recreate on each render)
  const uploadSemaphore = useRef(new Semaphore(concurrentUploads));
  const extractionSemaphore = useRef(new Semaphore(concurrentExtractions));
  const processingRef = useRef(false);

  // ============================================================================
  // SESSION PERSISTENCE
  // ============================================================================

  // Check for pending session on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // Check if there are incomplete items
        const hasIncomplete = parsed.items?.some(
          (item: ProcessingItem) =>
            item.status !== "complete" && item.status !== "duplicate"
        );
        if (hasIncomplete) {
          setHasPendingSession(true);
        }
      } catch {
        // Invalid session data, remove it
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Save session on items change
  useEffect(() => {
    if (items.length > 0) {
      const session = {
        items: items.map(item => ({
          ...item,
          // Don't persist blob data - convert to placeholder
          frontImage: { dataUrl: item.frontImage.dataUrl, blob: null },
          backImage: item.backImage
            ? { dataUrl: item.backImage.dataUrl, blob: null }
            : null,
        })),
        batchInfo,
        slug,
        locationId,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }, [items, batchInfo, slug, locationId]);

  const resumeSession = useCallback(() => {
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedSession) return;

    try {
      const parsed = JSON.parse(savedSession);
      if (parsed.batchInfo) {
        setBatchInfo(parsed.batchInfo);
      }
      // Restore items but mark incomplete ones as failed (blobs are lost)
      const restoredItems = parsed.items.map((item: ProcessingItem) => ({
        ...item,
        // If item was in progress, mark as failed (blob data lost on refresh)
        status:
          item.status === "complete" || item.status === "duplicate"
            ? item.status
            : "failed",
        error:
          item.status !== "complete" && item.status !== "duplicate"
            ? "Session interrupted - please retry"
            : item.error,
      }));
      setItems(restoredItems);
      setHasPendingSession(false);
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setHasPendingSession(false);
    }
  }, []);

  const discardSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setHasPendingSession(false);
  }, []);

  // ============================================================================
  // ITEM MANAGEMENT
  // ============================================================================

  const updateItem = useCallback(
    (id: string, updates: Partial<ProcessingItem>) => {
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const addCard = useCallback(
    (front: CapturedImage, back: CapturedImage | null): string => {
      const id = crypto.randomUUID();
      const newItem: ProcessingItem = {
        id,
        frontImage: front,
        backImage: back,
        status: "queued",
        progress: 0,
        retryCount: 0,
      };
      setItems(prev => [...prev, newItem]);
      return id;
    },
    []
  );

  const retryCard = useCallback((itemId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              status: "queued" as ProcessingStatus,
              error: undefined,
              progress: 0,
            }
          : item
      )
    );
  }, []);

  const removeCard = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setBatchInfo(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  // ============================================================================
  // PROCESSING PIPELINE
  // ============================================================================

  const processItem = useCallback(
    async (item: ProcessingItem) => {
      try {
        // Stage 1: Upload to S3
        updateItem(item.id, { status: "uploading", progress: 10 });

        await uploadSemaphore.current.acquire();
        let frontUpload: { key: string; hash: string };
        let backUpload: { key: string; hash: string } | null = null;

        try {
          frontUpload = await uploadToS3(item.frontImage.blob, slug, "front");
          updateItem(item.id, { progress: 25 });

          if (item.backImage) {
            backUpload = await uploadToS3(item.backImage.blob, slug, "back");
            updateItem(item.id, { progress: 40 });
          }
        } finally {
          uploadSemaphore.current.release();
        }

        // Stage 2: Create pending card
        updateItem(item.id, { status: "creating", progress: 50 });

        const createResult = await createPendingCard(
          slug,
          {
            imageKey: frontUpload.key,
            imageHash: frontUpload.hash,
            backImageKey: backUpload?.key || null,
            backImageHash: backUpload?.hash || null,
          },
          locationId
        );

        if (createResult.status === "error") {
          throw new Error(createResult.message);
        }

        const { cardId, batchId, batchName } = createResult.data!;
        updateItem(item.id, { cardId, batchId, batchName, progress: 60 });

        // Update batch info on first success
        if (!batchInfo) {
          setBatchInfo({ id: batchId, name: batchName });
          onBatchInfo?.(batchId, batchName);
        }

        // Stage 3: Extract data with Claude Vision
        updateItem(item.id, { status: "extracting", progress: 70 });

        await extractionSemaphore.current.acquire();
        let extractedData: ExtractedData;

        try {
          const extraction = await extractFromImage(
            item.frontImage.blob,
            item.backImage?.blob || null,
            slug
          );
          extractedData = extraction.data;
          updateItem(item.id, { progress: 85 });
        } catch (error) {
          // Check for duplicate
          if ((error as { isDuplicate?: boolean }).isDuplicate) {
            updateItem(item.id, {
              status: "duplicate",
              error: "Duplicate image detected",
              progress: 100,
            });
            return;
          }
          throw error;
        } finally {
          extractionSemaphore.current.release();
        }

        // Stage 4: Update card with extracted data
        updateItem(item.id, { progress: 90 });

        const updateResult = await updateCardExtraction(
          slug,
          cardId,
          extractedData
        );

        if (updateResult.status === "error") {
          throw new Error(updateResult.message);
        }

        // Success!
        updateItem(item.id, { status: "complete", progress: 100 });
        onCardComplete?.(cardId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Processing failed";
        const newRetryCount = item.retryCount + 1;

        if (newRetryCount < maxRetries) {
          // Retry with exponential backoff
          const delay =
            RETRY_DELAYS[newRetryCount - 1] ||
            RETRY_DELAYS[RETRY_DELAYS.length - 1];
          updateItem(item.id, {
            retryCount: newRetryCount,
            error: `Retrying (${newRetryCount}/${maxRetries})...`,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          updateItem(item.id, { status: "queued", error: undefined });
        } else {
          // Max retries exceeded
          updateItem(item.id, { status: "failed", error: message });
          onFailure?.(item.id, message);
        }
      }
    },
    [
      slug,
      locationId,
      batchInfo,
      maxRetries,
      onCardComplete,
      onBatchInfo,
      onFailure,
      updateItem,
    ]
  );

  // Process queue continuously
  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current) return;

      const queuedItems = items.filter(item => item.status === "queued");
      if (queuedItems.length === 0) return;

      processingRef.current = true;

      // Process all queued items (semaphores handle concurrency)
      await Promise.all(queuedItems.map(item => processItem(item)));

      processingRef.current = false;
    };

    processQueue();
  }, [items, processItem]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const stats: ProcessingStats = {
    queued: items.filter(i => i.status === "queued").length,
    processing: items.filter(i =>
      ["uploading", "creating", "extracting"].includes(i.status)
    ).length,
    complete: items.filter(i => i.status === "complete").length,
    failed: items.filter(i => i.status === "failed").length,
    duplicate: items.filter(i => i.status === "duplicate").length,
    total: items.length,
  };

  const isProcessing =
    stats.queued > 0 || stats.processing > 0 || processingRef.current;

  const hasFailures = stats.failed > 0;

  return {
    addCard,
    retryCard,
    removeCard,
    items,
    stats,
    isProcessing,
    hasFailures,
    batchInfo,
    reset,
    hasPendingSession,
    resumeSession,
    discardSession,
  };
}
