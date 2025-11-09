/**
 * Fix test user for Playwright E2E testing
 * Associates test@playwright.dev with newlife organization and sets default location
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

  // Find or update test user
  const user = await prisma.user.upsert({
    where: { email: "test@playwright.dev" },
    update: {
      organizationId: org.id,
      role: "church_admin",
      defaultLocationId: location.id,
    },
    create: {
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

  console.log("✅ Updated user:", user.email);
  console.log("   - Organization:", org.name);
  console.log("   - Role:", user.role);
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
