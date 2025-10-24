/**
 * Update Test User Script
 * Run this AFTER logging in via GitHub OAuth to make yourself a platform admin
 *
 * Run with: npx tsx prisma/update-test-user.ts YOUR_EMAIL
 * Example: npx tsx prisma/update-test-user.ts john@example.com
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide your email address");
    console.log("Usage: npx tsx prisma/update-test-user.ts YOUR_EMAIL");
    console.log("Example: npx tsx prisma/update-test-user.ts john@example.com");
    process.exit(1);
  }

  console.log(`🔍 Looking for user with email: ${email}`);

  try {
    // Find the user created by Better Auth
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      console.log("\n📝 Make sure you:");
      console.log("1. Have logged in via GitHub OAuth first");
      console.log(
        "2. Used the correct email associated with your GitHub account"
      );
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name}`);
    console.log(`   Current role: ${user.role || "No role set"}`);
    console.log(
      `   Current org: ${user.organization?.name || "No organization"}`
    );

    // Update the user to be a platform admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "platform_admin",
        organizationId: "platform-org-001", // Platform organization we created
      },
      include: { organization: true },
    });

    console.log("\n🎉 User updated successfully!");
    console.log(`   New role: ${updatedUser.role}`);
    console.log(`   New org: ${updatedUser.organization?.name}`);
    console.log("\n✅ You now have platform admin access!");
    console.log(
      "   - Access platform admin at: http://localhost:3000/platform/admin"
    );
    console.log("   - Access regular admin at: http://localhost:3000/admin");
    console.log("   - Create courses (free and paid)");
    console.log("   - Manage all organizations");
  } catch (error) {
    console.error("❌ Error updating user:", error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
