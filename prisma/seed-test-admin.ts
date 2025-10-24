/**
 * Quick test admin user creation script
 * Run with: npx tsx prisma/seed-test-admin.ts
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Creating test admin user...");

  try {
    // Create a test admin user
    const admin = await prisma.user.create({
      data: {
        id: "test-admin-001",
        email: "admin@sidecarplatform.com",
        name: "Test Admin",
        role: "platform_admin",
        emailVerified: true,
        image: "https://avatars.githubusercontent.com/u/1?v=4",
      },
    });

    console.log("✅ Test admin created successfully!");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Role:", admin.role);
    console.log("🆔 ID:", admin.id);
    console.log(
      "\n📝 Note: You'll need to log in via GitHub OAuth with this email"
    );
    console.log(
      "   Or update the GitHub account in the database after first login"
    );

    // Also create a test organization for multi-tenant testing
    const org = await prisma.organization.create({
      data: {
        id: "test-org-001",
        name: "Test Agency",
        slug: "test-agency",
        type: "AGENCY",
        subscriptionStatus: "TRIAL",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });

    console.log("\n✅ Test organization created!");
    console.log("🏢 Organization:", org.name);
    console.log("🔗 Slug:", org.slug);
  } catch (error) {
    console.error("❌ Error creating test admin:", error);
    // If user already exists, that's ok
    if (error.code === "P2002") {
      console.log("ℹ️  User might already exist, that's OK!");
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
