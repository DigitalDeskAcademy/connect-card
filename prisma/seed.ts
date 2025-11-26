/**
 * Church Connect Card - Comprehensive Seed Script
 *
 * Creates complete test data for all active features:
 * - Organizations & Locations (multi-campus setup)
 * - Users & Better Auth (all roles with OTP login)
 * - Church Members (visitors, members, volunteers, staff)
 * - Connect Cards & Batches (ready for review queue UI)
 * - Prayer Requests (various states and privacy levels)
 * - Volunteers (basic profiles with background checks)
 * - LMS Courses (platform + church-specific training)
 *
 * Run: pnpm seed:all
 */

import { PrismaClient } from "../lib/generated/prisma";
import { stripe } from "../lib/stripe.js";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Generate Better Auth compatible user ID
 */
function generateUserId(): string {
  return `user_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Generate account ID for Better Auth
 */
function generateAccountId(): string {
  return `account_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Create Stripe customer for user
 */
async function createStripeCustomer(
  email: string,
  name: string
): Promise<string> {
  console.log(`💳 Creating Stripe customer: ${email}`);

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      environment: "development",
    },
  });

  return customer.id;
}

/**
 * Clean up existing Stripe test customers
 */
async function cleanupStripeCustomers(emails: string[]) {
  console.log(`🧹 Cleaning up Stripe test customers...`);

  const customers = await stripe.customers.list({ limit: 100 });
  const testCustomers = customers.data.filter(c =>
    emails.includes(c.email || "")
  );

  if (testCustomers.length > 0) {
    console.log(`🗑️  Deleting ${testCustomers.length} test customers...`);
    for (const customer of testCustomers) {
      await stripe.customers.del(customer.id);
    }
    console.log(`✅ Stripe cleanup completed`);
  } else {
    console.log(`✅ No test customers to clean up`);
  }
}

