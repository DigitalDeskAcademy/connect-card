/**
 * Get Tigris S3 Bucket CORS Configuration
 *
 * Retrieves and displays the current CORS configuration from the Tigris bucket.
 * Use this to verify that CORS rules were successfully applied.
 *
 * Usage:
 *   node scripts/load-env-and-get-cors.mjs
 *
 * What to look for:
 * - Check if wildcard origins are present (https://*.vercel.app)
 * - Verify allowed methods include PUT, POST, GET, HEAD
 * - Confirm allowed headers include Content-Type, Content-Length
 */

import { S3Client, GetBucketCorsCommand } from "@aws-sdk/client-s3";

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

async function getCORS() {
  console.log("🔍 Retrieving Tigris bucket CORS configuration...\n");
  console.log(`📦 Bucket: ${bucketName}`);
  console.log(`🌐 Endpoint: ${endpoint}\n`);

  try {
    const command = new GetBucketCorsCommand({
      Bucket: bucketName,
    });

    const response = await s3Client.send(command);

    if (!response.CORSRules || response.CORSRules.length === 0) {
      console.log("⚠️  No CORS rules found on bucket!");
      console.log("   This means CORS is not configured.");
      console.log("\n💡 Run: node scripts/load-env-and-run-cors.mjs\n");
      return;
    }

    console.log(`✅ Found ${response.CORSRules.length} CORS rule(s):\n`);

    response.CORSRules.forEach((rule, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Rule #${index + 1}:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      console.log("\n🌍 Allowed Origins:");
      rule.AllowedOrigins?.forEach(origin => {
        if (origin === "*") {
          console.log(
            `   • ${origin} (⚠️  ALL ORIGINS - Not secure for production)`
          );
        } else if (origin.includes("*")) {
          console.log(`   • ${origin} (🔸 Wildcard pattern)`);
        } else {
          console.log(`   • ${origin}`);
        }
      });

      console.log("\n📡 Allowed Methods:");
      rule.AllowedMethods?.forEach(method => {
        console.log(`   • ${method}`);
      });

      console.log("\n📝 Allowed Headers:");
      if (rule.AllowedHeaders && rule.AllowedHeaders.length > 0) {
        rule.AllowedHeaders.forEach(header => {
          console.log(`   • ${header}`);
        });
      } else {
        console.log("   • (none)");
      }

      console.log("\n👁️  Expose Headers:");
      if (rule.ExposeHeaders && rule.ExposeHeaders.length > 0) {
        rule.ExposeHeaders.forEach(header => {
          console.log(`   • ${header}`);
        });
      } else {
        console.log("   • (none)");
      }

      console.log(`\n⏱️  Max Age: ${rule.MaxAgeSeconds || 0} seconds`);
      console.log("");
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Analysis
    console.log("📊 Analysis:");
    const hasWildcardVercel = response.CORSRules.some(rule =>
      rule.AllowedOrigins?.includes("https://*.vercel.app")
    );
    const hasAllOrigins = response.CORSRules.some(rule =>
      rule.AllowedOrigins?.includes("*")
    );

    if (hasWildcardVercel) {
      console.log("   ✅ Vercel wildcard (https://*.vercel.app) is configured");
      console.log("   💡 CORS is set correctly. If uploads still fail:");
      console.log("      - Wait 30-60 seconds for propagation");
      console.log("      - Check browser console for different error");
      console.log("      - Verify presigned URL is valid");
    } else if (hasAllOrigins) {
      console.log("   ⚠️  All origins (*) allowed - works but not secure");
    } else {
      console.log("   ❌ Vercel wildcard NOT found!");
      console.log("   💡 Re-run: node scripts/load-env-and-run-cors.mjs");
    }

    console.log("");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("NoSuchCORSConfiguration")) {
        console.error("❌ No CORS configuration exists on this bucket\n");
        console.error("💡 Run the update script first:");
        console.error("   node scripts/load-env-and-run-cors.mjs\n");
      } else if (error.message.includes("Access Denied")) {
        console.error("❌ Access Denied\n");
        console.error(
          "🔒 Your AWS credentials don't have permission to read CORS"
        );
        console.error("   Required permission: s3:GetBucketCORS\n");
      } else {
        console.error("❌ Error retrieving CORS configuration:");
        console.error(`   ${error.message}\n`);
      }
    } else {
      console.error(`❌ ${String(error)}\n`);
    }
    process.exit(1);
  }
}

// Run the check
getCORS();
