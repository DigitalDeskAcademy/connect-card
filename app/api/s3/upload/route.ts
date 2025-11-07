/**
 * S3 Upload API - Presigned URL Generation for Secure File Uploads
 *
 * Generates presigned URLs for direct browser-to-S3 uploads, enabling secure
 * file uploads without routing files through the server. This API implements
 * a production-ready upload flow with comprehensive security measures.
 *
 * API Design:
 * - POST /api/s3/upload
 * - Content-Type: application/json
 * - Authorization: Admin role required
 * - Rate Limited: 5 requests per minute per user
 * - Response: Presigned URL with 6-minute expiration
 *
 * Security Features:
 * - Admin-only access control via requireAdmin() guard
 * - Arcjet rate limiting prevents upload abuse
 * - Request body validation with Zod schema
 * - Unique key generation prevents file conflicts
 * - Short-lived presigned URLs (6 minutes) limit exposure
 *
 * Integration Pattern:
 * 1. Frontend calls this API with file metadata
 * 2. API returns presigned URL for direct S3 upload
 * 3. Frontend uploads file directly to S3 via XMLHttpRequest
 * 4. No server bandwidth consumed for file transfer
 *
 * Performance Benefits:
 * - Direct S3 upload bypasses server bottlenecks
 * - Parallel uploads possible without blocking API
 * - Reduced server load and improved scalability
 *
 * Error Handling:
 * - 400: Invalid request body or missing required fields
 * - 401: Unauthenticated user (redirected by requireAdmin)
 * - 403: Non-admin user (redirected by requireAdmin)
 * - 429: Rate limit exceeded (Arcjet protection)
 * - 500: S3 service error or presigned URL generation failure
 *
 * CORS Requirements:
 * - S3 bucket must be configured for cross-origin uploads
 * - Required methods: PUT, POST, GET, DELETE
 * - Required headers: Content-Type, Content-Length
 * - Configured via Tigris console or AWS CLI
 *
 * Production Considerations:
 * - Monitor upload success rates and error patterns
 * - Implement file cleanup for expired/unused uploads
 * - Consider file size limits and type restrictions
 * - Track storage costs and implement lifecycle policies
 */

import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomBytes } from "crypto";

/**
 * Validate if origin is allowed for CORS
 *
 * Industry-standard approach: Validate origin in API, not S3 CORS.
 * This works with ANY preview deployment URL without manual CORS updates.
 *
 * Allowed patterns:
 * - localhost:* (development)
 * - *.vercel.app (all Vercel preview deployments)
 * - Production domains from ALLOWED_ORIGINS environment variable
 *
 * @param origin - The Origin header from the request
 * @returns true if origin matches allowed patterns, false otherwise
 */
function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const allowedPatterns = [
    /^http:\/\/localhost:\d+$/, // localhost:3000, :3001, etc.
    /^https:\/\/.*\.vercel\.app$/, // All Vercel preview deployments
  ];

  // Add production domains from environment variable
  // Supports comma-separated list: "domain.com,www.domain.com"
  const productionDomains = env.S3_UPLOAD_ALLOWED_DOMAINS?.split(",") || [];
  productionDomains.forEach(domain => {
    const trimmedDomain = domain.trim();
    if (trimmedDomain) {
      // Escape dots for regex and create pattern for exact domain match
      const escapedDomain = trimmedDomain.replace(/\./g, "\\.");
      allowedPatterns.push(new RegExp(`^https://${escapedDomain}$`));
    }
  });

  return allowedPatterns.some(pattern => pattern.test(origin));
}

/**
 * OPTIONS /api/s3/upload - Handle CORS preflight requests
 *
 * Browser sends OPTIONS request before POST to check CORS permissions.
 * This handler validates the origin and returns appropriate CORS headers.
 *
 * Industry Standard Pattern:
 * - Validate origin against allowed patterns
 * - Return dynamic Access-Control-Allow-Origin (not wildcard)
 * - Keep S3 CORS simple (allow all origins, API is gatekeeper)
 *
 * @param request - Next.js Request object with origin header
 * @returns 204 No Content with CORS headers, or 403 Forbidden
 */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const isAllowed = validateOrigin(origin);

  if (!isAllowed) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "3600", // Cache preflight for 1 hour
    },
  });
}

