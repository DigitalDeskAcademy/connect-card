import {
  S3Client,
  GetBucketCorsCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

// Load .env
const envFile = readFileSync(".env", "utf-8");
envFile.split("\n").forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testBucket(bucketName) {
  console.log(`\n========================================`);
  console.log(`📦 Testing Bucket: ${bucketName}`);
  console.log(`========================================`);

  // Test permissions
  console.log("\n🔐 Permission Tests:");

  // Test PutObject
  try {
    const testKey = `test-permissions-${Date.now()}.txt`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: "test",
      })
    );
    console.log("  ✅ PutObject: ALLOWED");

    // Clean up
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
      console.log("  ✅ DeleteObject: ALLOWED");
    } catch (err) {
      console.log("  ❌ DeleteObject: DENIED");
    }
  } catch (err) {
    console.log(`  ❌ PutObject: DENIED - ${err.message}`);
  }

  // Test ListObjects
  try {
    await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      })
    );
    console.log("  ✅ ListObjects: ALLOWED");
  } catch (err) {
    console.log(`  ❌ ListObjects: DENIED - ${err.message}`);
  }

  // Test CORS
  console.log("\n🌐 CORS Configuration:");
  try {
    const cors = await s3.send(
      new GetBucketCorsCommand({ Bucket: bucketName })
    );
    console.log("  ✅ CORS is configured:");
    cors.CORSRules.forEach((rule, i) => {
      console.log(`    Rule ${i + 1}:`);
      console.log(`      Origins: ${rule.AllowedOrigins.join(", ")}`);
      console.log(`      Methods: ${rule.AllowedMethods.join(", ")}`);
    });
  } catch (err) {
    if (err.name === "NoSuchCORSConfiguration") {
      console.log("  ⚠️  No CORS configuration found");
    } else {
      console.log(`  ❌ Cannot read CORS: ${err.message}`);
    }
  }

  // Test public access
  console.log("\n🔓 Public Access:");
  try {
    const publicAccess = await s3.send(
      new GetPublicAccessBlockCommand({ Bucket: bucketName })
    );
    const config = publicAccess.PublicAccessBlockConfiguration;
    if (
      config.BlockPublicAcls ||
      config.BlockPublicPolicy ||
      config.IgnorePublicAcls ||
      config.RestrictPublicBuckets
    ) {
      console.log("  ⚠️  Public access is BLOCKED");
      console.log(`    BlockPublicAcls: ${config.BlockPublicAcls}`);
      console.log(`    BlockPublicPolicy: ${config.BlockPublicPolicy}`);
    } else {
      console.log("  ✅ Public access is ALLOWED");
    }
  } catch (err) {
    if (err.name === "NoSuchPublicAccessBlockConfiguration") {
      console.log("  ✅ No public access blocks (defaults to public)");
    } else {
      console.log(`  ❓ Cannot determine: ${err.message}`);
    }
  }
}

// Test both buckets
await testBucket("sidecar-uploads");
await testBucket("connect-card-testing");

console.log("\n========================================");
console.log("📊 COMPARISON SUMMARY");
console.log("========================================");
console.log("\nCompare the results above to see what's different between");
console.log("the working bucket (sidecar-uploads) and the broken one");
console.log("(connect-card-testing).\n");
