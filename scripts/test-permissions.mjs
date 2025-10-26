import {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
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

console.log("🔍 Testing S3 Access Key Permissions...");
console.log(`📦 Bucket: ${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}\n`);

// Test 1: List buckets
try {
  await s3.send(new ListBucketsCommand({}));
  console.log("✅ ListBuckets: ALLOWED");
} catch (err) {
  console.log("❌ ListBuckets: DENIED -", err.message);
}

// Test 2: Put object
try {
  const testKey = "permissions-test.txt";
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: testKey,
      Body: "test",
    })
  );
  console.log("✅ PutObject: ALLOWED");

  // Test 3: Delete object
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Key: testKey,
      })
    );
    console.log("✅ DeleteObject: ALLOWED");
  } catch (err) {
    console.log("❌ DeleteObject: DENIED -", err.message);
  }
} catch (err) {
  console.log("❌ PutObject: DENIED -", err.message);
  console.log(
    "\n🔒 This is the problem! Access key needs PutObject permission."
  );
  console.log(
    "   Fix this in Tigris console under Access Keys or IAM settings."
  );
}

console.log("\n📊 Next Steps:");
console.log(
  "   If PutObject is DENIED, you must grant this permission in Tigris console."
);
console.log(
  "   We cannot grant permissions via API - that requires admin access."
);
