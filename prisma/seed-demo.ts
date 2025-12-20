/**
 * Fresh Demo Seed - Complete Reset & Seed for Demo
 *
 * WARNING: This deletes ALL existing data and creates fresh demo data.
 * Run with: npx tsx prisma/seed-demo-fresh.ts
 *
 * Creates:
 * - 1 Organization (Newlife Church) with 5 locations
 * - 7 Users (platform admin, pastor, office manager, 4 ministry leaders)
 * - ~600 Connect Cards (12 weeks history, all stages)
 * - ~75 Batches (processing, awaiting review, completed)
 * - 30 Volunteers in pipeline (all stages)
 * - 50 Prayer Requests (all categories)
 *
 * Dashboard will show:
 * - Green trend arrows (this week > 4-week average)
 * - 12 weeks of chart data
 * - Top prayer categories populated
 * - All 5 locations with proportional data
 */

import { PrismaClient } from "../lib/generated/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();

// ============================================
// REALISTIC NAME GENERATORS
// ============================================
const firstNames = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Christopher",
  "Karen",
  "Matthew",
  "Lisa",
  "Daniel",
  "Nancy",
  "Anthony",
  "Betty",
  "Mark",
  "Ashley",
  "Steven",
  "Emily",
  "Andrew",
  "Donna",
  "Joshua",
  "Michelle",
  "Kenneth",
  "Amanda",
  "Kevin",
  "Melissa",
  "Brian",
  "Stephanie",
  "Timothy",
  "Rebecca",
  "Ronald",
  "Laura",
  "Jason",
  "Helen",
  "Jeffrey",
  "Samantha",
  "Ryan",
  "Katherine",
  "Jacob",
  "Christine",
  "Nicholas",
  "Deborah",
  "Eric",
  "Rachel",
  "Stephen",
  "Carolyn",
  "Jonathan",
  "Janet",
  "Larry",
  "Catherine",
  "Justin",
  "Maria",
  "Scott",
  "Heather",
  "Brandon",
  "Diane",
  "Benjamin",
  "Ruth",
  "Samuel",
  "Julie",
  "Raymond",
  "Olivia",
  "Gregory",
  "Joyce",
  "Frank",
  "Virginia",
  "Alexander",
  "Victoria",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Gomez",
  "Phillips",
  "Evans",
  "Turner",
  "Diaz",
  "Parker",
  "Cruz",
  "Edwards",
  "Collins",
  "Reyes",
  "Stewart",
  "Morris",
  "Morales",
];

let nameIndex = 0;
function generateName(): string {
  const first = firstNames[nameIndex % firstNames.length];
  const last =
    lastNames[Math.floor(nameIndex / firstNames.length) % lastNames.length];
  nameIndex++;
  return `${first} ${last}`;
}

function generateEmail(name: string): string {
  const [first, last] = name.toLowerCase().split(" ");
  return `${first}.${last}@email.com`;
}

