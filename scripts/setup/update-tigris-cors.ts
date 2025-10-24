/**
 * Update Tigris S3 Bucket CORS Configuration
 *
 * This script configures CORS (Cross-Origin Resource Sharing) for the Tigris
 * S3-compatible bucket to allow file uploads from:
 * - Localhost (development)
 * - Vercel preview deployments (*.vercel.app)
 * - Production domain (when configured)
 *
 * CORS Issue Context:
 * When uploading files from Vercel preview domains, the browser performs a
 * preflight OPTIONS request. Without proper CORS configuration, the request
 * fails with: "No 'Access-Control-Allow-Origin' header is present"
 *
 * This script sets up CORS rules to allow:
 * - PUT requests (for presigned URL uploads)
 * - Required headers (Content-Type, Content-Length)
 * - Multiple origins (localhost, Vercel, production)
 *
 * Usage:
 *   npx tsx scripts/update-tigris-cors.ts
 *
 * Requirements:
 * - AWS credentials in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * - Bucket name in .env (NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES)
 */

import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

// Note: Environment variables are loaded from .env by Next.js
// This script reads them directly from process.env

const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.AWS_ENDPOINT_URL_S3;

if (!bucketName || !accessKeyId || !secretAccessKey || !endpoint) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES");
  console.error("   - AWS_ACCESS_KEY_ID");
  console.error("   - AWS_SECRET_ACCESS_KEY");
  console.error("   - AWS_ENDPOINT_URL_S3");
  process.exit(1);
}

// Initialize S3 client for Tigris
const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: false,
});

/**
 * Simplified CORS configuration - Industry Standard Pattern
 *
 * This S3 bucket allows ALL origins (*) because access control is handled
 * by the Next.js API (/api/s3/upload), not by S3 CORS configuration.
 *
 * Why This is Safe:
 * - The API validates origin before issuing presigned URLs
 * - Only authenticated admins can request upload URLs
 * - Presigned URLs are short-lived (6 minutes) and unique
 * - Rate limiting prevents abuse
 *
 * Industry Standard Pattern (Used by Vercel, Supabase, AWS Amplify):
 * - S3 CORS: Allow all origins (*)
 * - API Layer: Validate origin, auth, rate limit
 * - Benefits: Works with ANY deployment URL without config updates
 *
 * Security Model:
 * - S3 = Dumb storage (no origin validation)
 * - API = Smart gatekeeper (validates everything)
 * - Presigned URLs = Temporary access tokens
 *
 * CORS Headers:
 * - AllowedOrigins: * (all origins - API validates before issuing URLs)
 * - AllowedMethods: GET, PUT, POST, HEAD (standard S3 operations)
 * - AllowedHeaders: * (browser may send various headers)
 * - ExposeHeaders: ETag (used for upload verification)
 * - MaxAgeSeconds: 3600 (cache preflight for 1 hour)
 */
const corsConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: ["*"], // All origins - API is the gatekeeper
      AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
      AllowedHeaders: ["*"], // Allow all headers for flexibility
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function updateCORS() {
  console.log("🔧 Updating Tigris bucket CORS configuration...\n");
  console.log(`📦 Bucket: ${bucketName}`);
  console.log(`🌐 Endpoint: ${endpoint}\n`);

  console.log("📋 New CORS Configuration (Industry Standard):");
  console.log("   ✓ AllowedOrigins: * (all origins)");
  console.log("   ✓ Access control: /api/s3/upload validates origin");
  console.log("   ✓ Works with ANY preview URL automatically\n");

  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);

    console.log("✅ CORS configuration updated successfully!\n");
    console.log("🎉 Industry-Standard CORS Setup Complete:");
    console.log("   • S3 bucket: Allows all origins (*)");
    console.log("   • API layer: Validates origin before issuing URLs");
    console.log("   • Works with: localhost, Vercel previews, production");
    console.log("   • No more manual CORS updates needed!\n");
    console.log("💡 Note: CORS changes may take a few moments to propagate.");
    console.log("   Try your upload again in 30-60 seconds.\n");
  } catch (error) {
    console.error("❌ Failed to update CORS configuration:");

    if (error instanceof Error) {
      console.error(`   Error: ${error.message}\n`);

      // Provide helpful debugging information
      if (error.message.includes("Access Denied")) {
        console.error("🔒 Access Denied - Common Causes:");
        console.error("   • AWS_ACCESS_KEY_ID has insufficient permissions");
        console.error("   • Check Tigris console for IAM policies");
        console.error("   • Ensure key has 's3:PutBucketCORS' permission\n");
      } else if (error.message.includes("NoSuchBucket")) {
        console.error("🪣 Bucket Not Found:");
        console.error(`   • Verify bucket name: ${bucketName}`);
        console.error("   • Check Tigris console for existing buckets\n");
      } else if (error.message.includes("SignatureDoesNotMatch")) {
        console.error("🔑 Invalid Credentials:");
        console.error("   • Check AWS_ACCESS_KEY_ID in .env.local");
        console.error("   • Check AWS_SECRET_ACCESS_KEY in .env.local");
        console.error("   • Ensure no extra whitespace in values\n");
      }
    } else {
      console.error(`   ${String(error)}\n`);
    }

    process.exit(1);
  }
}

// Run the update
updateCORS();
