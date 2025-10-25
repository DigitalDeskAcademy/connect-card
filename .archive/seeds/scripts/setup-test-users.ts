/**
 * Test User Setup Script
 *
 * Sets up test users with proper organization assignments and Member records
 * for testing multi-tenant functionality.
 *
 * Run with: npx tsx scripts/setup-test-users.ts
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

interface TestUserSetup {
  email: string;
  name: string;
  role: "platform_admin" | "agency_owner" | "agency_admin" | "user";
  organizationId?: string;
  memberRole?: "owner" | "admin" | "member";
}

const testUsers: TestUserSetup[] = [
  {
    email: "admin@sidecarplatform.com",
    name: "Platform Admin",
    role: "platform_admin",
    organizationId: "sidecar-platform-org-id",
    memberRole: "owner",
  },
  {
    email: "agency.owner@digitaldesk.com",
    name: "Agency Owner",
    role: "agency_owner",
    organizationId: "digitaldesk-org-id",
    memberRole: "owner",
  },
  {
    email: "agency.admin@digitaldesk.com",
    name: "Agency Admin",
    role: "agency_admin",
    organizationId: "digitaldesk-org-id",
    memberRole: "admin",
  },
  {
    email: "clinic.owner@ivtherapy.com",
    name: "Sarah Johnson",
    role: "user",
    organizationId: "digitaldesk-org-id",
    memberRole: "member",
  },
];

async function setupTestUsers() {
  console.log("🚀 Setting up test users with organizations...\n");

  // First, ensure organizations exist
  console.log("📋 Ensuring organizations exist...");

  await prisma.organization.upsert({
    where: { id: "sidecar-platform-org-id" },
    update: {},
    create: {
      id: "sidecar-platform-org-id",
      name: "SideCar Platform",
      slug: "sidecar",
      type: "PLATFORM",
      subscriptionStatus: "ACTIVE",
    },
  });

  await prisma.organization.upsert({
    where: { id: "digitaldesk-org-id" },
    update: {},
    create: {
      id: "digitaldesk-org-id",
      name: "Digital Desk Media",
      slug: "digitaldesk",
      type: "AGENCY",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log("✅ Organizations ready\n");

  // Set up each test user
  for (const testUser of testUsers) {
    console.log(`👤 Processing ${testUser.email}...`);

    try {
      // Generate a deterministic ID based on email for consistency
      const userId = `test-user-${testUser.email.replace(/[@.]/g, "-")}`;

      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: testUser.email },
        update: {
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId || undefined,
        },
        create: {
          id: userId,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          organizationId: testUser.organizationId || undefined,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`  ✓ User created/updated with ID: ${user.id}`);

      // Create Member record if organizationId is provided
      if (testUser.organizationId && testUser.memberRole) {
        await prisma.member.upsert({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: testUser.organizationId,
            },
          },
          update: {
            role: testUser.memberRole,
          },
          create: {
            userId: user.id,
            organizationId: testUser.organizationId,
            role: testUser.memberRole,
          },
        });

        console.log(
          `  ✓ Member record created with role: ${testUser.memberRole}`
        );
      }

      // Create a test session for easy access (optional)
      const sessionToken = `test-session-${user.id}`;
      await prisma.session.upsert({
        where: { id: sessionToken },
        update: {
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          activeOrganizationId: testUser.organizationId,
          updatedAt: new Date(),
        },
        create: {
          id: sessionToken,
          userId: user.id,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          activeOrganizationId: testUser.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`  ✓ Test session created: ${sessionToken}\n`);
    } catch (error) {
      console.error(`  ✗ Error processing ${testUser.email}:`, error);
    }
  }

  console.log("\n✨ Test user setup complete!\n");
  console.log("📝 Test Login Instructions:");
  console.log("============================");
  console.log("1. Go to http://localhost:3000/login");
  console.log("2. Enter one of these emails:");
  testUsers.forEach(u => {
    const roleDisplay = u.role === "user" ? "user/Customer" : u.role;
    console.log(`   - ${u.email} (${roleDisplay})`);
  });
  console.log("3. Click 'Send Verification Code'");
  console.log("4. Check your terminal for the OTP code (development mode)");
  console.log("5. Enter the code on the verification page\n");

  console.log("🔑 Access Routes:");
  console.log("==================");
  console.log("Platform Admin: /platform/admin");
  console.log("Agency Admin: /agency/digitaldesk/admin");
  console.log("Agency Courses: /agency/digitaldesk/admin/courses");
  console.log("Student Dashboard: /my-learning");
}

setupTestUsers()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
