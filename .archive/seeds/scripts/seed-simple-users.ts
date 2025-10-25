/**
 * Simple User Seed Script
 *
 * Creates two test users for the Sidecar platform:
 * - agency@sidecar.com (agency_admin role)
 * - enduser@sidecar.com (user role)
 *
 * Run with: npx tsx scripts/seed-simple-users.ts
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function seedSimpleUsers() {
  console.log("🌱 Creating simple test users...\n");

  try {
    // First ensure we have an organization to assign users to
    let org = await prisma.organization.findFirst({
      where: {
        slug: "digital-desk",
      },
    });

    // Fallback to name if slug doesn't exist
    if (!org) {
      org = await prisma.organization.findFirst({
        where: {
          name: "Digital Desk",
        },
      });
    }

    if (!org) {
      console.error(
        "❌ No organization found with slug 'digital-desk' or name 'Digital Desk'. Please run the main seed script first."
      );
      return;
    }

    console.log(`✅ Using organization: ${org.name}\n`);

    // Create agency admin user
    const agencyAdmin = await prisma.user.upsert({
      where: { email: "agency@sidecar.com" },
      update: {},
      create: {
        id: "agency-admin-sidecar",
        email: "agency@sidecar.com",
        name: "Agency Admin",
        emailVerified: true,
        organizationId: org.id,
        role: "agency_admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Created agency admin: agency@sidecar.com");

    // Create end user
    const endUser = await prisma.user.upsert({
      where: { email: "enduser@sidecar.com" },
      update: {},
      create: {
        id: "end-user-sidecar",
        email: "enduser@sidecar.com",
        name: "End User",
        emailVerified: true,
        organizationId: org.id,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Created end user: enduser@sidecar.com");

    console.log("\n🎉 Test users created successfully!");
    console.log("\n📝 Login credentials:");
    console.log("- Platform Admin: (already exists)");
    console.log("- Agency Admin: agency@sidecar.com");
    console.log("- End User: enduser@sidecar.com");
    console.log("\n🔑 Use OTP from console during development to login");
  } catch (error) {
    console.error("❌ Error creating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSimpleUsers();
