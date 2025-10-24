import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function seedTestEndUser() {
  try {
    console.log("🌱 Creating test end user...");

    // Find Digital Desk organization
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: "digitaldesk" },
          { slug: "digitaldesk-media" },
          { name: { contains: "Digital Desk" } },
        ],
      },
    });

    if (!org) {
      console.error("❌ Digital Desk organization not found!");
      return;
    }

    // Create or update end user
    const user = await prisma.user.upsert({
      where: { email: "enduser@sidecar.com" },
      update: {
        name: "Test End User",
        role: "user",
        organizationId: org.id,
        emailVerified: true,
        banned: false,
      },
      create: {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: "enduser@sidecar.com",
        name: "Test End User",
        emailVerified: true,
        role: "user",
        organizationId: org.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      },
    });

    console.log("✅ Test end user created!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Organization: ${org.name}`);
    console.log(`   Login URL: http://localhost:3000/agency/${org.slug}/login`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestEndUser();