async function main() {
  console.log("🌱 Starting Church Connect Card comprehensive seed...\n");

  const testEmails = [
    "platform@test.com",
    "test@playwright.dev",
    "admin@newlife.test",
    "staff@newlife.test",
  ];

  // Clean up Stripe customers
  await cleanupStripeCustomers(testEmails);

  // ============================================================================
  // PHASE 1: ORGANIZATIONS & LOCATIONS
  // ============================================================================

  console.log("\n🏢 Creating organizations...");

  const platformOrg = await prisma.organization.upsert({
    where: { slug: "connect-card-platform" },
    update: {},
    create: {
      id: "platform-org-id",
      name: "Connect Card Platform",
      slug: "connect-card-platform",
      type: "PLATFORM",
      subscriptionStatus: "ACTIVE",
    },
  });
  console.log(`✅ ${platformOrg.name}`);

  const newlifeOrg = await prisma.organization.upsert({
    where: { slug: "newlife" },
    update: {},
    create: {
      id: "newlife-org-id",
      name: "Newlife Church",
      slug: "newlife",
      type: "CHURCH",
      subscriptionStatus: "ACTIVE",
    },
  });
  console.log(`✅ ${newlifeOrg.name}`);

  console.log("\n📍 Creating campus locations...");

  const locations = [
    { name: "Bainbridge", slug: "bainbridge" },
    { name: "Bremerton", slug: "bremerton" },
    { name: "Silverdale", slug: "silverdale" },
    { name: "Port Orchard", slug: "port-orchard" },
    { name: "Poulsbo", slug: "poulsbo" },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: {
        organizationId_slug: {
          organizationId: newlifeOrg.id,
          slug: loc.slug,
        },
      },
      update: {},
      create: {
        organizationId: newlifeOrg.id,
        name: loc.name,
        slug: loc.slug,
        isActive: true,
      },
    });
    console.log(`   ✅ ${loc.name}`);
  }

  // Get location IDs for assignments
  const bainbridge = await prisma.location.findFirst({
    where: { organizationId: newlifeOrg.id, slug: "bainbridge" },
  });
  const bremerton = await prisma.location.findFirst({
    where: { organizationId: newlifeOrg.id, slug: "bremerton" },
  });
  const silverdale = await prisma.location.findFirst({
    where: { organizationId: newlifeOrg.id, slug: "silverdale" },
  });

  if (!bainbridge || !bremerton || !silverdale) {
    throw new Error("Failed to create locations");
  }

  // ============================================================================
  // PHASE 2: USERS & BETTER AUTH
  // ============================================================================

  console.log("\n👥 Creating users with Better Auth accounts...");

  const users = [
    {
      email: "platform@test.com",
      name: "Platform Admin",
      role: "platform_admin" as const,
      organizationId: platformOrg.id,
      defaultLocationId: null,
      canSeeAllLocations: false,
      memberRole: "owner",
    },
    {
      email: "test@playwright.dev",
      name: "Church Owner",
      role: "church_owner" as const,
      organizationId: newlifeOrg.id,
      defaultLocationId: bainbridge.id,
      canSeeAllLocations: false, // Owners see all via logic
      memberRole: "owner",
    },
    {
      email: "admin@newlife.test",
      name: "Church Admin",
      role: "church_admin" as const,
      organizationId: newlifeOrg.id,
      defaultLocationId: bainbridge.id,
      canSeeAllLocations: true, // Multi-campus admin
      memberRole: "admin",
    },
    {
      email: "staff@newlife.test",
      name: "Church Staff",
      role: "user" as const,
      organizationId: newlifeOrg.id,
      defaultLocationId: bremerton.id,
      canSeeAllLocations: false, // Single-campus staff
      memberRole: "member",
    },
  ];

  const userIds: Record<string, string> = {};

  for (const userData of users) {
    const userId = generateUserId();
    const stripeCustomerId = await createStripeCustomer(
      userData.email,
      userData.name
    );

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        role: userData.role,
        organizationId: userData.organizationId,
        defaultLocationId: userData.defaultLocationId,
        canSeeAllLocations: userData.canSeeAllLocations,
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
        defaultLocationId: userData.defaultLocationId,
        canSeeAllLocations: userData.canSeeAllLocations,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      },
    });

    userIds[userData.email] = user.id;

    // CRITICAL: Create Better Auth Account record for OTP login
    const accountId = generateAccountId();
    await prisma.account.upsert({
      where: {
        id: accountId,
      },
      update: {},
      create: {
        id: accountId,
        userId: user.id,
        accountId: userData.email,
        providerId: "credential", // Better Auth OTP provider
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create organization membership
    await prisma.member.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: userData.organizationId,
        },
      },
      update: {},
      create: {
        organizationId: userData.organizationId,
        userId: user.id,
        role: userData.memberRole,
        createdAt: new Date(),
      },
    });

    console.log(`✅ ${userData.name} (${userData.role})`);
  }

  // ============================================================================
  // PHASE 3: CHURCH MEMBERS (People in the church)
  // ============================================================================

  console.log("\n👨‍👩‍👧‍👦 Creating church members...");

  const members = [
    {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+12065551001",
      memberType: "VISITOR",
      locationId: bainbridge.id,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+12065551002",
      memberType: "VISITOR",
      locationId: bainbridge.id,
    },
    {
      name: "Mike Davis",
      email: "mike.d@email.com",
      phone: "+12065551003",
      memberType: "RETURNING",
      locationId: bremerton.id,
    },
    {
      name: "Emily Wilson",
      email: "emily.w@email.com",
      phone: "+12065551004",
      memberType: "RETURNING",
      locationId: bremerton.id,
    },
    {
      name: "David Brown",
      email: "david.brown@email.com",
      phone: "+12065551005",
      memberType: "MEMBER",
      locationId: bainbridge.id,
    },
    {
      name: "Lisa Anderson",
      email: "lisa.a@email.com",
      phone: "+12065551006",
      memberType: "MEMBER",
      locationId: bremerton.id,
    },
    {
      name: "Chris Taylor",
      email: "chris.t@email.com",
      phone: "+12065551007",
      memberType: "VOLUNTEER",
      locationId: silverdale.id,
    },
    {
      name: "Jessica Lee",
      email: "jessica.lee@email.com",
      phone: "+12065551008",
      memberType: "VOLUNTEER",
      locationId: bainbridge.id,
    },
    {
      name: "Mark Wilson",
      email: "mark.w@email.com",
      phone: "+12065551009",
      memberType: "VOLUNTEER",
      locationId: bremerton.id,
    },
    {
      name: "Amy Thompson",
      email: "amy.t@email.com",
      phone: "+12065551010",
      memberType: "STAFF",
      locationId: bainbridge.id,
    },
  ];

  const memberIds: Record<string, string> = {};

  for (const memberData of members) {
    const member = await prisma.churchMember.create({
      data: {
        organizationId: newlifeOrg.id,
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        memberType: memberData.memberType as any,
        visitDate:
          memberData.memberType === "VISITOR" ? new Date("2025-11-03") : null,
        memberSince:
          memberData.memberType === "MEMBER" ? new Date("2023-01-15") : null,
      },
    });

    memberIds[memberData.name] = member.id;
    console.log(`   ✅ ${memberData.name} (${memberData.memberType})`);
  }

  // ============================================================================
  // PHASE 4: CONNECT CARDS & BATCHES
  // ============================================================================

  console.log("\n📋 Creating connect card batches...");

  const batch1 = await prisma.connectCardBatch.create({
    data: {
      organizationId: newlifeOrg.id,
      locationId: bainbridge.id,
      uploadedBy: userIds["admin@newlife.test"],
      name: "Bainbridge - Nov 3, 2025",
      cardCount: 5,
      status: "IN_REVIEW",
      notes: "Sunday morning service",
    },
  });
  console.log(`✅ ${batch1.name} (IN_REVIEW)`);

  const batch2 = await prisma.connectCardBatch.create({
    data: {
      organizationId: newlifeOrg.id,
      locationId: bremerton.id,
      uploadedBy: userIds["staff@newlife.test"],
      name: "Bremerton - Nov 10, 2025",
      cardCount: 5,
      status: "PENDING",
      notes: "Sunday evening service",
    },
  });
  console.log(`✅ ${batch2.name} (PENDING)`);

  console.log("\n📄 Creating connect cards...");

  const cards = [
    // Batch 1: Bainbridge (IN_REVIEW) - Cards ready for review queue
    {
      batchId: batch1.id,
      locationId: bainbridge.id,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+12065551001",
      status: "EXTRACTED",
      prayerRequest: "Please pray for my mother's health recovery",
      interests: ["Worship", "Prayer"],
      visitType: "First Visit",
      churchMemberId: memberIds["John Smith"],
    },
    {
      batchId: batch1.id,
      locationId: bainbridge.id,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+12065551002",
      status: "EXTRACTED",
      prayerRequest: null,
      interests: ["Small Groups", "Volunteering"],
      volunteerCategory: "HOSPITALITY",
      visitType: "First Visit",
      churchMemberId: memberIds["Sarah Johnson"],
    },
    {
      batchId: batch1.id,
      locationId: bainbridge.id,
      name: "David Brown",
      email: "david.brown@email.com",
      phone: "+12065551005",
      status: "REVIEWED",
      prayerRequest: "Guidance for career decision",
      interests: ["Bible Study"],
      visitType: "Regular attendee",
      churchMemberId: memberIds["David Brown"],
    },
    {
      batchId: batch1.id,
      locationId: bainbridge.id,
      name: "Jessica Lee",
      email: "jessica.lee@email.com",
      phone: "+12065551008",
      status: "PROCESSED",
      prayerRequest: null,
      interests: ["Kids Ministry", "Volunteering"],
      volunteerCategory: "KIDS_MINISTRY",
      visitType: "Regular attendee",
      churchMemberId: memberIds["Jessica Lee"],
    },
    {
      batchId: batch1.id,
      locationId: bainbridge.id,
      name: "Amy Thompson",
      email: "amy.t@email.com",
      phone: "+12065551010",
      status: "PROCESSED",
      prayerRequest: null,
      interests: ["Leadership"],
      visitType: "Regular attendee",
      churchMemberId: memberIds["Amy Thompson"],
    },
    // Batch 2: Bremerton (PENDING) - Cards awaiting extraction
    {
      batchId: batch2.id,
      locationId: bremerton.id,
      name: "Mike Davis",
      email: "mike.d@email.com",
      phone: "+12065551003",
      status: "EXTRACTED",
      prayerRequest: "Job search guidance",
      interests: ["Worship"],
      visitType: "Second Visit",
      churchMemberId: memberIds["Mike Davis"],
    },
    {
      batchId: batch2.id,
      locationId: bremerton.id,
      name: "Emily Wilson",
      email: "emily.w@email.com",
      phone: "+12065551004",
      status: "EXTRACTED",
      prayerRequest: null,
      interests: ["Small Groups"],
      visitType: "Second Visit",
      churchMemberId: memberIds["Emily Wilson"],
    },
    {
      batchId: batch2.id,
      locationId: bremerton.id,
      name: "Lisa Anderson",
      email: "lisa.a@email.com",
      phone: "+12065551006",
      status: "REVIEWED",
      prayerRequest: "Family unity",
      interests: ["Prayer", "Bible Study"],
      visitType: "Regular attendee",
      churchMemberId: memberIds["Lisa Anderson"],
    },
    {
      batchId: batch2.id,
      locationId: bremerton.id,
      name: "Mark Wilson",
      email: "mark.w@email.com",
      phone: "+12065551009",
      status: "PROCESSED",
      prayerRequest: null,
      interests: ["Worship Team", "Volunteering"],
      volunteerCategory: "WORSHIP_TEAM",
      visitType: "Regular attendee",
      churchMemberId: memberIds["Mark Wilson"],
    },
    {
      batchId: batch2.id,
      locationId: bremerton.id,
      name: "Chris Taylor",
      email: "chris.t@email.com",
      phone: "+12065551007",
      status: "REJECTED",
      prayerRequest: null,
      interests: [],
      visitType: null,
      churchMemberId: null, // Rejected, no member created
    },
  ];

  for (const cardData of cards) {
    await prisma.connectCard.create({
      data: {
        organizationId: newlifeOrg.id,
        batchId: cardData.batchId,
        locationId: cardData.locationId,
        imageKey: `test-cards/${cardData.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
        imageHash: crypto
          .createHash("sha256")
          .update(cardData.name)
          .digest("hex"),
        name: cardData.name,
        email: cardData.email,
        phone: cardData.phone,
        prayerRequest: cardData.prayerRequest,
        visitType: cardData.visitType,
        interests: cardData.interests,
        volunteerCategory: cardData.volunteerCategory || null,
        status: cardData.status as any,
        churchMemberId: cardData.churchMemberId || null,
        scannedBy: userIds["admin@newlife.test"],
        scannedAt: new Date("2025-11-03"),
        extractedData: {
          name: cardData.name,
          email: cardData.email,
          phone: cardData.phone,
          prayer_request: cardData.prayerRequest,
          visit_status: cardData.visitType,
          interests: cardData.interests,
          volunteer_category: cardData.volunteerCategory,
        },
      },
    });
    console.log(`   ✅ ${cardData.name} (${cardData.status})`);
  }

  // ============================================================================
  // PHASE 5: PRAYER REQUESTS
  // ============================================================================

  console.log("\n🙏 Creating prayer requests...");

  const prayers = [
    {
      request: "Please pray for my mother's health recovery after surgery",
      category: "Health",
      privacyLevel: "PUBLIC",
      status: "PENDING",
      isUrgent: true,
      locationId: bainbridge.id,
      submittedBy: "John Smith",
      submitterEmail: "john.smith@email.com",
      assignedToId: null,
    },
    {
      request: "Pray for my marriage restoration and healing",
      category: "Family",
      privacyLevel: "MEMBERS_ONLY",
      status: "ASSIGNED",
      isUrgent: false,
      locationId: bremerton.id,
      submittedBy: "Mike Davis",
      submitterEmail: "mike.d@email.com",
      assignedToId: userIds["admin@newlife.test"],
    },
    {
      request: "Salvation for my brother who is far from God",
      category: "Salvation",
      privacyLevel: "PUBLIC",
      status: "PRAYING",
      isUrgent: false,
      locationId: bainbridge.id,
      submittedBy: "Sarah Johnson",
      submitterEmail: "sarah.j@email.com",
      assignedToId: userIds["test@playwright.dev"],
    },
    {
      request: "Job search guidance and wisdom in career decisions",
      category: "Work/Career",
      privacyLevel: "LEADERSHIP",
      status: "PRAYING",
      isUrgent: false,
      locationId: silverdale.id,
      submittedBy: "David Brown",
      submitterEmail: "david.brown@email.com",
      assignedToId: userIds["admin@newlife.test"],
    },
    {
      request: "Financial breakthrough and provision for our family",
      category: "Financial",
      privacyLevel: "PUBLIC",
      status: "ANSWERED",
      isUrgent: false,
      locationId: bremerton.id,
      submittedBy: "Emily Wilson",
      submitterEmail: "emily.w@email.com",
      assignedToId: userIds["test@playwright.dev"],
      answeredDate: new Date("2025-11-15"),
    },
    {
      request: "Healing from surgery and quick recovery",
      category: "Health",
      privacyLevel: "MEMBERS_ONLY",
      status: "ANSWERED",
      isUrgent: true,
      locationId: bainbridge.id,
      submittedBy: "Lisa Anderson",
      submitterEmail: "lisa.a@email.com",
      assignedToId: userIds["admin@newlife.test"],
      answeredDate: new Date("2025-11-18"),
    },
    {
      request: "Struggling with relationships at work",
      category: "Relationships",
      privacyLevel: "PRIVATE",
      status: "ASSIGNED",
      isUrgent: false,
      locationId: bremerton.id,
      submittedBy: "Mark Wilson",
      submitterEmail: "mark.w@email.com",
      assignedToId: userIds["test@playwright.dev"],
    },
    {
      request: "Growth in my walk with Christ and deeper understanding",
      category: "Spiritual Growth",
      privacyLevel: "PUBLIC",
      status: "ARCHIVED",
      isUrgent: false,
      locationId: silverdale.id,
      submittedBy: "Chris Taylor",
      submitterEmail: "chris.t@email.com",
      assignedToId: null,
    },
    {
      request: "Unity in our family during difficult times",
      category: "Family",
      privacyLevel: "MEMBERS_ONLY",
      status: "PENDING",
      isUrgent: false,
      locationId: bainbridge.id,
      submittedBy: "Jessica Lee",
      submitterEmail: "jessica.lee@email.com",
      assignedToId: null,
    },
    {
      request: "Direction and clarity for major life decision",
      category: "Other",
      privacyLevel: "LEADERSHIP",
      status: "PRAYING",
      isUrgent: true,
      locationId: bremerton.id,
      submittedBy: "Amy Thompson",
      submitterEmail: "amy.t@email.com",
      assignedToId: userIds["admin@newlife.test"],
    },
  ];

  for (const prayer of prayers) {
    // Map privacy levels to simple boolean
    // PUBLIC/MEMBERS_ONLY = false (visible to prayer team)
    // LEADERSHIP/PRIVATE = true (restricted visibility)
    const isPrivate =
      prayer.privacyLevel === "LEADERSHIP" || prayer.privacyLevel === "PRIVATE";

    await prisma.prayerRequest.create({
      data: {
        organizationId: newlifeOrg.id,
        locationId: prayer.locationId,
        request: prayer.request,
        category: prayer.category as any,
        isPrivate: isPrivate,
        status: prayer.status as any,
        isUrgent: prayer.isUrgent,
        submittedBy: prayer.submittedBy,
        submitterEmail: prayer.submitterEmail,
        assignedToId: prayer.assignedToId,
        answeredDate: prayer.answeredDate || null,
      },
    });
    console.log(
      `   ✅ ${prayer.submittedBy} - ${prayer.category} (${prayer.status})`
    );
  }

  // ============================================================================
  // PHASE 6: VOLUNTEERS
  // ============================================================================

  console.log("\n🙋 Creating volunteers...");

  const volunteers = [
    {
      member: memberIds["Chris Taylor"],
      category: "GREETER",
      status: "ACTIVE",
      backgroundCheck: "CLEARED",
      backgroundCheckDate: new Date("2024-06-01"),
      backgroundCheckExpiry: new Date("2026-06-01"),
      emergencyName: "Jane Taylor",
      emergencyPhone: "+12065559001",
      locationId: silverdale.id,
    },
    {
      member: memberIds["Jessica Lee"],
      category: "KIDS_MINISTRY",
      status: "ACTIVE",
      backgroundCheck: "CLEARED",
      backgroundCheckDate: new Date("2023-12-15"),
      backgroundCheckExpiry: new Date("2025-12-15"),
      emergencyName: "Mike Lee",
      emergencyPhone: "+12065559002",
      locationId: bainbridge.id,
    },
    {
      member: memberIds["Mark Wilson"],
      category: "WORSHIP_TEAM",
      status: "ACTIVE",
      backgroundCheck: "IN_PROGRESS",
      backgroundCheckDate: null,
      backgroundCheckExpiry: null,
      emergencyName: "Sarah Wilson",
      emergencyPhone: "+12065559003",
      locationId: bremerton.id,
    },
    {
      member: memberIds["Sarah Johnson"],
      category: "HOSPITALITY",
      status: "PENDING_APPROVAL",
      backgroundCheck: "NOT_STARTED",
      backgroundCheckDate: null,
      backgroundCheckExpiry: null,
      emergencyName: "Tom Johnson",
      emergencyPhone: "+12065559004",
      locationId: bainbridge.id,
    },
  ];

  for (const vol of volunteers) {
    // Get member data
    const member = await prisma.churchMember.findUnique({
      where: { id: vol.member },
    });

    if (!member) continue;

    await prisma.volunteer.create({
      data: {
        organizationId: newlifeOrg.id,
        locationId: vol.locationId,
        churchMemberId: vol.member,
        status: vol.status as any,
        startDate: new Date("2024-01-15"),
        emergencyContactName: vol.emergencyName,
        emergencyContactPhone: vol.emergencyPhone,
        backgroundCheckStatus: vol.backgroundCheck as any,
        backgroundCheckDate: vol.backgroundCheckDate,
        backgroundCheckExpiry: vol.backgroundCheckExpiry,
        categories: {
          create: {
            category: vol.category as any,
            organizationId: newlifeOrg.id,
          },
        },
      },
    });
    console.log(`   ✅ ${member.name} - ${vol.category} (${vol.status})`);
  }

  // ============================================================================
  // PHASE 7: LMS (Learning Management System)
  // ============================================================================

  console.log("\n📚 Creating LMS courses...");

  // Platform course (visible to all)
  const platformCourse = await prisma.course.create({
    data: {
      title: "Platform Essentials",
      description: "Learn the basics of Church Connect Card platform",
      smallDescription: "Essential platform training for all users",
      fileKey: "courses/platform-essentials/thumbnail.jpg",
      price: 0,
      isFree: true,
      duration: 60,
      level: "Core",
      category: "Essentials",
      slug: "platform-essentials",
      status: "Published",
      userId: userIds["platform@test.com"],
      organizationId: null, // Platform course
      isPlatformCourse: true,
      s3Prefix: "courses/platform-essentials/",
    },
  });
  console.log(`✅ ${platformCourse.title} (Platform)`);

  // Newlife church courses
  const memberCourse = await prisma.course.create({
    data: {
      title: "New Member Orientation",
      description:
        "Welcome to Newlife Church! Learn about our mission, values, and community.",
      smallDescription: "Essential orientation for new members",
      fileKey: "courses/new-member-orientation/thumbnail.jpg",
      price: 0,
      isFree: true,
      duration: 90,
      level: "Beginner",
      category: "Essentials",
      slug: "new-member-orientation",
      status: "Published",
      userId: userIds["test@playwright.dev"],
      organizationId: newlifeOrg.id,
      s3Prefix: "courses/new-member-orientation/",
    },
  });
  console.log(`✅ ${memberCourse.title} (Newlife)`);

  const leadershipCourse = await prisma.course.create({
    data: {
      title: "Leadership Training",
      description:
        "Advanced training for ministry leaders and volunteer coordinators",
      smallDescription: "Develop your leadership skills",
      fileKey: "courses/leadership-training/thumbnail.jpg",
      price: 0,
      isFree: true,
      duration: 120,
      level: "Intermediate",
      category: "Agency Operations",
      slug: "leadership-training",
      status: "Draft",
      userId: userIds["test@playwright.dev"],
      organizationId: newlifeOrg.id,
      s3Prefix: "courses/leadership-training/",
    },
  });
  console.log(`✅ ${leadershipCourse.title} (Newlife - Draft)`);

  console.log("\n📖 Creating chapters and lessons...");

  // Platform course chapters
  const ch1 = await prisma.chapter.create({
    data: {
      courseId: platformCourse.id,
      slug: "getting-started",
      title: "Getting Started",
      position: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: ch1.id,
      slug: "introduction",
      title: "Platform Introduction",
      position: 1,
      videoKey: "courses/platform-essentials/lesson-1.mp4",
      s3Prefix: "courses/platform-essentials/lesson-1/",
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: ch1.id,
      slug: "navigation",
      title: "Navigating the Dashboard",
      position: 2,
      videoKey: "courses/platform-essentials/lesson-2.mp4",
      s3Prefix: "courses/platform-essentials/lesson-2/",
    },
  });

  // Member orientation chapters
  const ch2 = await prisma.chapter.create({
    data: {
      courseId: memberCourse.id,
      slug: "welcome",
      title: "Welcome to Newlife",
      position: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: ch2.id,
      slug: "our-story",
      title: "Our Church Story",
      position: 1,
      videoKey: "courses/new-member-orientation/lesson-1.mp4",
      s3Prefix: "courses/new-member-orientation/lesson-1/",
    },
  });

  await prisma.lesson.create({
    data: {
      chapterId: ch2.id,
      slug: "mission-values",
      title: "Mission and Values",
      position: 2,
      videoKey: "courses/new-member-orientation/lesson-2.mp4",
      s3Prefix: "courses/new-member-orientation/lesson-2/",
    },
  });

  console.log(`✅ 2 courses, 2 chapters, 4 lessons created`);

  console.log("\n🎓 Creating course enrollments...");

  // Enroll users in courses
  await prisma.enrollment.create({
    data: {
      courseId: platformCourse.id,
      userId: userIds["admin@newlife.test"],
      amount: 0,
      status: "Active",
    },
  });

  await prisma.enrollment.create({
    data: {
      courseId: memberCourse.id,
      userId: userIds["staff@newlife.test"],
      amount: 0,
      status: "Active",
    },
  });

  console.log(`✅ 2 enrollments created`);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("\n" + "=".repeat(60));
  console.log("🎉 COMPREHENSIVE SEED COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));

  console.log("\n📊 SEED SUMMARY:");
  console.log(`   🏢 Organizations: 2 (Platform, Newlife Church)`);
  console.log(`   📍 Locations: 5 (Multi-campus setup)`);
  console.log(`   👤 Staff Users: 4 (All roles with Better Auth)`);
  console.log(
    `   👨‍👩‍👧‍👦 Church Members: 10 (Visitors, Members, Volunteers, Staff)`
  );
  console.log(`   📋 Connect Card Batches: 2 (IN_REVIEW, PENDING)`);
  console.log(`   📄 Connect Cards: 10 (Various states for review queue)`);
  console.log(`   🙏 Prayer Requests: 10 (All statuses, privacy levels)`);
  console.log(`   🙋 Volunteers: 4 (With background checks)`);
  console.log(`   📚 LMS Courses: 3 (Platform + Church-specific)`);
  console.log(`   📖 Chapters: 2, Lessons: 4`);
  console.log(`   🎓 Enrollments: 2\n`);

  console.log("🔐 TEST CREDENTIALS (Email OTP Login):");
  console.log(`   platform@test.com       (Platform Admin)`);
  console.log(`   test@playwright.dev     (Church Owner - All Locations)`);
  console.log(`   admin@newlife.test      (Church Admin - Multi-Campus)`);
  console.log(`   staff@newlife.test      (Church Staff - Bremerton Only)\n`);

  console.log("🌐 LOGIN URLS:");
  console.log(`   Platform: http://localhost:3000/login`);
  console.log(`   Newlife:  http://localhost:3000/church/newlife/login\n`);

  console.log("✅ READY FOR TESTING:");
  console.log(`   📋 Review Queue: /church/newlife/admin/n2n (Review tab)`);
  console.log(`   🙏 Prayer Management: /church/newlife/admin/prayer`);
  console.log(`   🙋 Volunteer Directory: /church/newlife/admin/volunteer`);
  console.log(`   👥 Team Management: /church/newlife/admin/team`);
  console.log(`   📚 Learning Center: /church/newlife/learning\n`);
}

main()
  .catch(e => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
