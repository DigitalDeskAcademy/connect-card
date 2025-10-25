import { PrismaClient } from "../lib/generated/prisma";
import { stripe } from "../lib/stripe.js";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Production-Ready User Seed Script
 *
 * Creates 3 test users matching production authentication flow:
 * - Platform Admin: digitaldeskacademy@outlook.com
 * - Church Owner: agency@sidecaronboarding.com
 * - End User: enduser@sidecaronboarding.com
 */

interface TestUser {
  email: string;
  name: string;
  role: "platform_admin" | "church_owner" | "user";
  organizationId?: string;
}

const testUsers: TestUser[] = [
  {
    email: "digitaldeskacademy@outlook.com",
    name: "Platform Administrator",
    role: "platform_admin",
    organizationId: "sidecar-platform-org-id",
  },
  {
    email: "agency@sidecaronboarding.com",
    name: "Church Owner",
    role: "church_owner",
    organizationId: "digitaldesk-org-id",
  },
  {
    email: "enduser@sidecaronboarding.com",
    name: "End User",
    role: "user",
    organizationId: "digitaldesk-org-id", // Assigned to DigitalDesk agency for testing
  },
];

/**
 * Generate Better Auth compatible user ID
 * Matches production flow: random UUID-like string
 */
function generateUserId(): string {
  return `user_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Clean up existing Stripe test customers
 */
async function cleanupStripeTestCustomers() {
  console.log("🧹 Cleaning up existing test Stripe customers...");

  try {
    const customers = await stripe.customers.list({ limit: 100 });
    const testCustomers = customers.data.filter(
      customer =>
        customer.metadata?.isTestData === "true" ||
        customer.metadata?.source === "seed"
    );

    if (testCustomers.length === 0) {
      console.log("✅ No test customers found to clean up");
      return;
    }

    console.log(`🗑️  Deleting ${testCustomers.length} test customers...`);

    for (const customer of testCustomers) {
      await stripe.customers.del(customer.id);
      console.log(`   Deleted: ${customer.email || customer.name}`);
    }

    console.log("✅ Stripe customer cleanup completed");
  } catch (error) {
    console.warn(
      "⚠️  Stripe customer cleanup failed (continuing anyway):",
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Create Stripe customer with test metadata
 */
async function createStripeCustomer(user: TestUser): Promise<string | null> {
  try {
    console.log(`💳 Creating Stripe customer for: ${user.email}`);

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        isTestData: "true",
        source: "seed",
        role: user.role,
      },
    });

    console.log(`✅ Stripe customer created: ${customer.id}`);
    return customer.id;
  } catch (error) {
    console.warn(
      `⚠️  Failed to create Stripe customer for ${user.email}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Note: We do NOT create Account records in seed
 *
 * Better Auth automatically creates Account records when users first log in via:
 * - Email OTP (primary method)
 * - Google OAuth (coming soon)
 * - GitHub OAuth (optional)
 *
 * This approach is cleaner and matches production user flow exactly.
 */

/**
 * Create organization membership for agency owner
 */
async function createOrganizationMembership(
  userId: string,
  organizationId: string,
  role: string
): Promise<void> {
  try {
    await prisma.member.upsert({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId,
        },
      },
      update: {
        role: role,
      },
      create: {
        id: `member_${crypto.randomUUID()}`,
        userId: userId,
        organizationId: organizationId,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`   ✅ Organization membership created (${role})`);
  } catch (error) {
    console.warn(
      `   ⚠️  Failed to create membership:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function seedUsers() {
  try {
    console.log("🌱 Starting production-ready user seeding...\n");

    // Clean up existing test data
    await cleanupStripeTestCustomers();

    console.log(`\n👥 Creating ${testUsers.length} test users...\n`);

    for (const userData of testUsers) {
      console.log(`👤 Creating user: ${userData.name} (${userData.email})`);
      console.log(`   Role: ${userData.role}`);

      // Generate production-like user ID
      const userId = generateUserId();
      console.log(`   User ID: ${userId}`);

      // Create Stripe customer
      const stripeCustomerId = await createStripeCustomer(userData);

      // Upsert user in database
      const user = await prisma.user.upsert({
        where: {
          email: userData.email,
        },
        update: {
          role: userData.role,
          organizationId: userData.organizationId,
          stripeCustomerId: stripeCustomerId,
          emailVerified: true,
        },
        create: {
          id: userId,
          email: userData.email,
          name: userData.name,
          emailVerified: true,
          role: userData.role,
          stripeCustomerId: stripeCustomerId,
          organizationId: userData.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          banned: false,
        },
      });

      console.log(`   ✅ User created with ID: ${user.id}`);
      console.log(
        `   📧 Login via OTP: User will authenticate on first sign-in`
      );

      // Create organization membership for users with organizations
      if (userData.organizationId) {
        let memberRole = "member"; // Default for end users

        if (userData.role === "agency_owner") {
          memberRole = "owner";
        } else if (userData.role === "agency_admin") {
          memberRole = "admin";
        }

        await createOrganizationMembership(
          user.id,
          userData.organizationId,
          memberRole
        );
      }

      console.log(""); // Empty line for readability
    }

    console.log("🎉 User seeding completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(
      `   👤 Platform Admins: ${testUsers.filter(u => u.role === "platform_admin").length}`
    );
    console.log(
      `   🏢 Agency Owners: ${testUsers.filter(u => u.role === "agency_owner").length}`
    );
    console.log(
      `   👥 End Users: ${testUsers.filter(u => u.role === "user").length}`
    );

    console.log("\n🔐 Test Credentials:");
    testUsers.forEach(user => {
      console.log(`   ${user.email} (${user.role})`);
    });
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsers();
