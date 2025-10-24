/**
 * Test Organization Creation Script
 * Creates the foundational organizations needed for testing
 *
 * Run with: npx tsx prisma/seed-test-organizations.ts
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🏢 Creating test organizations...");

  try {
    // 1. Create Platform Organization (for platform admins)
    const platformOrg = await prisma.organization.upsert({
      where: { slug: "sidecar-platform" },
      update: {},
      create: {
        id: "platform-org-001",
        name: "Sidecar Platform",
        slug: "sidecar-platform",
        type: "PLATFORM",
        subscriptionStatus: "ACTIVE",
        website: "https://sidecarplatform.com",
      },
    });

    console.log("✅ Platform organization created:");
    console.log("   Name:", platformOrg.name);
    console.log("   Type:", platformOrg.type);
    console.log("   ID:", platformOrg.id);

    // 2. Create Test Agency Organization (for testing multi-tenant features)
    const testAgency = await prisma.organization.upsert({
      where: { slug: "test-ghl-agency" },
      update: {},
      create: {
        id: "test-agency-001",
        name: "Test GHL Agency",
        slug: "test-ghl-agency",
        type: "AGENCY",
        subscriptionStatus: "TRIAL",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        website: "https://testghlagency.com",
        domain: "testghlagency.com",
      },
    });

    console.log("\n✅ Test agency organization created:");
    console.log("   Name:", testAgency.name);
    console.log("   Type:", testAgency.type);
    console.log("   Status:", testAgency.subscriptionStatus);
    console.log("   Trial ends:", testAgency.trialEndsAt?.toLocaleDateString());

    // 3. Create Sample Customer Agency (realistic scenario)
    const customerAgency = await prisma.organization.upsert({
      where: { slug: "digitaldesk-media" },
      update: {},
      create: {
        id: "digitaldesk-org-001",
        name: "Digital Desk Media",
        slug: "digitaldesk-media",
        type: "AGENCY",
        subscriptionStatus: "ACTIVE",
        subscriptionStartDate: new Date(),
        website: "https://digitaldeskmedia.com",
        domain: "digitaldeskmedia.com",
        // Would normally have stripeCustomerId and stripeSubscriptionId
        // but we'll add those when we create the subscription
      },
    });

    console.log("\n✅ Customer agency organization created:");
    console.log("   Name:", customerAgency.name);
    console.log("   Type:", customerAgency.type);
    console.log("   Status:", customerAgency.subscriptionStatus);

    console.log("\n🎉 All test organizations created successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Log in via GitHub OAuth at http://localhost:3000/login");
    console.log("2. After login, run: npx tsx prisma/update-test-user.ts");
    console.log("3. This will update your user with platform_admin role");
  } catch (error) {
    console.error("❌ Error creating organizations:", error);
    if (error.code === "P2002") {
      console.log("ℹ️  Some organizations might already exist, that's OK!");
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