function generatePhone(): string {
  const areas = ["206", "360", "425", "253"];
  const area = areas[Math.floor(Math.random() * areas.length)];
  const num1 = Math.floor(Math.random() * 900) + 100;
  const num2 = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${num1}-${num2}`;
}

// ============================================
// PRAYER DATA
// ============================================
const prayerCategories = [
  "HEALING",
  "FAMILY",
  "GUIDANCE",
  "PROVISION",
  "MENTAL_HEALTH",
  "RELATIONSHIPS",
  "SALVATION",
  "OTHER",
] as const;

const prayerTemplates: Record<string, string[]> = {
  HEALING: [
    "Please pray for healing from chronic back pain",
    "My mother is going through cancer treatment, please pray for healing",
    "Recovering from surgery, need prayer for quick recovery",
    "Pray for complete healing from this illness",
    "My father has heart problems, please pray",
  ],
  FAMILY: [
    "Our family is going through a difficult season",
    "Pray for unity and peace in our marriage",
    "My children are struggling, need wisdom as a parent",
    "Praying for reconciliation with my brother",
    "Our family needs God's guidance right now",
  ],
  GUIDANCE: [
    "Need wisdom for a major career decision",
    "Seeking God's direction for next steps in life",
    "Pray for clarity about whether to move",
    "Discerning God's will for our family's future",
    "Need guidance on a big financial decision",
  ],
  PROVISION: [
    "Lost my job last month, need financial provision",
    "Struggling to pay medical bills",
    "Need a reliable vehicle to get to work",
    "Praying for affordable housing",
    "Our family needs financial breakthrough",
  ],
  MENTAL_HEALTH: [
    "Battling anxiety and need peace",
    "Struggling with depression, need prayer support",
    "Need prayer for mental clarity and rest",
    "Dealing with overwhelming stress at work",
    "Pray for freedom from worry and fear",
  ],
  RELATIONSHIPS: [
    "Pray for restoration with an estranged friend",
    "Navigating difficult relationships at work",
    "Need wisdom in a new relationship",
    "Pray for healthy boundaries with family",
    "Struggling with loneliness, need community",
  ],
  SALVATION: [
    "Please pray for my husband to know Jesus",
    "My parents don't believe, praying for their hearts",
    "Praying for my coworker to be open to faith",
    "My adult children have walked away from faith",
    "Pray for my neighbor who is seeking",
  ],
  OTHER: [
    "Unspoken prayer request",
    "Please just pray for me this week",
    "Grateful for answered prayers, praising God",
    "Need prayer for travel safety",
    "General prayer for peace and strength",
  ],
};

// ============================================
// VOLUNTEER & INTEREST DATA
// ============================================
const visitTypes = [
  "First Visit",
  "Second Visit",
  "Regular Attender",
  "Member",
];
const volunteerCategories = [
  "Kids Ministry",
  "Youth Ministry",
  "Worship",
  "AV Tech",
  "Hospitality",
  "Greeting",
  "Parking",
  "Small Groups",
  "Prayer Team",
  "Missions",
  "Coffee Team",
  "Setup/Teardown",
  "Security",
  "First Impressions",
];

const interestOptions = [
  ["Small Groups"],
  ["Volunteering"],
  ["Volunteering", "Small Groups"],
  ["Prayer Team"],
  ["Youth Ministry"],
  ["Kids Ministry"],
  ["Worship Team"],
  ["Missions"],
  ["Bible Study"],
  ["Men's Ministry"],
  ["Women's Ministry"],
  [],
];

// Must match VolunteerOnboardingStatus enum in schema
const volunteerStatuses = [
  "INQUIRY",
  "WELCOME_SENT",
  "DOCUMENTS_SHARED",
  "LEADER_CONNECTED",
  "ORIENTATION_SET",
  "READY",
  "ADDED_TO_PCO",
] as const;

// Map string categories to VolunteerCategoryType enum
const categoryToEnum: Record<string, string> = {
  "Kids Ministry": "KIDS_MINISTRY",
  "Youth Ministry": "OTHER",
  Worship: "WORSHIP_TEAM",
  "AV Tech": "AV_TECH",
  Hospitality: "HOSPITALITY",
  Greeting: "GREETER",
  Parking: "PARKING",
  "Small Groups": "OTHER",
  "Prayer Team": "PRAYER_TEAM",
  Missions: "OTHER",
  "Coffee Team": "HOSPITALITY",
  "Setup/Teardown": "OTHER",
  Security: "OTHER",
  "First Impressions": "GREETER",
};

// Map onboarding status to Volunteer model fields
const onboardingToVolunteerStatus: Record<
  string,
  { status: string; bgStatus: string }
> = {
  INQUIRY: { status: "PENDING_APPROVAL", bgStatus: "NOT_STARTED" },
  WELCOME_SENT: { status: "PENDING_APPROVAL", bgStatus: "NOT_STARTED" },
  DOCUMENTS_SHARED: { status: "PENDING_APPROVAL", bgStatus: "IN_PROGRESS" },
  LEADER_CONNECTED: { status: "PENDING_APPROVAL", bgStatus: "IN_PROGRESS" },
  ORIENTATION_SET: { status: "PENDING_APPROVAL", bgStatus: "PENDING_REVIEW" },
  READY: { status: "ACTIVE", bgStatus: "CLEARED" },
  ADDED_TO_PCO: { status: "ACTIVE", bgStatus: "CLEARED" },
};

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function main() {
  console.log("🌱 Starting FRESH demo seed...\n");
  console.log("⚠️  This will DELETE all existing data!\n");

  // ============================================
  // STEP 1: CLEAR ALL DATA
  // ============================================
  console.log("🗑️  Clearing existing data...");

  // Delete in order to respect foreign keys
  await prisma.prayerRequest.deleteMany();
  await prisma.connectCard.deleteMany();
  await prisma.connectCardBatch.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.organization.deleteMany();

  console.log("   ✅ All data cleared\n");

  // ============================================
  // STEP 2: CREATE ORGANIZATION
  // ============================================
  console.log("🏢 Creating organization...");

  const org = await prisma.organization.create({
    data: {
      name: "Newlife Church",
      slug: "newlife",
      type: "CHURCH",
      subscriptionStatus: "ACTIVE",
    },
  });
  console.log(`   ✅ ${org.name} created\n`);

  // ============================================
  // STEP 3: CREATE LOCATIONS
  // ============================================
  console.log("📍 Creating locations...");

  const locationConfigs = [
    { name: "Bainbridge Campus", slug: "bainbridge", scale: 1.5 },
    { name: "Bremerton Campus", slug: "bremerton", scale: 1.2 },
    { name: "Silverdale Campus", slug: "silverdale", scale: 1.0 },
    { name: "Port Orchard Campus", slug: "port-orchard", scale: 0.8 },
    { name: "Poulsbo Campus", slug: "poulsbo", scale: 0.6 },
  ];

  const locations: Array<{
    id: string;
    name: string;
    slug: string;
    scale: number;
  }> = [];

  for (const config of locationConfigs) {
    const location = await prisma.location.create({
      data: {
        name: config.name,
        slug: config.slug,
        organizationId: org.id,
      },
    });
    locations.push({ ...location, scale: config.scale });
    console.log(`   ✅ ${location.name}`);
  }
  console.log("");

  // ============================================
  // STEP 4: CREATE USERS
  // ============================================
  console.log("👥 Creating users...");

  // Platform Admin
  const platformAdmin = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: "platform@churchsync.app",
      name: "System Admin",
      role: "platform_admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`   ✅ ${platformAdmin.name} (platform_admin)`);

  // Senior Pastor - Church Owner
  const pastor = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: "mike@newlife.church",
      name: "Mike Reynolds",
      role: "church_owner",
      organizationId: org.id,
      emailVerified: true,
      canSeeAllLocations: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await prisma.member.create({
    data: { userId: pastor.id, organizationId: org.id, role: "owner" },
  });
  console.log(`   ✅ Pastor ${pastor.name} (church_owner)`);

  // Office Manager - Main Demo Account
  const officeManager = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email: "admin@newlife.test",
      name: "Sarah Mitchell",
      role: "church_admin",
      organizationId: org.id,
      emailVerified: true,
      canSeeAllLocations: true,
      volunteerCategories: ["Kids Ministry", "Hospitality"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await prisma.member.create({
    data: { userId: officeManager.id, organizationId: org.id, role: "admin" },
  });
  console.log(
    `   ✅ ${officeManager.name} (church_admin) - admin@newlife.test`
  );

  // Ministry Leaders
  const leaderConfigs = [
    {
      name: "Marcus Johnson",
      email: "marcus@newlife.church",
      categories: ["Youth Ministry", "Small Groups"],
      location: locations[0],
    },
    {
      name: "David Chen",
      email: "david@newlife.church",
      categories: ["Worship", "AV Tech"],
      location: null,
    },
    {
      name: "Jennifer Adams",
      email: "jennifer@newlife.church",
      categories: ["Greeting", "Parking", "Hospitality"],
      location: locations[1],
    },
    {
      name: "Maria Garcia",
      email: "maria@newlife.church",
      categories: ["Prayer Team", "Counseling"],
      location: locations[3],
    },
  ];

  const leaders: Array<{
    id: string;
    name: string;
    volunteerCategories: string[];
  }> = [
    {
      id: officeManager.id,
      name: officeManager.name,
      volunteerCategories: officeManager.volunteerCategories || [],
    },
  ];

  for (const config of leaderConfigs) {
    const leader = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: config.email,
        name: config.name,
        role: "user",
        organizationId: org.id,
        emailVerified: true,
        volunteerCategories: config.categories,
        defaultLocationId: config.location?.id || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await prisma.member.create({
      data: { userId: leader.id, organizationId: org.id, role: "member" },
    });
    leaders.push({
      id: leader.id,
      name: leader.name,
      volunteerCategories: config.categories,
    });
    console.log(`   ✅ ${leader.name} [${config.categories.join(", ")}]`);
  }
  console.log("");

  // ============================================
  // STEP 5: CREATE CONNECT CARDS & BATCHES
  // ============================================
  console.log("📇 Creating connect cards and batches...");

  const now = new Date();

  // Get Sunday of current week
  function getSunday(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(10, 0, 0, 0);
    return d;
  }

  const thisSunday = getSunday(now);
  let totalCards = 0;
  let totalBatches = 0;

  // Helper to format batch names
  function formatBatchName(locationName: string, date: Date): string {
    return `${locationName.replace(" Campus", "")} - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }

  for (const location of locations) {
    const scale = location.scale;

    // ----- PENDING BATCH (1 per location) - Just uploaded -----
    const pendingBatch = await prisma.connectCardBatch.create({
      data: {
        organizationId: org.id,
        locationId: location.id,
        uploadedBy: officeManager.id,
        name: formatBatchName(location.name, now),
        cardCount: 3,
        status: "PENDING",
        notes: "Sunday morning service",
        createdAt: new Date(now.getTime() - 5 * 60 * 1000),
      },
    });
    totalBatches++;

    for (let i = 0; i < 3; i++) {
      const cardName = generateName();
      await prisma.connectCard.create({
        data: {
          organizationId: org.id,
          locationId: location.id,
          batchId: pendingBatch.id,
          imageKey: `demo/${location.slug}/pending-${i + 1}.jpg`,
          status: i === 0 ? "EXTRACTED" : "PENDING",
          scannedAt: new Date(now.getTime() - (5 - i) * 60 * 1000),
          name: i === 0 ? cardName : null,
          email: i === 0 ? generateEmail(cardName) : null,
          phone: i === 0 ? generatePhone() : null,
          visitType: i === 0 ? "First Visit" : null,
          extractedData:
            i === 0
              ? { name: cardName, visitType: "First Visit", confidence: 0.87 }
              : null,
        },
      });
      totalCards++;
    }

    // ----- IN_REVIEW BATCHES (2 per location) - Ready for staff review -----
    for (let b = 0; b < 2; b++) {
      const batchSize = Math.floor((5 + Math.random() * 4) * scale);
      const batchDate = new Date(
        thisSunday.getTime() - b * 24 * 60 * 60 * 1000
      );

      const inReviewBatch = await prisma.connectCardBatch.create({
        data: {
          organizationId: org.id,
          locationId: location.id,
          uploadedBy: officeManager.id,
          name: formatBatchName(location.name, batchDate),
          cardCount: batchSize,
          status: "IN_REVIEW",
          notes: b === 0 ? "Morning service" : "Evening service",
          createdAt: batchDate,
        },
      });
      totalBatches++;

      for (let i = 0; i < batchSize; i++) {
        const cardName = generateName();
        const visitType =
          visitTypes[Math.floor(Math.random() * visitTypes.length)];
        const cardInterests =
          interestOptions[Math.floor(Math.random() * interestOptions.length)];
        const hasPrayer = Math.random() < 0.3;
        const hasVolunteer = cardInterests.some(int =>
          int.toLowerCase().includes("volunteer")
        );
        const category =
          prayerCategories[Math.floor(Math.random() * prayerCategories.length)];
        const prayerText = hasPrayer
          ? prayerTemplates[category][
              Math.floor(Math.random() * prayerTemplates[category].length)
            ]
          : null;

        await prisma.connectCard.create({
          data: {
            organizationId: org.id,
            locationId: location.id,
            batchId: inReviewBatch.id,
            imageKey: `demo/${location.slug}/review-${b}-${i + 1}.jpg`,
            status: "EXTRACTED",
            scannedAt: new Date(batchDate.getTime() + i * 60 * 1000),
            name: cardName,
            email: generateEmail(cardName),
            phone: generatePhone(),
            visitType,
            interests: cardInterests,
            volunteerCategory: hasVolunteer
              ? volunteerCategories[
                  Math.floor(Math.random() * volunteerCategories.length)
                ]
              : null,
            prayerRequest: prayerText,
            extractedData: {
              name: cardName,
              visitType,
              interests: cardInterests,
              prayerCategory: hasPrayer ? category : null,
              confidence: 0.72 + Math.random() * 0.2,
            },
          },
        });
        totalCards++;
      }
    }

    // ----- COMPLETED BATCHES (12 weeks of history) -----
    for (let week = 0; week < 12; week++) {
      const weekSunday = new Date(thisSunday);
      weekSunday.setDate(weekSunday.getDate() - week * 7);

      // Current week higher than average for green trends
      const weekMultiplier =
        week === 0 ? 1.4 : week < 4 ? 1.0 : 0.85 + Math.random() * 0.3;
      const baseCards = 10 * scale;
      const weekCards = Math.floor(baseCards * weekMultiplier);

      const completedBatch = await prisma.connectCardBatch.create({
        data: {
          organizationId: org.id,
          locationId: location.id,
          uploadedBy: officeManager.id,
          name: formatBatchName(location.name, weekSunday),
          cardCount: weekCards,
          status: "COMPLETED",
          notes: "Sunday services",
          createdAt: weekSunday,
        },
      });
      totalBatches++;

      for (let i = 0; i < weekCards; i++) {
        const cardName = generateName();
        // 55% first-time visitors
        const visitType =
          Math.random() < 0.55
            ? "First Visit"
            : visitTypes[Math.floor(Math.random() * visitTypes.length)];
        const cardInterests =
          interestOptions[Math.floor(Math.random() * interestOptions.length)];
        // 25% prayer requests
        const hasPrayer = Math.random() < 0.25;
        const hasVolunteer = cardInterests.some(int =>
          int.toLowerCase().includes("volunteer")
        );
        const category =
          prayerCategories[Math.floor(Math.random() * prayerCategories.length)];
        const prayerText = hasPrayer
          ? prayerTemplates[category][
              Math.floor(Math.random() * prayerTemplates[category].length)
            ]
          : null;

        await prisma.connectCard.create({
          data: {
            organizationId: org.id,
            locationId: location.id,
            batchId: completedBatch.id,
            imageKey: `demo/${location.slug}/hist-w${week}-${i + 1}.jpg`,
            status: "REVIEWED",
            scannedAt: new Date(weekSunday.getTime() + i * 3 * 60 * 1000),
            name: cardName,
            email: generateEmail(cardName),
            phone: generatePhone(),
            visitType,
            interests: cardInterests,
            volunteerCategory: hasVolunteer
              ? volunteerCategories[
                  Math.floor(Math.random() * volunteerCategories.length)
                ]
              : null,
            prayerRequest: prayerText,
            extractedData: {
              name: cardName,
              visitType,
              interests: cardInterests,
              prayerCategory: hasPrayer ? category : null,
              confidence: 0.78 + Math.random() * 0.18,
            },
          },
        });
        totalCards++;
      }
    }

    console.log(`   ✅ ${location.name}: cards seeded`);
  }
  console.log(`   📊 Total: ${totalCards} cards, ${totalBatches} batches\n`);

  // ============================================
  // STEP 6: CREATE VOLUNTEER PIPELINE
  // ============================================
  console.log("👔 Creating volunteer pipeline...");

  let totalVolunteers = 0;
  // Distribution across pipeline stages (matches VolunteerOnboardingStatus enum)
  const volunteersPerStatus: Record<string, number> = {
    INQUIRY: 4, // Just expressed interest
    WELCOME_SENT: 3, // Welcome message sent
    DOCUMENTS_SHARED: 4, // BG check & forms sent
    LEADER_CONNECTED: 3, // Introduced to ministry leader
    ORIENTATION_SET: 3, // Training scheduled
    READY: 5, // Ready for Planning Center
    ADDED_TO_PCO: 8, // Fully onboarded, serving
  };

  const daysAgo: Record<string, number> = {
    INQUIRY: 2,
    WELCOME_SENT: 5,
    DOCUMENTS_SHARED: 10,
    LEADER_CONNECTED: 14,
    ORIENTATION_SET: 18,
    READY: 25,
    ADDED_TO_PCO: 35,
  };

  for (const [status, count] of Object.entries(volunteersPerStatus)) {
    for (let i = 0; i < count; i++) {
      const volName = generateName();
      const volEmail = generateEmail(volName);
      const volPhone = generatePhone();
      const location = locations[i % locations.length];
      const category =
        volunteerCategories[
          Math.floor(Math.random() * volunteerCategories.length)
        ];

      // Find matching leader or use office manager
      const matchingLeader =
        leaders.find(l => l.volunteerCategories.includes(category)) ||
        leaders[0];

      // Determine what's been done based on status progression
      const hasLeader = [
        "LEADER_CONNECTED",
        "ORIENTATION_SET",
        "READY",
        "ADDED_TO_PCO",
      ].includes(status);
      const hasDocs = [
        "DOCUMENTS_SHARED",
        "LEADER_CONNECTED",
        "ORIENTATION_SET",
        "READY",
        "ADDED_TO_PCO",
      ].includes(status);
      const hasOrientation = [
        "ORIENTATION_SET",
        "READY",
        "ADDED_TO_PCO",
      ].includes(status);
      const isComplete = ["READY", "ADDED_TO_PCO"].includes(status);

      // Get mapped status values for Volunteer model
      const volStatusMapping = onboardingToVolunteerStatus[status];
      const enumCategory = categoryToEnum[category] || "GENERAL";

      // Create ConnectCard (original behavior)
      await prisma.connectCard.create({
        data: {
          organizationId: org.id,
          locationId: location.id,
          imageKey: `demo/${location.slug}/vol-${status.toLowerCase()}-${i + 1}.jpg`,
          status: "REVIEWED",
          scannedAt: new Date(
            now.getTime() - daysAgo[status] * 24 * 60 * 60 * 1000
          ),
          name: volName,
          email: volEmail,
          phone: volPhone,
          visitType: "First Visit",
          interests: ["Volunteering"],
          volunteerCategory: category,
          volunteerOnboardingStatus:
            status as (typeof volunteerStatuses)[number],
          assignedLeaderId: hasLeader ? matchingLeader.id : null,
          smsAutomationEnabled: status !== "INQUIRY",
          volunteerDocumentsSent: hasDocs
            ? {
                "Welcome Email": true,
                "Background Check Form": true,
                "Ministry Handbook": true,
              }
            : undefined,
          volunteerOrientationDate: hasOrientation
            ? isComplete
              ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Past orientation
              : new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // Upcoming orientation
            : null,
          volunteerOnboardingNotes: isComplete
            ? "Completed orientation, now serving weekly!"
            : null,
          extractedData: {
            name: volName,
            visitType: "First Visit",
            interests: ["Volunteering"],
            volunteerCategory: category,
          },
        },
      });

      // Create ChurchMember for this volunteer
      const churchMember = await prisma.churchMember.create({
        data: {
          organizationId: org.id,
          name: volName,
          email: volEmail,
          phone: volPhone,
          memberType: isComplete ? "MEMBER" : "VISITOR",
          visitDate: new Date(
            now.getTime() - daysAgo[status] * 24 * 60 * 60 * 1000
          ),
        },
      });

      // Create Volunteer record linked to ChurchMember
      const volunteer = await prisma.volunteer.create({
        data: {
          churchMemberId: churchMember.id,
          organizationId: org.id,
          locationId: location.id,
          status: volStatusMapping.status as
            | "ACTIVE"
            | "PENDING_APPROVAL"
            | "ON_BREAK"
            | "INACTIVE",
          backgroundCheckStatus: volStatusMapping.bgStatus as
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "PENDING_REVIEW"
            | "CLEARED"
            | "FLAGGED",
          startDate: new Date(
            now.getTime() - daysAgo[status] * 24 * 60 * 60 * 1000
          ),
          backgroundCheckDate: isComplete
            ? new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
            : null,
          backgroundCheckExpiry: isComplete
            ? new Date(now.getTime() + 365 * 2 * 24 * 60 * 60 * 1000) // 2 years out
            : null,
          documentsSentAt: hasDocs
            ? new Date(
                now.getTime() - (daysAgo[status] - 2) * 24 * 60 * 60 * 1000
              )
            : null,
          readyForExport: status === "READY",
          exportedAt:
            status === "ADDED_TO_PCO"
              ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              : null,
          notes: isComplete
            ? "Completed orientation, now serving weekly!"
            : null,
        },
      });

      // Create VolunteerCategory assignment
      await prisma.volunteerCategory.create({
        data: {
          volunteerId: volunteer.id,
          organizationId: org.id,
          category: enumCategory as
            | "GENERAL"
            | "GREETER"
            | "USHER"
            | "KIDS_MINISTRY"
            | "WORSHIP_TEAM"
            | "PARKING"
            | "HOSPITALITY"
            | "AV_TECH"
            | "PRAYER_TEAM"
            | "OTHER",
          assignedBy: matchingLeader.id,
        },
      });

      totalVolunteers++;
    }
  }
  console.log(
    `   ✅ ${totalVolunteers} volunteers in pipeline (with Volunteer records)\n`
  );

  // ============================================
  // STEP 7: CREATE PRAYER REQUESTS
  // ============================================
  console.log("🙏 Creating prayer requests...");

  const prayerDistribution = {
    HEALING: 10,
    FAMILY: 9,
    GUIDANCE: 7,
    PROVISION: 6,
    MENTAL_HEALTH: 6,
    RELATIONSHIPS: 5,
    SALVATION: 4,
    OTHER: 3,
  };

  let totalPrayers = 0;
  const prayerLead =
    leaders.find(l => l.volunteerCategories.includes("Prayer Team")) ||
    leaders[0];

  for (const [category, count] of Object.entries(prayerDistribution)) {
    const templates = prayerTemplates[category as keyof typeof prayerTemplates];

    for (let i = 0; i < count; i++) {
      const location = locations[i % locations.length];
      // Status distribution: 25% pending, 50% praying, 25% answered
      const statusRoll = Math.random();
      const status =
        statusRoll < 0.25
          ? "PENDING"
          : statusRoll < 0.75
            ? "PRAYING"
            : "ANSWERED";

      await prisma.prayerRequest.create({
        data: {
          organizationId: org.id,
          locationId: location.id,
          submittedBy: generateName(),
          request: templates[i % templates.length],
          category: category as (typeof prayerCategories)[number],
          status,
          isPrivate: Math.random() < 0.3,
          assignedToId: status !== "PENDING" ? prayerLead.id : null,
          createdAt: new Date(
            now.getTime() - Math.floor(Math.random() * 21) * 24 * 60 * 60 * 1000
          ),
        },
      });
      totalPrayers++;
    }
  }
  console.log(`   ✅ ${totalPrayers} prayer requests\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("═".repeat(60));
  console.log("✅ FRESH DEMO SEED COMPLETE");
  console.log("═".repeat(60) + "\n");

  console.log("📊 Created:");
  console.log(`   🏢 1 Organization: Newlife Church`);
  console.log(
    `   📍 5 Locations: Bainbridge, Bremerton, Silverdale, Port Orchard, Poulsbo`
  );
  console.log(`   👥 7 Users (1 platform admin, 1 pastor, 1 admin, 4 leaders)`);
  console.log(
    `   📦 ${totalBatches} Batches (processing, awaiting review, completed)`
  );
  console.log(`   📇 ${totalCards} Connect Cards (12 weeks history)`);
  console.log(`   👔 ${totalVolunteers} Volunteers in pipeline`);
  console.log(`   🙏 ${totalPrayers} Prayer Requests`);

  console.log("\n🔐 Demo Login:");
  console.log("   Email: admin@newlife.test");
  console.log("   Name:  Sarah Mitchell (Office Manager)");

  console.log("\n🎯 Dashboard will show:");
  console.log("   ✓ ~27 cards this week (green trend ↑)");
  console.log("   ✓ ~16 first-time visitors (green trend ↑)");
  console.log("   ✓ ~8 prayer requests (green trend ↑)");
  console.log("   ✓ ~7 volunteer interest (green trend ↑)");
  console.log("   ✓ Top categories: Healing, Family, Guidance");

  console.log("\n🌐 URLs:");
  const port = process.env.PORT || "3004";
  console.log(
    `   Dashboard:     http://localhost:${port}/church/newlife/admin`
  );
  console.log(
    `   Connect Cards: http://localhost:${port}/church/newlife/admin/connect-cards`
  );
  console.log(
    `   Volunteer:     http://localhost:${port}/church/newlife/admin/volunteer`
  );
  console.log(
    `   Prayer:        http://localhost:${port}/church/newlife/admin/prayer`
  );
  console.log(
    `   Team:          http://localhost:${port}/church/newlife/admin/team`
  );
}

main()
  .catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
