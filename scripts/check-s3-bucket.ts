/**
 * Quick script to check S3/Tigris bucket structure
 * Run with: npx tsx scripts/check-s3-bucket.ts
 */

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const s3 = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function checkBucket() {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

  console.log("=== S3/TIGRIS BUCKET CHECK ===");
  console.log("Bucket:", bucket);
  console.log("Endpoint:", process.env.AWS_ENDPOINT_URL_S3);
  console.log("");

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 100,
    });

    const response = await s3.send(command);

    console.log("=== BUCKET CONTENTS ===");
    console.log("Total objects:", response.KeyCount || 0);
    console.log("");

    if (response.Contents && response.Contents.length > 0) {
      // Group by top-level prefix
      const byPrefix: Record<string, string[]> = {};

      for (const obj of response.Contents) {
        const key = obj.Key || "";
        const parts = key.split("/");
        const prefix = parts.length > 1 ? parts.slice(0, 2).join("/") : "root";

        if (!byPrefix[prefix]) {
          byPrefix[prefix] = [];
        }
        byPrefix[prefix].push(key);
      }

      console.log("=== STRUCTURE BY PREFIX ===");
      for (const [prefix, keys] of Object.entries(byPrefix)) {
        console.log(`\n${prefix}/ (${keys.length} files)`);

        // Show first 5 files
        const sample = keys.slice(0, 5);
        for (const k of sample) {
          console.log(`  - ${k}`);
        }

        if (keys.length > 5) {
          console.log(`  ... and ${keys.length - 5} more`);
        }
      }
    } else {
      console.log("Bucket is empty - no objects found");
    }

    // Check for common prefixes (folders)
    if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
      console.log("\n=== TOP-LEVEL FOLDERS ===");
      for (const prefix of response.CommonPrefixes) {
        console.log(`  ${prefix.Prefix}`);
      }
    }
  } catch (error) {
    console.error(
      "Error accessing bucket:",
      error instanceof Error ? error.message : error
    );
  }
}

checkBucket();
