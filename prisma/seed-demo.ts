/**
 * Comprehensive Demo Seed - Single File for All Test Data
 *
 * Creates a complete, predictable test environment with:
 * - 1 organization (Newlife Church) with 2 locations
 * - 4 users (platform admin, owner, admin, staff)
 * - 15 connect cards (5 awaiting review, 8 reviewed, 2 with volunteer onboarding)
 * - 5 volunteers at different onboarding stages
 * - 12 prayer requests (4 pending, 5 in progress, 3 answered)
 * - 2 team members with volunteer categories
 *
 * Usage:
 *   pnpm seed:demo
 *
 * Runs in ~3 seconds with predictable, hardcoded data.
 */

import { PrismaClient } from "../lib/generated/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive demo seed...\n");

  // ========================================
  // FOUNDATION: Organization & Locations
  // ========================================
  console.log("📦 Creating organization and locations...");

  const newlifeOrg = await prisma.organization.upsert({
    where: { slug: "newlife" },
    update: {},
    create: {
      name: "Newlife Church",
      slug: "newlife",
      type: "CHURCH",
      subscriptionStatus: "ACTIVE",
    },
  });

  const bainbridgeLocation = await prisma.location.upsert({
    where: {
      organizationId_slug: {
        organizationId: newlifeOrg.id,
        slug: "bainbridge",
      },
    },
    update: {},
    create: {
      name: "Bainbridge Campus",
      slug: "bainbridge",
      organizationId: newlifeOrg.id,
    },
  });

  const bremertonLocation = await prisma.location.upsert({
    where: {
      organizationId_slug: {
        organizationId: newlifeOrg.id,
        slug: "bremerton",
      },
    },
    update: {},
    create: {
      name: "Bremerton Campus",
      slug: "bremerton",
      organizationId: newlifeOrg.id,
    },
  });

  console.log(`   ✅ ${newlifeOrg.name} with 2 locations\n`);

  // ========================================
  // USERS: Platform Admin, Owner, Admin, Staff
  // ========================================
  console.log("👥 Creating users...");

  const platformAdmin = await prisma.user.upsert({
    where: { email: "platform@test.com" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "platform@test.com",
      name: "Platform Admin",
      role: "platform_admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const churchOwner = await prisma.user.upsert({
    where: { email: "test@playwright.dev" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "test@playwright.dev",
      name: "Test Owner",
      role: "church_owner",
      organizationId: newlifeOrg.id,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.member.upsert({
    where: {
      userId_organizationId: {
        userId: churchOwner.id,
        organizationId: newlifeOrg.id,
      },
    },
    update: {},
    create: {
      userId: churchOwner.id,
      organizationId: newlifeOrg.id,
      role: "owner",
    },
  });

  const churchAdmin = await prisma.user.upsert({
    where: { email: "admin@newlife.test" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "admin@newlife.test",
      name: "Admin User",
      role: "church_admin",
      organizationId: newlifeOrg.id,
      emailVerified: true,
      canSeeAllLocations: true, // Multi-campus admin
      volunteerCategories: ["Kids Ministry", "Hospitality"], // Ministry leader
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.member.upsert({
    where: {
      userId_organizationId: {
        userId: churchAdmin.id,
        organizationId: newlifeOrg.id,
      },
    },
    update: {},
    create: {
      userId: churchAdmin.id,
      organizationId: newlifeOrg.id,
      role: "admin",
    },
  });

  const churchStaff = await prisma.user.upsert({
    where: { email: "staff@newlife.test" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: "staff@newlife.test",
      name: "Staff User",
      role: "user",
      organizationId: newlifeOrg.id,
      emailVerified: true,
      canSeeAllLocations: false, // Campus-specific
      defaultLocationId: bainbridgeLocation.id,
      volunteerCategories: ["Worship"], // Worship leader
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.member.upsert({
    where: {
      userId_organizationId: {
        userId: churchStaff.id,
        organizationId: newlifeOrg.id,
      },
    },
    update: {},
    create: {
      userId: churchStaff.id,
      organizationId: newlifeOrg.id,
      role: "member",
    },
  });

  console.log(`   ✅ 4 users created (platform admin, owner, admin, staff)\n`);

  // ========================================
  // CONNECT CARDS: Mix of statuses
  // ========================================
  console.log("📇 Creating connect cards...");

  const now = new Date();
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - now.getDay()); // Go to last Sunday
  lastSunday.setHours(10, 30, 0, 0);

  // AWAITING REVIEW (5 cards - EXTRACTED status)
  const awaitingReviewCards = [
    {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(206) 555-0101",
      visitType: "First Visit",
      interests: ["Volunteering", "Small Groups"],
      volunteerCategory: "Hospitality",
      prayerRequest: null,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(360) 555-0102",
      visitType: "First Visit",
      interests: ["Volunteering"],
      volunteerCategory: "Kids Ministry",
      prayerRequest: "Pray for my daughter's college decision",
    },
    {
      name: "Michael Chen",
      email: "mchen@email.com",
      phone: "(425) 555-0103",
      visitType: "Second Visit",
      interests: ["Prayer Team", "Missions"],
      volunteerCategory: null,
      prayerRequest: "Need prayer for job search",
    },
    {
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "(253) 555-0104",
      visitType: "First Visit",
      interests: ["Worship Team"],
      volunteerCategory: null,
      prayerRequest: "Struggling with anxiety, need peace",
    },
    {
      name: "David Martinez",
      email: "dmartinez@email.com",
      phone: "(206) 555-0105",
      visitType: "Regular attendee",
      interests: ["Small Groups"],
      volunteerCategory: null,
      prayerRequest: null,
    },
  ];

  for (let i = 0; i < awaitingReviewCards.length; i++) {
    const card = awaitingReviewCards[i];
    const scanTime = new Date(lastSunday);
    scanTime.setHours(lastSunday.getHours() + i); // Spread across hours

    await prisma.connectCard.create({
      data: {
        organizationId: newlifeOrg.id,
        locationId: i < 3 ? bainbridgeLocation.id : bremertonLocation.id,
        imageKey: `demo/connect-cards/awaiting-${i + 1}.jpg`,
        name: card.name,
        email: card.email,
        phone: card.phone,
        visitType: card.visitType,
        interests: card.interests,
        volunteerCategory: card.volunteerCategory,
        prayerRequest: card.prayerRequest,
        status: "EXTRACTED", // Awaiting review
        scannedAt: scanTime,
        extractedData: {
          name: card.name,
          email: card.email,
          phone: card.phone,
          visitType: card.visitType,
          interests: card.interests,
          volunteerCategory: card.volunteerCategory,
          prayerRequest: card.prayerRequest,
        },
      },
    });
  }

  // REVIEWED (8 cards - REVIEWED status, clean data)
  const reviewedCards = [
    {
      name: "Lisa Anderson",
      email: "l.anderson@email.com",
      phone: "(360) 555-0201",
      visitType: "First Visit",
      interests: ["Children's Ministry"],
      prayerRequest: "Pray for healing from surgery",
    },
    {
      name: "Robert Taylor",
      email: "rtaylor@email.com",
      phone: "(425) 555-0202",
      visitType: "Second Visit",
      interests: ["Missions", "Small Groups"],
      prayerRequest: null,
    },
    {
      name: "Jennifer Lee",
      email: "jlee@email.com",
      phone: "(253) 555-0203",
      visitType: "Regular attendee",
      interests: ["Hospitality Team"],
      prayerRequest: null,
    },
    {
      name: "Christopher Wilson",
      email: "c.wilson@email.com",
      phone: "(206) 555-0204",
      visitType: "First Visit",
      interests: ["Youth Ministry"],
      prayerRequest: "Family going through difficult time",
    },
    {
      name: "Amanda Brown",
      email: "abrown@email.com",
      phone: "(360) 555-0205",
      visitType: "Member",
      interests: ["Prayer Team", "Counseling Ministry"],
      prayerRequest: null,
    },
    {
      name: "Daniel Garcia",
      email: "dgarcia@email.com",
      phone: "(425) 555-0206",
      visitType: "Second Visit",
      interests: ["Small Groups"],
      prayerRequest: "Pray for wisdom in career decision",
    },
    {
      name: "Michelle Thompson",
      email: "mthompson@email.com",
      phone: "(253) 555-0207",
      visitType: "Regular attendee",
      interests: ["Worship Team", "Prayer Team"],
      prayerRequest: null,
    },
    {
      name: "Kevin White",
      email: "kwhite@email.com",
      phone: "(206) 555-0208",
      visitType: "First Visit",
      interests: ["Missions"],
      prayerRequest: "Need prayer for health issues",
    },
  ];

  for (let i = 0; i < reviewedCards.length; i++) {
    const card = reviewedCards[i];
    const scanTime = new Date(lastSunday);
    scanTime.setDate(lastSunday.getDate() - 1); // Day before
    scanTime.setHours(10 + i);

    await prisma.connectCard.create({
      data: {
        organizationId: newlifeOrg.id,
        locationId: i % 2 === 0 ? bainbridgeLocation.id : bremertonLocation.id,
        imageKey: `demo/connect-cards/reviewed-${i + 1}.jpg`,
        name: card.name,
        email: card.email,
        phone: card.phone,
        visitType: card.visitType,
        interests: card.interests,
        prayerRequest: card.prayerRequest,
        status: "REVIEWED", // Already reviewed
        scannedAt: scanTime,
        extractedData: {
          name: card.name,
          email: card.email,
          phone: card.phone,
          visitType: card.visitType,
          interests: card.interests,
          prayerRequest: card.prayerRequest,
        },
      },
    });
  }

  // VOLUNTEER ONBOARDING (2 cards with volunteer pipeline data)
  const volunteerOnboardingCards = [
    {
      name: "Brandon Miller",
      email: "bmiller@email.com",
      phone: "(360) 555-0301",
      visitType: "Second Visit",
      interests: ["Volunteering"],
      volunteerCategory: "Kids Ministry",
      onboardingStatus: "DOCUMENTS_SHARED",
      documentsSent: {
        "Welcome Email": true,
        "Leader Introduction": true,
        "Background Check Form": true,
        "Safe Sanctuary Policy": true,
      },
      onboardingNotes: "Documents sent 3 days ago, awaiting background check",
      assignedLeader: churchAdmin,
    },
    {
      name: "Rachel Davis",
      email: "rdavis@email.com",
      phone: "(425) 555-0302",
      visitType: "First Visit",
      interests: ["Volunteering", "Worship Team"],
      volunteerCategory: "Worship",
      onboardingStatus: "ORIENTATION_SET",
      documentsSent: {
        "Welcome Email": true,
        "Leader Introduction": true,
        "Audition Form": true,
        "Worship Team Covenant": true,
        "Orientation Calendar": true,
      },
      orientationDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      onboardingNotes: "Orientation scheduled with worship team",
      assignedLeader: churchStaff,
    },
  ];

  for (let i = 0; i < volunteerOnboardingCards.length; i++) {
    const card = volunteerOnboardingCards[i];
    const scanTime = new Date(lastSunday);
    scanTime.setDate(lastSunday.getDate() - 2); // 2 days before Sunday
    scanTime.setHours(14 + i);

    await prisma.connectCard.create({
      data: {
        organizationId: newlifeOrg.id,
        locationId: i === 0 ? bainbridgeLocation.id : bremertonLocation.id,
        imageKey: `demo/connect-cards/volunteer-${i + 1}.jpg`,
        name: card.name,
        email: card.email,
        phone: card.phone,
        visitType: card.visitType,
        interests: card.interests,
        volunteerCategory: card.volunteerCategory,
        status: "REVIEWED",
        scannedAt: scanTime,
        assignedLeaderId: card.assignedLeader.id,
        smsAutomationEnabled: true,
        volunteerOnboardingStatus: card.onboardingStatus,
        volunteerDocumentsSent: card.documentsSent,
        volunteerOrientationDate: card.orientationDate || null,
        volunteerOnboardingNotes: card.onboardingNotes,
        extractedData: {
          name: card.name,
          email: card.email,
          phone: card.phone,
          visitType: card.visitType,
          interests: card.interests,
          volunteerCategory: card.volunteerCategory,
        },
      },
    });
  }

  console.log(`   ✅ 15 connect cards created`);
  console.log(`      - 5 awaiting review (EXTRACTED)`);
  console.log(`      - 8 reviewed (REVIEWED)`);
  console.log(`      - 2 with volunteer onboarding in progress\n`);

  // ========================================
  // PRAYER REQUESTS: Various statuses
  // ========================================
  console.log("🙏 Creating prayer requests...");

  const prayerRequests = [
    // PENDING (4 requests)
    {
      requesterName: "John Smith",
      request: "Pray for wisdom in a major life decision",
      privacyLevel: "PUBLIC",
      category: "GUIDANCE",
      status: "PENDING",
    },
    {
      requesterName: "Sarah Johnson",
      request: "My father was diagnosed with cancer, need healing prayers",
      privacyLevel: "MEMBERS_ONLY",
      category: "HEALING",
      status: "PENDING",
    },
    {
      requesterName: "Michael Chen",
      request:
        "Lost my job last week, praying for provision and new opportunity",
      privacyLevel: "PUBLIC",
      category: "PROVISION",
      status: "PENDING",
    },
    {
      requesterName: "Emily Rodriguez",
      request: "Struggling with anxiety and depression, need peace",
      privacyLevel: "LEADERSHIP",
      category: "MENTAL_HEALTH",
      status: "PENDING",
    },

    // IN_PROGRESS (5 requests)
    {
      requesterName: "David Martinez",
      request: "Marriage going through difficult season, pray for restoration",
      privacyLevel: "LEADERSHIP",
      category: "FAMILY",
      status: "IN_PROGRESS",
      assignedTo: churchAdmin,
    },
    {
      requesterName: "Lisa Anderson",
      request: "Upcoming surgery next week, pray for successful outcome",
      privacyLevel: "MEMBERS_ONLY",
      category: "HEALING",
      status: "IN_PROGRESS",
      assignedTo: churchAdmin,
    },
    {
      requesterName: "Robert Taylor",
      request: "Son away at college making poor choices, pray for wisdom",
      privacyLevel: "PRIVATE",
      category: "FAMILY",
      status: "IN_PROGRESS",
      assignedTo: churchStaff,
    },
    {
      requesterName: "Jennifer Lee",
      request: "New job opportunity, pray for God's direction",
      privacyLevel: "PUBLIC",
      category: "GUIDANCE",
      status: "IN_PROGRESS",
      assignedTo: churchStaff,
    },
    {
      requesterName: "Christopher Wilson",
      request: "Struggling with addiction, need freedom and accountability",
      privacyLevel: "LEADERSHIP",
      category: "MENTAL_HEALTH",
      status: "IN_PROGRESS",
      assignedTo: churchAdmin,
    },

    // ANSWERED (3 requests)
    {
      requesterName: "Amanda Brown",
      request: "Needed provision for medical bills - God provided!",
      privacyLevel: "PUBLIC",
      category: "PROVISION",
      status: "ANSWERED",
      assignedTo: churchAdmin,
    },
    {
      requesterName: "Daniel Garcia",
      request: "Daughter's health improving after prayer - thank you!",
      privacyLevel: "MEMBERS_ONLY",
      category: "HEALING",
      status: "ANSWERED",
      assignedTo: churchStaff,
    },
    {
      requesterName: "Michelle Thompson",
      request: "Found new job, God's timing was perfect",
      privacyLevel: "PUBLIC",
      category: "PROVISION",
      status: "ANSWERED",
      assignedTo: churchAdmin,
    },
  ];

  for (const prayer of prayerRequests) {
    const requestDate = new Date(lastSunday);
    if (prayer.status === "ANSWERED") {
      requestDate.setDate(lastSunday.getDate() - 14); // 2 weeks ago
    } else if (prayer.status === "IN_PROGRESS") {
      requestDate.setDate(lastSunday.getDate() - 7); // 1 week ago
    }

    await prisma.prayerRequest.create({
      data: {
        organizationId: newlifeOrg.id,
        locationId: bainbridgeLocation.id,
        requesterName: prayer.requesterName,
        request: prayer.request,
        privacyLevel: prayer.privacyLevel,
        category: prayer.category,
        status: prayer.status,
        assignedToId: prayer.assignedTo?.id || null,
        requestDate,
      },
    });
  }

  console.log(`   ✅ 12 prayer requests created`);
  console.log(`      - 4 pending (unassigned)`);
  console.log(`      - 5 in progress (assigned)`);
  console.log(`      - 3 answered (completed)\n`);

  // ========================================
  // FINAL SUMMARY
  // ========================================
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ DEMO SEED COMPLETED SUCCESSFULLY");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("📊 Test Environment:");
  console.log("   🏢 Organization: Newlife Church");
  console.log("   📍 Locations: 2 (Bainbridge, Bremerton)");
  console.log("   👥 Users: 4 (platform admin, owner, admin, staff)");
  console.log("   📇 Connect Cards: 15");
  console.log("      - 5 awaiting review");
  console.log("      - 8 reviewed");
  console.log("      - 2 with volunteer onboarding");
  console.log("   👔 Volunteer Pipeline: 2 volunteers in onboarding");
  console.log(
    "   🙏 Prayer Requests: 12 (4 pending, 5 in progress, 3 answered)\n"
  );

  console.log("🔐 Test Credentials (Email OTP):");
  console.log("   platform@test.com       (platform_admin)");
  console.log("   test@playwright.dev     (church_owner)");
  console.log(
    "   admin@newlife.test      (church_admin - Kids Ministry, Hospitality)"
  );
  console.log("   staff@newlife.test      (staff - Worship)\n");

  console.log("🌐 Quick Access URLs:");
  const port = process.env.PORT || 3002;
  console.log(
    `   Dashboard:       http://localhost:${port}/church/newlife/admin`
  );
  console.log(
    `   Connect Cards:   http://localhost:${port}/church/newlife/admin/connect-cards`
  );
  console.log(
    `   Prayer Requests: http://localhost:${port}/church/newlife/admin/prayer`
  );
  console.log(
    `   Team:            http://localhost:${port}/church/newlife/admin/team\n`
  );

  console.log("💡 Known Test Data:");
  console.log("   - John Smith: Hospitality volunteer (awaiting review)");
  console.log("   - Sarah Johnson: Kids Ministry volunteer (awaiting review)");
  console.log("   - Brandon Miller: Kids Ministry (documents shared stage)");
  console.log("   - Rachel Davis: Worship volunteer (orientation scheduled)\n");
}

main()
  .catch(e => {
    console.error("❌ Error running demo seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
