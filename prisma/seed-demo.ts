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
    update: {
      name: "Sarah Mitchell",
      role: "church_admin",
      organizationId: newlifeOrg.id,
      canSeeAllLocations: true,
      volunteerCategories: ["Kids Ministry", "Hospitality"], // Ministry leader
    },
    create: {
      id: crypto.randomUUID(),
      email: "admin@newlife.test",
      name: "Sarah Mitchell",
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
    update: {
      name: "David Chen",
      role: "user",
      organizationId: newlifeOrg.id,
      canSeeAllLocations: false,
      defaultLocationId: bainbridgeLocation.id,
      volunteerCategories: ["Worship", "AV Tech"], // Worship & AV leader
    },
    create: {
      id: crypto.randomUUID(),
      email: "staff@newlife.test",
      name: "David Chen",
      role: "user",
      organizationId: newlifeOrg.id,
      emailVerified: true,
      canSeeAllLocations: false, // Campus-specific
      defaultLocationId: bainbridgeLocation.id,
      volunteerCategories: ["Worship", "AV Tech"], // Worship & AV leader
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

  // Additional Volunteer Leaders for different ministry categories
  const youthPastor = await prisma.user.upsert({
    where: { email: "youth@newlife.test" },
    update: {
      name: "Marcus Johnson",
      role: "user",
      organizationId: newlifeOrg.id,
      volunteerCategories: ["Youth Ministry", "Small Groups"],
    },
    create: {
      id: crypto.randomUUID(),
      email: "youth@newlife.test",
      name: "Marcus Johnson",
      role: "user",
      organizationId: newlifeOrg.id,
      emailVerified: true,
      volunteerCategories: ["Youth Ministry", "Small Groups"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.member.upsert({
    where: {
      userId_organizationId: {
        userId: youthPastor.id,
        organizationId: newlifeOrg.id,
      },
    },
    update: {},
    create: {
      userId: youthPastor.id,
      organizationId: newlifeOrg.id,
      role: "member",
    },
  });

  const greetingLead = await prisma.user.upsert({
    where: { email: "greeter@newlife.test" },
    update: {
      name: "Jennifer Adams",
      role: "user",
      organizationId: newlifeOrg.id,
      volunteerCategories: ["Greeting", "Parking", "Hospitality"],
    },
    create: {
      id: crypto.randomUUID(),
      email: "greeter@newlife.test",
      name: "Jennifer Adams",
      role: "user",
      organizationId: newlifeOrg.id,
      emailVerified: true,
      volunteerCategories: ["Greeting", "Parking", "Hospitality"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.member.upsert({
    where: {
      userId_organizationId: {
        userId: greetingLead.id,
        organizationId: newlifeOrg.id,
      },
    },
    update: {},
    create: {
      userId: greetingLead.id,
      organizationId: newlifeOrg.id,
      role: "member",
    },
  });

  const prayerLead = await prisma.user.upsert({
    where: { email: "prayer@newlife.test" },
    update: {
      name: "Maria Garcia",
      role: "user",
      organizationId: newlifeOrg.id,
      volunteerCategories: ["Prayer Team", "Counseling"],
    },
    create: {
      id: crypto.randomUUID(),
      email: "prayer@newlife.test",
      name: "Maria Garcia",
      role: "user",
      organizationId: newlifeOrg.id,
      emailVerified: true,
      volunteerCategories: ["Prayer Team", "Counseling"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.member.upsert({
    where: {
      userId_organizationId: {
        userId: prayerLead.id,
        organizationId: newlifeOrg.id,
      },
    },
    update: {},
    create: {
      userId: prayerLead.id,
      organizationId: newlifeOrg.id,
      role: "member",
    },
  });

  console.log(
    `   ✅ 7 users created (platform admin, owner, admin, 4 volunteer leaders)\n`
  );

  // ========================================
  // CONNECT CARDS: Mix of statuses
  // ========================================
  console.log("📇 Creating connect cards...");

  const now = new Date();
  // "This Sunday" = start of current week (for "This Week" metrics)
  const thisSunday = new Date(now);
  thisSunday.setDate(now.getDate() - now.getDay()); // Go to this week's Sunday
  thisSunday.setHours(10, 30, 0, 0);

  // "Last Sunday" = start of previous week (for historical data)
  const lastSunday = new Date(thisSunday);
  lastSunday.setDate(thisSunday.getDate() - 7);

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
    // Use THIS week's Sunday so cards appear in "This Week" metrics
    const scanTime = new Date(thisSunday);
    scanTime.setHours(10 + i); // Spread across Sunday morning

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
      onboardingStatus: "DOCUMENTS_SHARED" as const,
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
      onboardingStatus: "ORIENTATION_SET" as const,
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
    const scanTime = new Date(thisSunday);
    scanTime.setHours(14 + i); // This week's Sunday afternoon

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

  // HISTORICAL DATA (52 weeks = 1 year of reviewed cards for dashboard charts)
  // Week 0 = current week - make it HIGHER than average for positive trends (green)
  // Bainbridge: Larger campus, more first-time visitors
  // Bremerton: Smaller campus, higher prayer request ratio
  const historicalWeeks: Array<{
    weeksAgo: number;
    bainbridge: number;
    bremerton: number;
  }> = [];

  // Current week: above average for positive trends
  historicalWeeks.push({ weeksAgo: 0, bainbridge: 18, bremerton: 9 });

  // Recent 4 weeks: varying to create realistic averages
  historicalWeeks.push({ weeksAgo: 1, bainbridge: 12, bremerton: 6 });
  historicalWeeks.push({ weeksAgo: 2, bainbridge: 14, bremerton: 7 });
  historicalWeeks.push({ weeksAgo: 3, bainbridge: 11, bremerton: 5 });
  historicalWeeks.push({ weeksAgo: 4, bainbridge: 13, bremerton: 6 });

  // Generate remaining 47 weeks with realistic seasonal patterns
  for (let week = 5; week < 52; week++) {
    // Seasonal variation: higher in fall/winter, lower in summer
    const seasonalFactor = Math.sin((week / 52) * Math.PI * 2) * 0.2 + 1;
    // Random variation ±20%
    const randomFactor = 0.8 + Math.random() * 0.4;

    const bainbridge = Math.round(12 * seasonalFactor * randomFactor);
    const bremerton = Math.round(6 * seasonalFactor * randomFactor);

    historicalWeeks.push({ weeksAgo: week, bainbridge, bremerton });
  }

  const visitTypes = [
    "First Visit",
    "First Visit",
    "Second Visit",
    "Regular Attender",
    "Member",
  ];
  const interestOptions = [
    ["Small Groups"],
    ["Volunteering"],
    ["Volunteering", "Small Groups"],
    ["Prayer Team"],
    ["Youth Ministry"],
    ["Children's Ministry"],
    ["Worship Team"],
    [],
  ];

  let historicalCardCount = 0;

  for (const week of historicalWeeks) {
    // Use thisSunday as base so week 0 = current week
    const weekSunday = new Date(thisSunday);
    weekSunday.setDate(thisSunday.getDate() - week.weeksAgo * 7);

    // Bainbridge cards (larger campus, 60% first-time visitors)
    for (let i = 0; i < week.bainbridge; i++) {
      const scanTime = new Date(weekSunday);
      scanTime.setHours(9 + Math.floor(i / 3), (i % 3) * 15);

      const isFirstVisit = i < Math.floor(week.bainbridge * 0.6);
      const hasPrayer = i % 4 === 0; // 25% prayer requests
      const hasVolunteer = i % 3 === 0; // 33% volunteer interest

      await prisma.connectCard.create({
        data: {
          organizationId: newlifeOrg.id,
          locationId: bainbridgeLocation.id,
          imageKey: `demo/connect-cards/hist-bain-w${week.weeksAgo}-${i + 1}.jpg`,
          name: `Bainbridge Visitor ${week.weeksAgo}-${i + 1}`,
          email: `bain.visitor${week.weeksAgo}${i + 1}@email.com`,
          phone: `(206) 555-${1000 + historicalCardCount}`,
          visitType: isFirstVisit
            ? "First Visit"
            : visitTypes[i % visitTypes.length],
          interests: hasVolunteer
            ? ["Volunteering", "Small Groups"]
            : interestOptions[i % interestOptions.length],
          prayerRequest: hasPrayer ? "Please pray for our family" : null,
          status: "REVIEWED",
          scannedAt: scanTime,
          extractedData: {
            name: `Bainbridge Visitor ${week.weeksAgo}-${i + 1}`,
            visitType: isFirstVisit
              ? "First Visit"
              : visitTypes[i % visitTypes.length],
          },
        },
      });
      historicalCardCount++;
    }

    // Bremerton cards (smaller campus, 50% prayer requests, more intimate)
    for (let i = 0; i < week.bremerton; i++) {
      const scanTime = new Date(weekSunday);
      scanTime.setHours(9 + Math.floor(i / 2), (i % 2) * 30);

      const isFirstVisit = i < Math.floor(week.bremerton * 0.4);
      const hasPrayer = i % 2 === 0; // 50% prayer requests
      const hasVolunteer = i % 4 === 0; // 25% volunteer interest

      await prisma.connectCard.create({
        data: {
          organizationId: newlifeOrg.id,
          locationId: bremertonLocation.id,
          imageKey: `demo/connect-cards/hist-brem-w${week.weeksAgo}-${i + 1}.jpg`,
          name: `Bremerton Visitor ${week.weeksAgo}-${i + 1}`,
          email: `brem.visitor${week.weeksAgo}${i + 1}@email.com`,
          phone: `(360) 555-${2000 + historicalCardCount}`,
          visitType: isFirstVisit
            ? "First Visit"
            : visitTypes[i % visitTypes.length],
          interests: hasVolunteer
            ? ["Volunteering"]
            : interestOptions[i % interestOptions.length],
          prayerRequest: hasPrayer ? "Praying for healing and guidance" : null,
          status: "REVIEWED",
          scannedAt: scanTime,
          extractedData: {
            name: `Bremerton Visitor ${week.weeksAgo}-${i + 1}`,
            visitType: isFirstVisit
              ? "First Visit"
              : visitTypes[i % visitTypes.length],
          },
        },
      });
      historicalCardCount++;
    }
  }

  console.log(`   ✅ ${15 + historicalCardCount} connect cards created`);
  console.log(`      - 5 awaiting review (EXTRACTED)`);
  console.log(`      - ${8 + historicalCardCount} reviewed (REVIEWED)`);
  console.log(`      - 2 with volunteer onboarding in progress`);
  console.log(
    `      - ${historicalCardCount} historical cards across 52 weeks (1 year)\n`
  );
  console.log(`   📍 Location breakdown:`);
  console.log(
    `      - Bainbridge: ~${Math.round(historicalCardCount * 0.65)} cards (larger campus)`
  );
  console.log(
    `      - Bremerton: ~${Math.round(historicalCardCount * 0.35)} cards (smaller campus)\n`
  );
  console.log(`   📈 Trends configured for positive display (green):`);
  console.log(`      - This week: 18 Bainbridge + 9 Bremerton = 27 cards`);
  console.log(
    `      - 4-week avg: ~12.5 Bainbridge + ~6 Bremerton = ~18.5 cards\n`
  );

  // ========================================
  // PRAYER REQUESTS: Various statuses
  // ========================================
  console.log("🙏 Creating prayer requests...");

  const prayerRequests = [
    // PENDING (4 requests)
    {
      submittedBy: "John Smith",
      request: "Pray for wisdom in a major life decision",
      isPrivate: false,
      category: "GUIDANCE",
      status: "PENDING" as const,
    },
    {
      submittedBy: "Sarah Johnson",
      request: "My father was diagnosed with cancer, need healing prayers",
      isPrivate: true,
      category: "HEALING",
      status: "PENDING" as const,
    },
    {
      submittedBy: "Michael Chen",
      request:
        "Lost my job last week, praying for provision and new opportunity",
      isPrivate: false,
      category: "PROVISION",
      status: "PENDING" as const,
    },
    {
      submittedBy: "Emily Rodriguez",
      request: "Struggling with anxiety and depression, need peace",
      isPrivate: true,
      category: "MENTAL_HEALTH",
      status: "PENDING" as const,
    },

    // PRAYING (5 requests)
    {
      submittedBy: "David Martinez",
      request: "Marriage going through difficult season, pray for restoration",
      isPrivate: true,
      category: "FAMILY",
      status: "PRAYING" as const,
      assignedTo: churchAdmin,
    },
    {
      submittedBy: "Lisa Anderson",
      request: "Upcoming surgery next week, pray for successful outcome",
      isPrivate: true,
      category: "HEALING",
      status: "PRAYING" as const,
      assignedTo: churchAdmin,
    },
    {
      submittedBy: "Robert Taylor",
      request: "Son away at college making poor choices, pray for wisdom",
      isPrivate: true,
      category: "FAMILY",
      status: "PRAYING" as const,
      assignedTo: churchStaff,
    },
    {
      submittedBy: "Jennifer Lee",
      request: "New job opportunity, pray for God's direction",
      isPrivate: false,
      category: "GUIDANCE",
      status: "PRAYING" as const,
      assignedTo: churchStaff,
    },
    {
      submittedBy: "Christopher Wilson",
      request: "Struggling with addiction, need freedom and accountability",
      isPrivate: true,
      category: "MENTAL_HEALTH",
      status: "PRAYING" as const,
      assignedTo: churchAdmin,
    },

    // ANSWERED (3 requests)
    {
      submittedBy: "Amanda Brown",
      request: "Needed provision for medical bills - God provided!",
      isPrivate: false,
      category: "PROVISION",
      status: "ANSWERED" as const,
      assignedTo: churchAdmin,
    },
    {
      submittedBy: "Daniel Garcia",
      request: "Daughter's health improving after prayer - thank you!",
      isPrivate: true,
      category: "HEALING",
      status: "ANSWERED" as const,
      assignedTo: churchStaff,
    },
    {
      submittedBy: "Michelle Thompson",
      request: "Found new job, God's timing was perfect",
      isPrivate: false,
      category: "PROVISION",
      status: "ANSWERED" as const,
      assignedTo: churchAdmin,
    },
  ];

  for (const prayer of prayerRequests) {
    const createdAt = new Date(lastSunday);
    if (prayer.status === "ANSWERED") {
      createdAt.setDate(lastSunday.getDate() - 14); // 2 weeks ago
    } else if (prayer.status === "PRAYING") {
      createdAt.setDate(lastSunday.getDate() - 7); // 1 week ago
    }

    await prisma.prayerRequest.create({
      data: {
        organizationId: newlifeOrg.id,
        locationId: bainbridgeLocation.id,
        submittedBy: prayer.submittedBy,
        request: prayer.request,
        isPrivate: prayer.isPrivate,
        category: prayer.category,
        status: prayer.status,
        assignedToId: prayer.assignedTo?.id || null,
        createdAt,
      },
    });
  }

  console.log(`   ✅ 12 prayer requests created`);
  console.log(`      - 4 pending (unassigned)`);
  console.log(`      - 5 praying (assigned)`);
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
  console.log(
    "   👥 Users: 7 (platform admin, owner, admin, 4 volunteer leaders)"
  );
  console.log("   📇 Connect Cards: ~950 total");
  console.log("      - 5 awaiting review");
  console.log("      - ~945 reviewed (52 weeks of history)");
  console.log("      - 2 with volunteer onboarding");
  console.log("      - Full year of data for Last Year dropdown");
  console.log("   📈 Trend Display: Green (this week above 4-week average)");
  console.log("   📍 Location Distribution:");
  console.log("      - Bainbridge: ~620 cards (larger campus)");
  console.log("      - Bremerton: ~330 cards (smaller campus)");
  console.log("   👔 Volunteer Pipeline: 2 volunteers in onboarding");
  console.log("   🙏 Prayer Requests: 12 (4 pending, 5 praying, 3 answered)\n");

  console.log("🔐 Test Credentials (Email OTP):");
  console.log("   platform@test.com       (platform_admin)");
  console.log("   test@playwright.dev     (church_owner - Pastor Mike)");
  console.log(
    "   admin@newlife.test      (church_admin - Sarah, Kids/Hospitality)"
  );
  console.log("   staff@newlife.test      (staff - David, Worship/AV)");
  console.log(
    "   youth@newlife.test      (volunteer leader - Marcus, Youth/Small Groups)"
  );
  console.log(
    "   greeter@newlife.test    (volunteer leader - Jennifer, Greeting/Parking)"
  );
  console.log(
    "   prayer@newlife.test     (volunteer leader - Maria, Prayer Team)\n"
  );

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
