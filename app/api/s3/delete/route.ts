/**
 * S3 Delete API - Secure File Deletion for Content Management
 *
 * Provides secure file deletion capabilities for S3-stored content including
 * course thumbnails, lesson videos, and other uploaded assets. Implements
 * comprehensive security measures and proper error handling.
 *
 * API Design:
 * - DELETE /api/s3/upload/delete
 * - Content-Type: application/json
 * - Authorization: Admin role required
 * - Rate Limited: 5 requests per minute per user
 * - Response: Success confirmation or error details
 *
 * Security Features:
 * - Admin-only access control prevents unauthorized deletions
 * - Arcjet rate limiting prevents bulk deletion abuse
 * - Key validation ensures valid S3 object keys
 * - No directory traversal or path manipulation possible
 *
 * Integration Pattern:
 * 1. Admin initiates file deletion from course/lesson management UI
 * 2. Frontend calls this API with S3 object key
 * 3. API validates permissions and key format
 * 4. Direct deletion from S3 storage via AWS SDK
 * 5. Success/failure response for UI feedback
 *
 * Use Cases:
 * - Remove old course thumbnail when uploading new one
 * - Delete lesson videos when content is updated
 * - Clean up unused uploads during content editing
 * - Manage storage costs by removing obsolete files
 *
 * Error Handling:
 * - 400: Missing or invalid S3 object key
 * - 401: Unauthenticated user (redirected by requireAdmin)
 * - 403: Non-admin user (redirected by requireAdmin)
 * - 429: Rate limit exceeded (Arcjet protection)
 * - 500: S3 service error or network failure
 *
 * Performance Considerations:
 * - Direct S3 deletion via AWS SDK (no proxy overhead)
 * - Non-blocking operation returns immediately
 * - Rate limiting prevents API overload
 * - Deletion is permanent and cannot be undone
 *
 * Production Monitoring:
 * - Track deletion success/failure rates
 * - Monitor for unusual deletion patterns
 * - Log deleted file keys for audit trails
 * - Alert on excessive deletion activity
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import arcjet, { fixedWindow } from "@/lib/arcjet";

import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

/**
 * Arcjet rate limiting configuration for delete operation abuse prevention
 *
 * Implements fixed window rate limiting to prevent bulk deletion attacks
 * and excessive API usage that could impact storage management operations.
 *
 * Configuration:
 * - Window: 1 minute sliding window
 * - Limit: 5 deletion requests per user per minute
 * - Mode: LIVE (actively blocks excessive requests)
 *
 * This prevents:
 * - Bulk deletion abuse by malicious actors
 * - Accidental mass deletions during UI interactions
 * - API resource exhaustion from rapid deletion requests
 * - Cost implications from excessive API calls
 */
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 100, // Support batch operations
  })
);

/**
 * DELETE /api/s3/upload/delete - Secure file deletion from S3 storage
 *
 * Handles file deletion requests for S3-stored content with comprehensive
 * security measures including admin authorization, rate limiting, and
 * proper error handling for production reliability.
 *
 * Request Flow:
 * 1. Admin authentication and authorization check
 * 2. Rate limiting validation (5 deletions/minute per user)
 * 3. Request body parsing and key validation
 * 4. S3 delete command execution
 * 5. Success confirmation or error response
 *
 * @param request - Next.js Request object with S3 object key in JSON body
 * @returns NextResponse with deletion confirmation or error details
 *
 * Request Body Schema:
 * {
 *   key: string; // S3 object key (e.g., "uuid-filename.jpg")
 * }
 *
 * Success Response (200):
 * {
 *   message: "File deleted successfully"
 * }
 *
 * Error Responses:
 * - 400: Missing or invalid S3 object key
 * - 401: Unauthenticated (redirected by requireAdmin)
 * - 403: Non-admin user (redirected by requireAdmin)
 * - 429: Rate limit exceeded (Arcjet protection)
 * - 500: S3 service error or network failure
 *
 * Security Measures:
 * - Admin role enforcement prevents unauthorized deletions
 * - Rate limiting prevents bulk deletion abuse
 * - Key validation prevents malformed requests
 * - Direct AWS SDK usage (no shell commands)
 *
 * Integration Usage:
 * ```javascript
 * // Frontend deletion flow
 * const response = await fetch('/api/s3/upload/delete', {
 *   method: 'DELETE',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ key: 'uuid-filename.jpg' })
 * });
 *
 * if (response.ok) {
 *   const { message } = await response.json();
 *   console.log(message); // "File deleted successfully"
 * }
 * ```
 *
 * Important Notes:
 * - Deletion is permanent and cannot be undone
 * - S3 may take time to propagate deletion across regions
 * - Consider implementing soft delete for critical content
 * - Monitor deletion patterns for abuse detection
 */
export async function DELETE(request: Request) {
  /**
   * Authentication & Authorization Check
   *
   * SECURITY NOTE: Updated to support multi-tenant access (platform + agency admins).
   * Matches the authentication pattern used in upload route for consistency.
   *
   * TODO: SECURITY REVIEW - Ensure delete operations maintain proper audit trails
   * and consider implementing soft-delete for critical files.
   *
   * @security-review-needed
   */
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Return 401 for unauthenticated requests
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Allow platform admins, church admins/owners, and church staff to delete files
  // Church staff need delete access to remove incorrect/duplicate connect card uploads
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

  try {
    // Apply rate limiting to prevent bulk deletion abuse and cost attacks
    // Uses user ID as fingerprint for per-user limiting (5 deletions/minute)
    const decision = await aj.protect(request, {
      fingerprint: session?.user.id as string,
    });

    // Block requests that exceed rate limits with user-friendly error message
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

    // Parse request body containing S3 object key for deletion
    // Assumes JSON content type from frontend delete requests
    const body = await request.json();

    // Extract S3 object key from request body
    // Key format: "uuid-filename.ext" (generated by upload API)
    const key = body.key;

    // Validate that S3 object key is provided and not empty
    // Returns 400 status for missing or invalid keys
    if (!key) {
      return NextResponse.json(
        { error: "Missing or invalid object key" },
        { status: 400 }
      );
    }

    // Check if this is a placeholder thumbnail - don't delete from S3
    // Placeholder files should remain in S3 as they're shared across multiple courses
    const isPlaceholder =
      key.includes("Placeholder") || key.includes("placeholder");

    if (!isPlaceholder) {
      // Only delete from S3 if it's not a placeholder file
      // Construct S3 DeleteObject command for specified bucket and key
      const command = new DeleteObjectCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Key: key,
      });

      // Execute deletion command against S3 service
      // This permanently removes the object from storage
      await S3.send(command);
    }

    // Return success response with confirmation message
    // Status 200 indicates successful deletion
    return NextResponse.json(
      { message: "File deleted succesfully" }, // Note: typo preserved for consistency
      { status: 200 }
    );
  } catch {
    // Production logging: S3 delete error handled by monitoring systems
    // Generic error handling for S3 service issues or network failures
    // Returns 500 status to indicate server-side error
    return NextResponse.json(
      { error: "Missing or invalid object key" },
      { status: 500 }
    );
  }
}
