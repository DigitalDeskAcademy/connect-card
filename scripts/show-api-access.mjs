import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetBucketCorsCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  GetBucketAclCommand,
  HeadBucketCommand,
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

const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

console.log("🔍 Testing S3 API Access with Current Credentials");
console.log("=".repeat(60));
console.log(`📦 Target Bucket: ${bucketName}\n`);

// Test 1: List All Buckets
console.log("1️⃣  LIST ALL BUCKETS");
try {
  const result = await s3.send(new ListBucketsCommand({}));
  console.log("   ✅ SUCCESS - Can list buckets");
  console.log(`   📊 Found ${result.Buckets.length} buckets:`);
  result.Buckets.forEach(bucket => {
    console.log(`      - ${bucket.Name}`);
  });
} catch (err) {
  console.log(`   ❌ DENIED - ${err.message}`);
}

// Test 2: List Objects in Bucket
console.log(`\n2️⃣  LIST OBJECTS in ${bucketName}`);
try {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    })
  );
  console.log("   ✅ SUCCESS - Can list objects");
  console.log(`   📊 Found ${result.KeyCount} objects (showing max 5):`);
  if (result.Contents && result.Contents.length > 0) {
    result.Contents.forEach(obj => {
      const sizeKB = (obj.Size / 1024).toFixed(2);
      console.log(`      - ${obj.Key} (${sizeKB} KB)`);
    });
  } else {
    console.log("      (bucket is empty)");
  }
} catch (err) {
  console.log(`   ❌ DENIED - ${err.message}`);
}

// Test 3: Get CORS Configuration
console.log(`\n3️⃣  GET CORS CONFIGURATION`);
try {
  const result = await s3.send(
    new GetBucketCorsCommand({ Bucket: bucketName })
  );
  console.log("   ✅ SUCCESS - Can read CORS");
  console.log(`   📊 CORS Rules:`);
  result.CORSRules.forEach((rule, i) => {
    console.log(`      Rule ${i + 1}:`);
    console.log(`         Origins: ${rule.AllowedOrigins.join(", ")}`);
    console.log(`         Methods: ${rule.AllowedMethods.join(", ")}`);
    console.log(
      `         Headers: ${rule.AllowedHeaders ? rule.AllowedHeaders.join(", ") : "None"}`
    );
    console.log(`         Max Age: ${rule.MaxAgeSeconds}s`);
  });
} catch (err) {
  if (err.name === "NoSuchCORSConfiguration") {
    console.log("   ⚠️  No CORS configuration set");
  } else {
    console.log(`   ❌ DENIED - ${err.message}`);
  }
}

// Test 4: Get Bucket Location
console.log(`\n4️⃣  GET BUCKET LOCATION`);
try {
  const result = await s3.send(
    new GetBucketLocationCommand({ Bucket: bucketName })
  );
  console.log("   ✅ SUCCESS - Can read bucket location");
  console.log(
    `   📊 Location: ${result.LocationConstraint || "default region"}`
  );
} catch (err) {
  console.log(`   ❌ DENIED - ${err.message}`);
}

// Test 5: Get Bucket Versioning
console.log(`\n5️⃣  GET BUCKET VERSIONING`);
try {
  const result = await s3.send(
    new GetBucketVersioningCommand({ Bucket: bucketName })
  );
  console.log("   ✅ SUCCESS - Can read versioning");
  console.log(`   📊 Status: ${result.Status || "Not enabled"}`);
} catch (err) {
  console.log(`   ❌ DENIED - ${err.message}`);
}

// Test 6: Get Bucket Policy
console.log(`\n6️⃣  GET BUCKET POLICY`);
try {
  const result = await s3.send(
    new GetBucketPolicyCommand({ Bucket: bucketName })
  );
  console.log("   ✅ SUCCESS - Can read bucket policy");
  const policy = JSON.parse(result.Policy);
  console.log(
    `   📊 Policy has ${policy.Statement ? policy.Statement.length : 0} statements`
  );
} catch (err) {
  if (err.name === "NoSuchBucketPolicy") {
    console.log("   ⚠️  No bucket policy set");
  } else {
    console.log(`   ❌ DENIED - ${err.message}`);
  }
}

// Test 7: Get Public Access Block
console.log(`\n7️⃣  GET PUBLIC ACCESS BLOCK`);
try {
  const result = await s3.send(
    new GetPublicAccessBlockCommand({ Bucket: bucketName })
  );
  console.log("   ✅ SUCCESS - Can read public access settings");
  const config = result.PublicAccessBlockConfiguration;
  console.log(`   📊 Settings:`);
  console.log(`      Block Public ACLs: ${config.BlockPublicAcls}`);
  console.log(`      Block Public Policy: ${config.BlockPublicPolicy}`);
  console.log(`      Ignore Public ACLs: ${config.IgnorePublicAcls}`);
  console.log(`      Restrict Public Buckets: ${config.RestrictPublicBuckets}`);
} catch (err) {
  if (err.name === "NoSuchPublicAccessBlockConfiguration") {
    console.log(
      "   ⚠️  No public access block configuration (defaults to public)"
    );
  } else {
    console.log(`   ❌ DENIED - ${err.message}`);
  }
}

// Test 8: Get Bucket ACL
console.log(`\n8️⃣  GET BUCKET ACL`);
try {
  const result = await s3.send(new GetBucketAclCommand({ Bucket: bucketName }));
  console.log("   ✅ SUCCESS - Can read bucket ACL");
  console.log(`   📊 Owner: ${result.Owner.DisplayName || result.Owner.ID}`);
  console.log(`   📊 Grants: ${result.Grants.length} access grants`);
} catch (err) {
  console.log(`   ❌ DENIED - ${err.message}`);
}

// Test 9: Head Bucket (Check existence)
console.log(`\n9️⃣  HEAD BUCKET (Check Access)`);
try {
  await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
  console.log("   ✅ SUCCESS - Can access bucket");
} catch (err) {
  console.log(`   ❌ DENIED - ${err.message}`);
}

console.log("\n" + "=".repeat(60));
console.log("📊 SUMMARY");
console.log("=".repeat(60));
console.log("\nAbove shows what API operations your current access key");
console.log("can perform. ✅ = allowed, ❌ = denied, ⚠️  = not configured.\n");
