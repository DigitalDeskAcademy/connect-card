/**
 * Comprehensive Seed Script - Seeds All Test Data
 *
 * Orchestrates all seed scripts to create a complete test environment:
 * 1. Foundation: Users, organizations, locations (seed.ts)
 * 2. Prayer Requests: Test prayer data with various statuses (seed-prayer-requests.ts)
 * 3. Weekly Data: Connect cards, volunteers, analytics (seed-weekly.ts)
 *
 * Usage:
 *   pnpm seed:all
 *   DATABASE_URL="..." pnpm seed:all  (for specific database)
 */

import { execSync } from "child_process";

const DATABASE_URL = process.env.DATABASE_URL;

console.log("🌱 Starting comprehensive seed...\n");

// Helper to run seed scripts
function runSeedScript(scriptName: string, description: string) {
  console.log(`\n📦 ${description}`);
  console.log(`   Running: ${scriptName}`);
  console.log("─".repeat(60));

  try {
    const env = DATABASE_URL ? `DATABASE_URL="${DATABASE_URL}"` : "";
    const command = `${env} npx tsx prisma/${scriptName}`;

    execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ Error running ${scriptName}:`, error);
    process.exit(1);
  }
}

// Seed execution order (foundation → domain data)
const seedScripts = [
  {
    script: "seed.ts",
    description: "Foundation (Users, Organizations, Locations)",
  },
  {
    script: "seed-prayer-requests.ts",
    description: "Prayer Requests (30 test requests)",
  },
  {
    script: "seed-weekly.ts",
    description: "Weekly Data (Connect Cards, Volunteers, Analytics)",
  },
];

// Run all seeds in sequence
seedScripts.forEach(({ script, description }) => {
  runSeedScript(script, description);
});

console.log("\n" + "=".repeat(60));
console.log("🎉 Comprehensive seed completed successfully!");
console.log("=".repeat(60));

console.log("\n📊 Test Environment Ready:");
console.log("   👥 Users: 4 (platform admin, owner, admin, staff)");
console.log("   🏢 Organization: Newlife Church");
console.log("   📍 Locations: 5 campuses");
console.log("   🙏 Prayer Requests: 30 with varied statuses");
console.log("   📇 Connect Cards: Weekly test data");
console.log("   👔 Volunteers: Test volunteer data");

console.log("\n🔐 Test Credentials (Email OTP):");
console.log("   platform@test.com       (platform_admin)");
console.log("   test@playwright.dev     (church_owner)");
console.log("   admin@newlife.test      (church_admin)");
console.log("   staff@newlife.test      (staff)");

console.log("\n🌐 Prayer Feature URL:");
console.log(
  `   http://localhost:${process.env.PORT || 3002}/church/newlife/admin/prayer`
);
console.log("\n");
