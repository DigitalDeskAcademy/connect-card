import crypto from "crypto";

/**
 * Calculate SHA-256 hash of base64 image data for duplicate detection
 * @param base64Data - Base64-encoded image data (without data:image prefix)
 * @returns SHA-256 hash string
 */
export function calculateImageHash(base64Data: string): string {
  // Create hash from base64 data
  const hash = crypto.createHash("sha256");
  hash.update(base64Data);
  return hash.digest("hex");
}

/**
 * Calculate SHA-256 hash from Buffer (for server-side file processing)
 * @param buffer - Image buffer
 * @returns SHA-256 hash string
 */
export function calculateImageHashFromBuffer(buffer: Buffer): string {
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}
