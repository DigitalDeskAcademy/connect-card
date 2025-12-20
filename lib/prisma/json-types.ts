/**
 * Type-Safe JSON Converters for Prisma
 *
 * Provides compile-time type safety for Prisma Json fields while maintaining
 * runtime validation at database boundaries.
 *
 * Industry Standard: Branded types with converter functions
 * Reference: https://github.com/arthurfiorette/prisma-json-types-generator
 *
 * @module lib/prisma/json-types
 */

import { Prisma } from "@/lib/generated/prisma";

// =============================================================================
// VALIDATION ISSUES JSON TYPE
// =============================================================================

/**
 * Validation issue structure for connect card quality checks
 */
export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * Branded type for ValidationIssue[] stored in Prisma Json field
 * Provides compile-time safety while being compatible with Prisma.JsonValue
 */
export type ValidationIssuesJson = Prisma.JsonValue & {
  readonly __brand: unique symbol;
};

/**
 * Converts ValidationIssue[] to Prisma-compatible JSON
 *
 * @param issues - Array of validation issues from quality check
 * @returns Branded JSON type safe for Prisma storage
 * @throws Error if input is not a valid array
 *
 * @example
 * ```typescript
 * const result = validateConnectCardData(data);
 * await prisma.connectCard.create({
 *   data: {
 *     validationIssues: toValidationIssuesJson(result.issues),
 *   },
 * });
 * ```
 */
export function toValidationIssuesJson(
  issues: ValidationIssue[]
): ValidationIssuesJson {
  // Runtime validation
  if (!Array.isArray(issues)) {
    throw new Error("ValidationIssues must be an array");
  }

  // Validate each issue has required fields
  for (const issue of issues) {
    if (
      typeof issue.field !== "string" ||
      typeof issue.message !== "string" ||
      !["error", "warning"].includes(issue.severity)
    ) {
      throw new Error("Invalid ValidationIssue structure");
    }
  }

  return issues as unknown as ValidationIssuesJson;
}

/**
 * Converts Prisma JSON back to typed ValidationIssue[]
 *
 * @param json - Raw JSON from Prisma query
 * @returns Typed array of validation issues, empty array if null/invalid
 *
 * @example
 * ```typescript
 * const card = await prisma.connectCard.findUnique({ where: { id } });
 * const issues = fromValidationIssuesJson(card?.validationIssues);
 * ```
 */
export function fromValidationIssuesJson(
  json: Prisma.JsonValue | null | undefined
): ValidationIssue[] {
  if (!json) return [];

  if (!Array.isArray(json)) {
    console.error("Invalid validationIssues JSON structure: expected array");
    return [];
  }

  // Filter and validate each element, then cast to typed array
  // Type guard validates structure, explicit cast satisfies compiler
  const validated = json.filter((issue): boolean => {
    return (
      typeof issue === "object" &&
      issue !== null &&
      "field" in issue &&
      typeof (issue as Record<string, unknown>).field === "string" &&
      "message" in issue &&
      typeof (issue as Record<string, unknown>).message === "string" &&
      "severity" in issue &&
      ["error", "warning"].includes(
        (issue as Record<string, unknown>).severity as string
      )
    );
  });

  return validated as unknown as ValidationIssue[];
}

// =============================================================================
// DUPLICATE MARKER JSON TYPE
// =============================================================================

/**
 * Marker structure for cards flagged as duplicates
 */
export interface DuplicateMarker {
  type: "DUPLICATE";
  message: string;
  markedBy: string;
  timestamp: Date | string;
}

/**
 * Branded type for DuplicateMarker stored in Prisma Json field
 */
export type DuplicateMarkerJson = Prisma.JsonValue & {
  readonly __brand: unique symbol;
};

/**
 * Converts DuplicateMarker to Prisma-compatible JSON
 *
 * @param marker - Duplicate marker data
 * @returns Branded JSON type safe for Prisma storage
 */
