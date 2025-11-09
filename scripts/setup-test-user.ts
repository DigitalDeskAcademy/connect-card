/**
 * Properly set up test user for Playwright E2E testing
 * Creates user, organization membership, and sets default location
 */

import { prisma } from "../lib/db";

async function main() {
  // Find newlife organization
  const org = await prisma.organization.findUnique({
    where: { slug: "newlife" },
    include: { locations: true },
  });

  if (!org) {
    throw new Error("newlife organization not found");
  }

  console.log("✅ Found organization:", org.name, `(${org.id})`);

  // Find Bainbridge location
  const location = org.locations.find(loc => loc.slug === "bainbridge");

  if (!location) {
    throw new Error("Bainbridge location not found");
  }

  console.log("✅ Found location:", location.name, `(${location.id})`);

  // Delete existing test user completely to start fresh
  const existingUser = await prisma.user.findUnique({
    where: { email: "test@playwright.dev" },
  });

  if (existingUser) {
    console.log("🗑️  Deleting existing test user and all related data...");

    // Delete sessions
    await prisma.session.deleteMany({
      where: { userId: existingUser.id },
    });

    // Delete accounts
    await prisma.account.deleteMany({
      where: { userId: existingUser.id },
    });

    // Delete members
    await prisma.member.deleteMany({
      where: { userId: existingUser.id },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: existingUser.id },
    });

    console.log("✅ Deleted existing user");
  }

  // Create new test user
  const user = await prisma.user.create({
    data: {
      id: `user_test_playwright_${Date.now()}`,
      email: "test@playwright.dev",
      name: "Test User",
      emailVerified: true,
      organizationId: org.id,
      role: "church_admin",
      defaultLocationId: location.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created user:", user.email);

  // Create organization membership (required by Better Auth organization plugin)
  const member = await prisma.member.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: "admin", // Organization role
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Created organization membership");
  console.log("   - Organization:", org.name);
  console.log("   - User Role:", user.role);
  console.log("   - Org Member Role:", member.role);
  console.log("   - Default Location:", location.name);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
