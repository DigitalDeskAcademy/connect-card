/**
 * Reset S3 bucket - Delete all dev files
 * Run with: npx tsx scripts/reset-s3-bucket.ts
 */

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const s3 = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function resetBucket() {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!;

  console.log("=== RESETTING S3 BUCKET ===");
  console.log("Bucket:", bucket);
  console.log("");

  let totalDeleted = 0;
  let continuationToken: string | undefined;

  do {
    // List objects
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const listResponse = await s3.send(listCommand);
    continuationToken = listResponse.NextContinuationToken;

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      break;
    }

    // Prepare delete request
    const objectsToDelete = listResponse.Contents.map(obj => ({
      Key: obj.Key!,
    }));

    console.log(`Deleting ${objectsToDelete.length} objects...`);

    // Delete batch
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true,
      },
    });

    await s3.send(deleteCommand);
    totalDeleted += objectsToDelete.length;
  } while (continuationToken);

  console.log("");
  console.log(`✅ Deleted ${totalDeleted} objects`);
  console.log("");
  console.log("Bucket is now empty and ready for production structure:");
  console.log("");
  console.log("  organizations/");
  console.log("    └── {org-slug}/");
  console.log("        └── connect-cards/");
  console.log("            └── {YYYY-MM}/");
  console.log("                ├── front-{timestamp}-{id}.jpg");
  console.log("                └── back-{timestamp}-{id}.jpg");
}

resetBucket().catch(console.error);
