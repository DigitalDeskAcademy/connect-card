/**
 * Church Connect Card - Role-Based Seed Script
 *
 * Creates test users for each role to enable local development and testing.
 *
 * Users Created:
 * - Platform Admin (platform_admin)
 * - Church Owner (church_owner) - Newlife Church
 * - Church Admin (church_admin) - Newlife Church
 * - Staff Member (user) - Newlife Church
 */

import { PrismaClient } from "../lib/generated/prisma";
import { stripe } from "../lib/stripe.js";
import crypto from "crypto";

const prisma = new PrismaClient();

interface TestUser {
  email: string;
  name: string;
  role: "platform_admin" | "church_owner" | "church_admin" | "user";
  organizationId?: string;
}

/**
 * Generate Better Auth compatible user ID
 */
function generateUserId(): string {
  return `user_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Create Stripe customer for user
 */
async function createStripeCustomer(user: TestUser): Promise<string> {
  console.log(`💳 Creating Stripe customer for: ${user.email}`);

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: generateUserId(),
      role: user.role,
      environment: "development",
    },
  });

  console.log(`✅ Stripe customer created: ${customer.id}`);
  return customer.id;
}

/**
 * Clean up existing Stripe test customers
 */
async function cleanupStripeCustomers(emails: string[]) {
  console.log(`🧹 Cleaning up existing test Stripe customers...`);

  const customers = await stripe.customers.list({ limit: 100 });
  const testCustomers = customers.data.filter(c =>
    emails.includes(c.email || "")
  );

  if (testCustomers.length > 0) {
    console.log(`🗑️  Deleting ${testCustomers.length} test customers...`);
    for (const customer of testCustomers) {
      await stripe.customers.del(customer.id);
      console.log(`   Deleted: ${customer.email}`);
    }
    console.log(`✅ Stripe customer cleanup completed`);
  } else {
    console.log(`✅ No existing test customers to clean up`);
  }
}

async function main() {
  console.log("🌱 Starting Church Connect Card seed...\n");

  // Define test users
  const testEmails = [
    "digitaldeskacademy@outlook.com",
    "owner@newlife.com",
    "admin@newlife.com",
    "staff@newlife.com",
  ];

  // Clean up existing Stripe customers
  await cleanupStripeCustomers(testEmails);

  console.log("\n🏢 Creating Newlife Church organization...");

  // Create Newlife Church organization
  const newlifeOrg = await prisma.organization.upsert({
    where: { slug: "newlife" },
    update: {},
    create: {
      id: "newlife-church-org-id",
      name: "Newlife Church",
      slug: "newlife",
      type: "CHURCH",
      subscriptionStatus: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(
    `✅ Created organization: ${newlifeOrg.name} (${newlifeOrg.slug})`
  );

  // Create platform organization for platform admin
  const platformOrg = await prisma.organization.upsert({
    where: { slug: "connect-card-platform" },
    update: {},
    create: {
      id: "connect-card-platform-org-id",
      name: "Connect Card Platform",
      slug: "connect-card-platform",
      type: "CHURCH",
      subscriptionStatus: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(
    `✅ Created organization: ${platformOrg.name} (${platformOrg.slug})\n`
  );

  // Define users with roles
  const users: TestUser[] = [
    {
      email: "digitaldeskacademy@outlook.com",
      name: "Platform Administrator",
      role: "platform_admin",
      organizationId: platformOrg.id,
    },
    {
      email: "owner@newlife.com",
      name: "Senior Pastor",
      role: "church_owner",
      organizationId: newlifeOrg.id,
    },
    {
      email: "admin@newlife.com",
      name: "Youth Pastor",
      role: "church_admin",
      organizationId: newlifeOrg.id,
    },
    {
      email: "staff@newlife.com",
      name: "Volunteer Coordinator",
      role: "user",
      organizationId: newlifeOrg.id,
    },
  ];

  console.log(`👥 Creating ${users.length} test users...\n`);

  for (const userData of users) {
    console.log(`👤 Creating user: ${userData.name} (${userData.email})`);
    console.log(`   Role: ${userData.role}`);

    const userId = generateUserId();
    console.log(`   User ID: ${userId}`);

    // Create Stripe customer
    const stripeCustomerId = await createStripeCustomer(userData);

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        role: userData.role,
        organizationId: userData.organizationId,
        stripeCustomerId,
        emailVerified: true,
      },
      create: {
        id: userId,
        email: userData.email,
        name: userData.name,
        emailVerified: true,
        role: userData.role,
        stripeCustomerId,
        organizationId: userData.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      },
    });

    console.log(`   ✅ User created with ID: ${user.id}`);
    console.log(`   📧 Login via OTP: User will authenticate on first sign-in`);

    // Map user role to member role for organization membership
    // User.role is for platform-level permissions
    // Member.role is for organization-level permissions
    const memberRole =
      userData.role === "church_owner"
        ? "owner"
        : userData.role === "church_admin"
          ? "admin"
          : "member";

    // Create organization membership
    await prisma.member.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: userData.organizationId!,
        },
      },
      update: {
        role: memberRole, // Update role if re-seeding
      },
      create: {
        organizationId: userData.organizationId!,
        userId: user.id,
        role: memberRole,
        createdAt: new Date(),
      },
    });

    console.log(`   ✅ Organization membership created (${memberRole})\n`);
  }

  console.log("🎉 Church Connect Card seed completed successfully!\n");

  console.log("📊 Summary:");
  console.log(`   🏢 Organizations: 2 (Newlife Church, Connect Card Platform)`);
  console.log(`   👤 Platform Admins: 1`);
  console.log(`   🏛️  Church Owners: 1`);
  console.log(`   👨‍💼 Church Admins: 1`);
  console.log(`   👥 Staff Members: 1\n`);

  console.log("🔐 Test Credentials (use email for OTP login):");
  console.log(`   digitaldeskacademy@outlook.com  (platform_admin)`);
  console.log(`   owner@newlife.com               (church_owner)`);
  console.log(`   admin@newlife.com               (church_admin)`);
  console.log(`   staff@newlife.com               (user/staff)\n`);

  console.log("🌐 Login URLs:");
  console.log(`   Platform Admin: http://localhost:3000/login`);
  console.log(
    `   Newlife Church: http://localhost:3000/church/newlife/login\n`
  );
}

main()
  .catch(e => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
