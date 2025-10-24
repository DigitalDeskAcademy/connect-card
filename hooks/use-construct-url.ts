import { env } from "@/lib/env";
import {
  isPlaceholderAsset,
  getPlaceholderPath,
} from "@/lib/constants/placeholder-assets";

export function useConstructUrl(key: string): string {
  if (!key) return "";

  // Check if it's a placeholder asset (starts with 'placeholder:')
  if (isPlaceholderAsset(key)) {
    // Return local path - Next.js automatically handles domain resolution
    // Dev: /static/... → http://localhost:3000/static/...
    // Prod: /static/... → https://yourdomain.com/static/...
    return getPlaceholderPath(key);
  }

  // If key is already a full URL (http/https), return as-is
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  // If key is a local public path (starts with /), return as-is
  if (key.startsWith("/")) {
    return key;
  }

  // It's an S3 asset - use Tigris endpoint
  // Pattern: https://bucket-name.t3.storage.dev/file-key
  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${key}`;
}
