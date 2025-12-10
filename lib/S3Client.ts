import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

export const S3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

/**
 * Construct a public S3 URL from a file key
 *
 * Handles both:
 * - New format: S3 key only (e.g., "organizations/slug/volunteer-documents/...")
 * - Legacy format: Full URL (returned as-is for backwards compatibility)
 *
 * @param fileKey - S3 key or legacy full URL
 * @returns Full public URL to the file
 */
export function getS3Url(fileKey: string): string {
  // If it's already a full URL (legacy data), return as-is
  if (fileKey.startsWith("http://") || fileKey.startsWith("https://")) {
    return fileKey;
  }

  // Construct URL from key
  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${fileKey}`;
}

/**
 * Extract S3 key from a URL or return key as-is
 *
 * Used for S3 operations that need the key, not the full URL.
 * Handles both new (key only) and legacy (full URL) formats.
 *
 * @param fileKeyOrUrl - S3 key or full URL
 * @returns S3 key (path portion only)
 */
export function getS3Key(fileKeyOrUrl: string): string {
  // If it's already just a key, return as-is
  if (
    !fileKeyOrUrl.startsWith("http://") &&
    !fileKeyOrUrl.startsWith("https://")
  ) {
    return fileKeyOrUrl;
  }

  // Extract key from URL
  const url = new URL(fileKeyOrUrl);
  return url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
}
