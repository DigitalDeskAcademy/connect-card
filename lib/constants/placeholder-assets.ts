/**
 * Placeholder Assets Constants
 *
 * Manages placeholder/default assets used throughout the application.
 * These are served from the public directory instead of S3 to reduce
 * costs and improve performance for commonly used default images.
 */

/**
 * Default course thumbnail placeholder
 * Stored with 'placeholder:' prefix in database to distinguish from S3 assets
 */
export const placeholderCourseThumbnail =
  "placeholder:course-thumbnail-default";

/**
 * Check if a fileKey represents a placeholder asset
 * @param fileKey - The file key from database
 * @returns true if this is a placeholder asset
 */
export function isPlaceholderAsset(
  fileKey: string | null | undefined
): boolean {
  return fileKey?.startsWith("placeholder:") ?? false;
}

/**
 * Convert a placeholder fileKey to its public path
 * @param fileKey - The file key from database
 * @returns The public path to serve the placeholder from
 */
export function getPlaceholderPath(fileKey: string): string {
  if (!fileKey.startsWith("placeholder:")) {
    // Not a placeholder, return as-is
    return fileKey;
  }

  // Remove 'placeholder:' prefix and add public path
  const name = fileKey.replace("placeholder:", "");

  // Note: Using .jpg extension as the copied PNG will be served as JPG
  return `/static/placeholders/${name}.jpg`;
}

/**
 * Get the appropriate image source for a course thumbnail
 * @param fileKey - The file key from database
 * @returns Either a placeholder path or the original S3 key
 */
export function getCourseImageSrc(fileKey: string | null | undefined): string {
  if (!fileKey) {
    // No image at all, use placeholder
    return getPlaceholderPath(placeholderCourseThumbnail);
  }

  if (isPlaceholderAsset(fileKey)) {
    // It's a placeholder, get the public path
    return getPlaceholderPath(fileKey);
  }

  // It's an S3 asset, return as-is for S3 URL generation
  return fileKey;
}