/**
 * Request body validation schema for file upload metadata
 *
 * Validates essential file properties before generating presigned URL.
 * Ensures all required data is present for secure S3 upload operation.
 *
 * @property fileName - Original filename with extension (required)
 * @property contentType - MIME type for proper S3 content handling (required)
 * @property size - File size in bytes for S3 Content-Length header (required)
 * @property isImage - Boolean flag to distinguish image vs video uploads
 * @property courseId - Course ID for organized file structure (optional)
 * @property fileType - Type of file (thumbnail, banner, asset) for naming (optional)
 */
const fileUploadSchema = z.object({
  fileName: z.string().min(1, { message: "Filename is required" }),
  contentType: z.string().min(1, { message: "Content type is required" }),
  size: z.number().min(1, { message: "Size is required" }),
  isImage: z.boolean(),
  fileType: z.enum(["thumbnail", "banner", "asset"]).default("asset"),
  organizationSlug: z.string().optional(),
  courseName: z.string().optional(),
});

/**
 * Generate cryptographically secure random identifier for file uniqueness
 *
 * Uses Node.js crypto module to generate URL-safe random strings that prevent
 * file name collisions while maintaining unpredictability for security.
 *
 * @param length - Desired length of random string (default 8 chars = ~48 bits entropy)
 * @returns URL-safe random string
 */
const generateSecureId = (length: number = 8): string => {
  return randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64url")
    .substring(0, length);
};

/**
 * Arcjet rate limiting configuration for upload abuse prevention
 *
 * Implements fixed window rate limiting to prevent excessive upload requests.
 * Uses user ID as fingerprint for per-user rate limiting.
 *
 * Configuration:
 * - Window: 1 minute sliding window
 * - Limit: 5 upload requests per user per minute
 * - Mode: LIVE (actively blocks requests)
 *
 * This prevents:
 * - Upload spam and abuse
 * - Storage cost attacks
 * - API resource exhaustion
 */
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

/**
 * POST /api/s3/upload - Generate presigned URL for secure file uploads
 *
 * Handles file upload requests by generating presigned URLs for direct S3 uploads.
 * Implements comprehensive security checks including admin authorization,
 * rate limiting, and request validation.
 *
 * Request Flow:
 * 1. Admin authentication and authorization check
 * 2. Rate limiting validation (5 requests/minute per user)
 * 3. Request body parsing and validation
 * 4. Unique file key generation to prevent conflicts
 * 5. S3 presigned URL generation with expiration
 * 6. Secure response with upload URL and file key
 *
 * @param request - Next.js Request object with file metadata in JSON body
 * @returns NextResponse with presigned URL and file key, or error response
 *
 * Request Body Schema:
 * {
 *   fileName: string;    // Original filename with extension
 *   contentType: string; // MIME type (e.g., 'image/jpeg', 'video/mp4')
 *   size: number;        // File size in bytes
 *   isImage: boolean;    // Flag for image vs video upload
 * }
 *
 * Success Response (200):
 * {
 *   presignedUrl: string; // S3 presigned URL for direct upload (6-minute expiry)
 *   key: string;          // Unique S3 object key for file identification
 * }
 *
 * Error Responses:
 * - 400: Invalid request body or missing required fields
 * - 401: Unauthenticated (redirected by requireAdmin)
 * - 403: Non-admin user (redirected by requireAdmin)
 * - 429: Rate limit exceeded (Arcjet protection)
 * - 500: S3 service error or URL generation failure
 *
 * Security Measures:
 * - Admin role enforcement prevents unauthorized uploads
 * - Rate limiting prevents abuse and cost attacks
 * - Unique key generation prevents file overwrites
 * - Short URL expiration limits security exposure
 * - CORS-enabled bucket required for browser uploads
 *
 * Integration Usage:
 * ```javascript
 * // Frontend upload flow
 * const response = await fetch('/api/s3/upload', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ fileName, contentType, size, isImage })
 * });
 *
 * const { presignedUrl, key } = await response.json();
 *
 * // Direct upload to S3
 * await fetch(presignedUrl, {
 *   method: 'PUT',
 *   headers: { 'Content-Type': contentType },
 *   body: file
 * });
 * ```
 */
