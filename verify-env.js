// Environment Variable Verification Script
// Run this to debug Vercel environment variable issues

console.log("=== Environment Variable Verification ===\n");

const requiredVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "AUTH_GITHUB_CLIENT_ID",
  "AUTH_GITHUB_CLIENT_SECRET",
  "RESEND_API_KEY",
  "ARCJET_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_ENDPOINT_URL_IAM",
  "AWS_REGION",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES",
];

let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
    console.log(`❌ MISSING: ${varName}`);
  } else {
    console.log(`✅ FOUND: ${varName} = ${value.substring(0, 20)}...`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`Total Required: ${requiredVars.length}`);
console.log(`Found: ${requiredVars.length - missingVars.length}`);
console.log(`Missing: ${missingVars.length}`);

if (missingVars.length > 0) {
  console.log("\n❌ Missing Variables:");
  missingVars.forEach(varName => console.log(`  - ${varName}`));
  process.exit(1);
} else {
  console.log("\n🎉 All environment variables are present!");
  process.exit(0);
}