export function toDuplicateMarkerJson(
  marker: DuplicateMarker
): DuplicateMarkerJson {
  // Runtime validation
  if (marker.type !== "DUPLICATE") {
    throw new Error("DuplicateMarker must have type 'DUPLICATE'");
  }
  if (typeof marker.message !== "string") {
    throw new Error("DuplicateMarker must have a message string");
  }
  if (typeof marker.markedBy !== "string") {
    throw new Error("DuplicateMarker must have markedBy user ID");
  }

  // Ensure timestamp is serializable
  const serializable = {
    ...marker,
    timestamp:
      marker.timestamp instanceof Date
        ? marker.timestamp.toISOString()
        : marker.timestamp,
  };

  return serializable as unknown as DuplicateMarkerJson;
}

/**
 * Converts Prisma JSON back to typed DuplicateMarker
 *
 * @param json - Raw JSON from Prisma query
 * @returns Typed duplicate marker or null if invalid
 */
export function fromDuplicateMarkerJson(
  json: Prisma.JsonValue | null | undefined
): DuplicateMarker | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return null;
  }

  const obj = json as Record<string, unknown>;

  if (
    obj.type === "DUPLICATE" &&
    typeof obj.message === "string" &&
    typeof obj.markedBy === "string" &&
    (typeof obj.timestamp === "string" || obj.timestamp instanceof Date)
  ) {
    return {
      type: "DUPLICATE",
      message: obj.message,
      markedBy: obj.markedBy,
      timestamp: obj.timestamp as string,
    };
  }

  return null;
}

// =============================================================================
// ERROR RESPONSE DATA JSON TYPE
// =============================================================================

/**
 * Extra data attached to error responses (e.g., duplicate card info)
 */
export interface ErrorResponseData {
  duplicateType?: "image" | "person";
  existingCard?: {
    id: string;
    name?: string | null;
    scannedAt?: Date | string | null;
  };
}

/**
 * Branded type for error response data
 */
export type ErrorResponseDataJson = Prisma.JsonValue & {
  readonly __brand: unique symbol;
};

/**
 * Converts ErrorResponseData to Prisma-compatible JSON
 */
export function toErrorResponseDataJson(
  data: ErrorResponseData
): ErrorResponseDataJson {
  // Serialize dates if present
  const serializable = {
    ...data,
    existingCard: data.existingCard
      ? {
          ...data.existingCard,
          scannedAt:
            data.existingCard.scannedAt instanceof Date
              ? data.existingCard.scannedAt.toISOString()
              : data.existingCard.scannedAt,
        }
      : undefined,
  };

  return serializable as unknown as ErrorResponseDataJson;
}

// =============================================================================
// MEMBER KEYWORD JSON TYPE
// =============================================================================

/**
 * Campaign keyword detected from a connect card
 * Stored on ChurchMember for filtering/searching
 */
export interface MemberKeyword {
  keyword: string;
  detectedAt: string; // ISO 8601 date string
}

/**
 * Branded type for MemberKeyword[] stored in Prisma Json field
 */
export type MemberKeywordsJson = Prisma.JsonValue & {
  readonly __brand: unique symbol;
};

/**
 * Converts MemberKeyword[] to Prisma-compatible JSON
 *
 * @param keywords - Array of keywords with timestamps
 * @returns Branded JSON type safe for Prisma storage
 */
export function toMemberKeywordsJson(
  keywords: MemberKeyword[]
): MemberKeywordsJson {
  if (!Array.isArray(keywords)) {
    throw new Error("MemberKeywords must be an array");
  }

  for (const kw of keywords) {
    if (typeof kw.keyword !== "string" || typeof kw.detectedAt !== "string") {
      throw new Error("Invalid MemberKeyword structure");
    }
  }

  return keywords as unknown as MemberKeywordsJson;
}

