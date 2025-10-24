/**
 * MANUAL BACKUP SCRIPT - Production → Backup Bucket
 *
 * Copies all files from production bucket to backup bucket within Tigris.
 * Uses S3 CopyObject API (no download/upload - stays in Tigris network).
 *
 * Usage:
 *   pnpm tsx scripts/backup-production-to-tigris.ts
 *
 * Prerequisites:
 *   1. Create backup bucket in Tigris console: sidecar-uploads-backup
 *   2. Ensure .env has correct AWS credentials
 *
 * Frequency Recommendation:
 *   - Before launch: Run before any major changes
 *   - After launch: Run weekly (manual)
 *   - After $1k MRR: Automate with GitHub Actions
 */

import {
  ListObjectsV2Command,
  CopyObjectCommand,
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

const SOURCE_BUCKET = "sidecar-uploads"; // Production bucket
const BACKUP_BUCKET = "sidecar-uploads-backup"; // Backup bucket

interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function listAllObjects(bucket: string): Promise<S3Object[]> {
  const objects: S3Object[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      });

      const response = await S3.send(command);

      if (response.Contents) {
        objects.push(
          ...response.Contents.map(obj => ({
            key: obj.Key!,
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
          }))
        );
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  } catch (error) {
    console.error(`Failed to list objects in ${bucket}:`, error);
    throw error;
  }
}

async function copyObject(
  sourceKey: string,
  destinationBucket: string
): Promise<boolean> {
  try {
    const command = new CopyObjectCommand({
      Bucket: destinationBucket,
      CopySource: `${SOURCE_BUCKET}/${sourceKey}`,
      Key: sourceKey, // Keep same path in backup bucket
    });

    await S3.send(command);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to copy ${sourceKey}:`, error);
    return false;
  }
}

async function backupBucket(): Promise<void> {
  console.log("\n📦 TIGRIS BUCKET BACKUP");
  console.log("=====================================\n");
  console.log(`Source:      ${SOURCE_BUCKET}`);
  console.log(`Destination: ${BACKUP_BUCKET}\n`);

  // Step 1: List all files in production bucket
  console.log("📋 Step 1: Listing files in production bucket...\n");
  const sourceObjects = await listAllObjects(SOURCE_BUCKET);

  if (sourceObjects.length === 0) {
    console.log("✅ Production bucket is empty - nothing to backup\n");
    return;
  }

  const totalSize = sourceObjects.reduce((sum, obj) => sum + obj.size, 0);
  console.log(
    `   Found ${sourceObjects.length} files (${formatBytes(totalSize)})\n`
  );

  // Step 2: Copy files to backup bucket
  console.log("📤 Step 2: Copying files to backup bucket...\n");

  let copied = 0;
  let failed = 0;
  let totalCopied = 0;

  for (let i = 0; i < sourceObjects.length; i++) {
    const obj = sourceObjects[i];
    const progress = `[${i + 1}/${sourceObjects.length}]`;

    process.stdout.write(`   ${progress} ${obj.key}... `);

    const success = await copyObject(obj.key, BACKUP_BUCKET);

    if (success) {
      copied++;
      totalCopied += obj.size;
      process.stdout.write(`✅\n`);
    } else {
      failed++;
      process.stdout.write(`❌\n`);
    }

    // Show progress every 10 files
    if ((i + 1) % 10 === 0) {
      console.log(
        `\n   Progress: ${copied} copied, ${failed} failed, ${formatBytes(totalCopied)} transferred\n`
      );
    }
  }

  // Step 3: Summary
  console.log("\n📊 Backup Summary:");
  console.log("=====================================");
  console.log(`   ✅ Successfully copied: ${copied} files`);
  console.log(`   📦 Total data backed up: ${formatBytes(totalCopied)}`);

  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed} files`);
    console.log(`   ⚠️  Review errors above and retry if needed`);
  }

  console.log("\n✅ Backup complete!\n");
  console.log("💡 Backup Location:");
  console.log(`   Tigris bucket: ${BACKUP_BUCKET}`);
  console.log(`   All files preserved with same paths\n`);
}

async function main() {
  try {
    // Verify environment variables
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("❌ Error: Missing AWS credentials in .env file\n");
      process.exit(1);
    }

    // Confirm before starting
    console.log(
      "\n⚠️  WARNING: This will copy all files from production to backup bucket."
    );
    console.log(
      "   Existing files in backup bucket with same names will be overwritten.\n"
    );
    console.log(
      "   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n"
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    await backupBucket();
  } catch (error) {
    console.error("\n❌ Backup failed:", error);
    process.exit(1);
  }
}

main();
