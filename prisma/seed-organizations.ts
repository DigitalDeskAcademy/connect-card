import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function seedOrganizations() {
  console.log("🏢 Seeding organizations...");

  // Create SideCar Platform organization (for platform admins)
  await prisma.organization.upsert({
    where: { slug: "sidecar" },
    update: {},
    create: {
      id: "sidecar-platform-org-id",
      name: "SideCar Platform",
      slug: "sidecar",
    },
  });

  // Create Digital Desk Media organization (first client)
  await prisma.organization.upsert({
    where: { slug: "digitaldesk" },
    update: {},
    create: {
      id: "digitaldesk-org-id",
      name: "Digital Desk Media",
      slug: "digitaldesk",
    },
  });

  console.log("✅ Organizations seeded successfully!");
}

seedOrganizations()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