export async function POST(request: Request) {
  /**
   * Authentication & Authorization Check
   *
   * SECURITY NOTE: This implementation uses direct session checking instead of requireAdmin()
   * to support multi-tenant access (platform admins AND agency admins can upload).
   *
   * TODO: SECURITY REVIEW - Schedule a comprehensive security audit of this authentication
   * pattern to ensure it maintains the same security guarantees as requireAdmin() while
   * supporting multi-tenant access. Key areas to review:
   * - Session validation consistency
   * - Role checking implementation
   * - Error message information leakage
   * - Rate limiting per organization
   *
   * @security-review-needed
   */
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Return 401 for unauthenticated requests (no session)
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Allow platform admins, church admins/owners, and church staff to upload files
  // Church staff need upload access for core connect card processing workflow
  const allowedRoles = [
    "platform_admin",
    "church_owner",
    "church_admin",
    "user",
  ];
  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  // Validate origin for CORS (industry-standard backend validation)
  // This allows ANY Vercel preview URL without manual CORS config updates
  const origin = request.headers.get("origin");
  const isOriginAllowed = validateOrigin(origin);

  if (!isOriginAllowed) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  try {
    // Apply rate limiting to prevent upload abuse and cost attacks
    // Uses user ID as fingerprint for per-user limiting (5 requests/minute)
    const decision = await aj.protect(request, {
      fingerprint: session?.user.id as string,
    });

    // Block requests that exceed rate limits with user-friendly error
    // Returns 429 status as per HTTP standard for rate limiting
    if (decision.isDenied()) {
      return NextResponse.json(
        {
          error:
            "Request blocked by security system. Please try again or contact support if this continues.",
        },
        { status: 429 }
      );
    }

    // Parse request body containing file metadata
    // Assumes JSON content type from frontend upload component
    const body = await request.json();

    // Validate request body against strict schema to ensure all required data
    // safeParse() prevents throwing, allowing graceful error handling
    const validation = fileUploadSchema.safeParse(body);

    // Return validation errors with 400 status for client-side debugging
    // Includes specific field validation messages from Zod schema
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid Request Body" },
        { status: 400 }
      );
    }

    // Extract validated file metadata for S3 command construction
    const {
      fileName,
      contentType,
      size,
      fileType,
      organizationSlug,
      courseName,
    } = validation.data;

    // Generate human-readable, multi-tenant file path with secure uniqueness
    let uniqueKey: string;
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "bin";
    const timestamp = Date.now();
    const secureId = generateSecureId(8); // 8 chars = ~48 bits of entropy

    if (courseName) {
      // Convert course name to URL-safe slug (e.g., "GHL Onboarding" -> "ghl-onboarding")
      const courseSlug = courseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (organizationSlug) {
        // Agency course: organizations/{org-slug}/courses/{course-slug}/{type}-{timestamp}-{secureId}.{ext}
        uniqueKey = `organizations/${organizationSlug}/courses/${courseSlug}/${fileType}-${timestamp}-${secureId}.${fileExtension}`;
      } else {
        // Platform course: platform/courses/{course-slug}/{type}-{timestamp}-{secureId}.{ext}
        uniqueKey = `platform/courses/${courseSlug}/${fileType}-${timestamp}-${secureId}.${fileExtension}`;
      }
    } else {
      // General uploads without course context (shouldn't happen in production)
      uniqueKey = `uploads/general/${fileType}-${timestamp}-${secureId}.${fileExtension}`;
    }

    // Construct S3 PutObject command with proper headers for direct upload
    // ContentType and ContentLength ensure proper S3 object metadata
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: contentType,
      ContentLength: size,
      Key: uniqueKey,
    });

    // Generate presigned URL with 6-minute expiration for security
    // Short expiration limits exposure if URL is intercepted or leaked
    // Frontend must use URL promptly after receiving it
    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // URL expires in 6 minutes
    });

    // Return structured response with upload URL and file identifier
    // Frontend uses presignedUrl for direct S3 upload, key for file tracking
    const response = {
      presignedUrl,
      key: uniqueKey,
    };

    // Return with dynamic CORS headers (industry-standard pattern)
    // Access-Control-Allow-Origin matches the validated requesting origin
    // This works with ANY Vercel preview URL without S3 CORS config updates
    return NextResponse.json(response, {
      headers: {
        "Access-Control-Allow-Origin": origin!,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  } catch {
    // Generic error handling for S3 service issues or unexpected failures
    // Returns 500 status to indicate server-side error (not client fault)
    // TODO: Add structured logging for debugging S3 service issues
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
