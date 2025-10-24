import { env } from "@/lib/env";

/**
 * Constructs the full URL for an S3-stored file
 * @param key - The S3 object key/file key
 * @returns The complete URL to access the file
 */
export function constructUrl(key: string | null | undefined): string {
  // Handle empty/null/undefined keys
  if (!key) return "";

  // If key is already a full URL (http/https), return as-is
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  // If key is a local public path (starts with /), return as-is
  if (key.startsWith("/")) {
    return key;
  }

  // Otherwise, construct S3 URL
  // Single source of truth for S3 URL pattern
  // When migrating to Cloudflare R2, only update this line
  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${key}`;
}

/**
 * Type-safe version that ensures non-empty URLs
 * Useful when you know the key exists
 */
export function constructUrlStrict(key: string): string {
  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${key}`;
}
