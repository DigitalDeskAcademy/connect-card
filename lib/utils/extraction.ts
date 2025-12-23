/**
 * Connect Card Extraction Utilities
 *
 * Shared functions for Claude Vision extraction.
 * Used by upload-client, scan-wizard, and extraction test pages.
 */

export interface ExtractionResult {
  success: boolean;
  data: ExtractedData;
  imageHash: string;
  backImageHash?: string | null;
  raw_text: string;
}

export interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request: string | null;
  visit_status?: string | null;
  first_time_visitor?: boolean | null;
  interests: string[] | null;
  keywords?: string[] | null;
  address: string | null;
  age_group: string | null;
  family_info: string | null;
  additional_notes?: unknown;
}

export interface ExtractionError {
  isDuplicate: boolean;
  message: string;
  existingCard?: { id: string; name: string; scannedAt: string };
}

/**
 * Extract data from a connect card image using Claude Vision
 *
 * @param imageData - Base64-encoded image data (without data URL prefix)
 * @param mediaType - MIME type of the image (e.g., "image/jpeg")
 * @param organizationSlug - Organization slug for multi-tenant isolation
 * @returns Extraction result with data and metadata
 * @throws ExtractionError if extraction fails or duplicate detected
 */
export async function extractFromImage(
  imageData: string,
  mediaType: string,
  organizationSlug: string
): Promise<ExtractionResult> {
  const response = await fetch("/api/connect-cards/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageData,
      mediaType,
      organizationSlug,
    }),
  });

  const result = await response.json();

  if (response.status === 409 && result.duplicate) {
    const error = new Error(
      result.message || "Duplicate image detected"
    ) as Error & ExtractionError;
    error.isDuplicate = true;
    error.message = result.message;
    error.existingCard = result.existingCard;
    throw error;
  }

  if (!response.ok) {
    throw new Error(result.error || "Extraction failed");
  }

  return {
    success: true,
    data: normalizeExtractedData(result.data),
    imageHash: result.imageHash,
    backImageHash: result.backImageHash,
    raw_text: result.raw_text,
  };
}

/**
 * Normalize extracted data to ensure consistent types
 */
export function normalizeExtractedData(
  data: Record<string, unknown>
): ExtractedData {
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
    keywords: Array.isArray(data.keywords)
      ? data.keywords.filter((k): k is string => typeof k === "string")
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

/**
 * Convert a File to base64 string (without data URL prefix)
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
 * Convert a Blob to base64 string (without data URL prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