/**
 * Converts Prisma JSON back to typed MemberKeyword[]
 *
 * @param json - Raw JSON from Prisma query
 * @returns Typed array of keywords, empty array if null/invalid
 */
export function fromMemberKeywordsJson(
  json: Prisma.JsonValue | null | undefined
): MemberKeyword[] {
  if (!json) return [];

  if (!Array.isArray(json)) {
    console.error("Invalid detectedKeywords JSON structure: expected array");
    return [];
  }

  const validated = json.filter((kw): boolean => {
    return (
      typeof kw === "object" &&
      kw !== null &&
      "keyword" in kw &&
      typeof (kw as Record<string, unknown>).keyword === "string" &&
      "detectedAt" in kw &&
      typeof (kw as Record<string, unknown>).detectedAt === "string"
    );
  });

  return validated as unknown as MemberKeyword[];
}

/**
 * Merges new keywords into existing keywords array
 * Avoids duplicates (same keyword within same day)
 *
 * @param existing - Current keywords on member
 * @param newKeywords - Keywords from newly processed connect card
 * @returns Merged array with no duplicates
 */
export function mergeKeywords(
  existing: MemberKeyword[],
  newKeywords: string[]
): MemberKeyword[] {
  const now = new Date().toISOString();
  const today = now.split("T")[0]; // YYYY-MM-DD

  const merged = [...existing];

  for (const keyword of newKeywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    if (!normalizedKeyword) continue;

    // Check if this keyword was already detected today
    const alreadyExists = merged.some(
      kw =>
        kw.keyword === normalizedKeyword &&
        kw.detectedAt.split("T")[0] === today
    );

    if (!alreadyExists) {
      merged.push({
        keyword: normalizedKeyword,
        detectedAt: now,
      });
    }
  }

  return merged;
}

// =============================================================================
// JSON SIZE VALIDATION UTILITIES
// =============================================================================

/**
 * Maximum allowed size for JSON payloads (1MB)
 * Prevents storage exhaustion attacks
 */
export const MAX_JSON_SIZE_BYTES = 1_048_576;

/**
 * Warning threshold for JSON payloads (50KB)
 * Triggers monitoring alerts
 */
export const JSON_SIZE_WARNING_BYTES = 51_200;

/**
 * Validates JSON payload size is within acceptable limits
 *
 * @param data - Data to validate
 * @param maxBytes - Maximum allowed size (default: 1MB)
 * @returns Object with valid flag and size info
 *
 * @example
 * ```typescript
 * const sizeCheck = validateJsonSize(extractedData);
 * if (!sizeCheck.valid) {
 *   return { status: "error", message: "Data exceeds maximum size" };
 * }
 * if (sizeCheck.warning) {
 *   logger.warn("Large payload detected", { size: sizeCheck.bytes });
 * }
 * ```
 */
export function validateJsonSize(
  data: unknown,
  maxBytes: number = MAX_JSON_SIZE_BYTES
): {
  valid: boolean;
  warning: boolean;
  bytes: number;
} {
  const serialized = JSON.stringify(data);
  const bytes = new TextEncoder().encode(serialized).length;

  return {
    valid: bytes <= maxBytes,
    warning: bytes > JSON_SIZE_WARNING_BYTES,
    bytes,
  };
}

/**
 * Validates JSON structure depth to prevent deep nesting attacks
 *
 * @param obj - Object to validate
 * @param maxDepth - Maximum nesting depth (default: 10)
 * @returns true if depth is acceptable
 */
export function validateJsonDepth(
  obj: unknown,
  maxDepth: number = 10
): boolean {
  function checkDepth(o: unknown, depth: number): boolean {
    if (depth > maxDepth) return false;
    if (typeof o !== "object" || o === null) return true;

    if (Array.isArray(o)) {
      return o.every(item => checkDepth(item, depth + 1));
    }

    return Object.values(o).every(v => checkDepth(v, depth + 1));
  }

  return checkDepth(obj, 0);
}
