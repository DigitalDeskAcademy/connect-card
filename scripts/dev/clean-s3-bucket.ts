/**
 * S3 BUCKET CLEANUP SCRIPT - DEVELOPMENT ONLY
 *
 * ⚠️  WARNING: DELETE THIS SCRIPT BEFORE PRODUCTION LAUNCH
 *
 * This script deletes ALL files from the S3 bucket.
 * Use this to reset the development environment to a clean state.
 *
 * Usage:
 *   pnpm tsx scripts/clean-s3-bucket.ts
 *
 * TODO: Remove this file before merging to production
 */

import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: ".env" });

// Create standalone S3 client
const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!;

async function listAllObjects(): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  console.log("📋 Listing all objects in bucket...\n");

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      });

      const response = await S3.send(command);

      if (response.Contents) {
        keys.push(...response.Contents.map(obj => obj.Key!).filter(Boolean));
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  } catch (error) {
    console.error("Failed to list S3 objects:", error);
    return [];
  }
}

async function deleteAllObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    console.log("✅ Bucket is already empty\n");
    return;
  }

  console.log(`🗑️  Found ${keys.length} files to delete\n`);

  const BATCH_SIZE = 1000; // AWS S3 limit per request
  let totalDeleted = 0;
  let totalErrors = 0;

  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(keys.length / BATCH_SIZE);

    console.log(
      `   Batch ${batchNumber}/${totalBatches}: Deleting ${batch.length} files...`
    );

    try {
      const command = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: false,
        },
      });

      const response = await S3.send(command);

      if (response.Deleted) {
        totalDeleted += response.Deleted.length;
      }

      if (response.Errors && response.Errors.length > 0) {
        totalErrors += response.Errors.length;
        console.error(
          `   ⚠️  Batch ${batchNumber} had ${response.Errors.length} errors`
        );
        response.Errors.forEach(err => {
          console.error(`      - ${err.Key}: ${err.Message}`);
        });
      }
    } catch (error) {
      totalErrors += batch.length;
      console.error(`   ❌ Batch ${batchNumber} failed:`, error);
    }
  }

  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   ✅ Deleted: ${totalDeleted} files`);
  if (totalErrors > 0) {
    console.log(`   ❌ Errors: ${totalErrors} files`);
  }
}

async function main() {
  console.log("\n🧹 S3 BUCKET CLEANUP");
  console.log("=====================================\n");
  console.log(`⚠️  This will DELETE ALL FILES from bucket: ${BUCKET_NAME}\n`);

  const keys = await listAllObjects();

  if (keys.length === 0) {
    console.log("✅ Bucket is already empty - nothing to clean up\n");
    return;
  }

  await deleteAllObjects(keys);

  console.log("\n✅ S3 bucket cleanup complete!\n");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ S3 cleanup failed:", error);
    process.exit(1);
  });
