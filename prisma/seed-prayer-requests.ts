/**
 * Prayer Requests Seed Script
 *
 * Creates test prayer requests for local development and testing.
 * Generates 30 diverse prayer requests across various statuses, categories, and privacy levels.
 *
 * Run with: tsx prisma/seed-prayer-requests.ts
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

/**
 * Sample prayer request texts for realistic test data
 */
const SAMPLE_REQUESTS = [
  {
    request:
      "Please pray for my father who is recovering from surgery. The doctors say he's doing well but we're trusting God for complete healing.",
    category: "Health",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Our family is going through a difficult financial situation. Pray for provision and wisdom in managing our resources.",
    category: "Financial",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My daughter is struggling with anxiety. Please pray for peace and that she would find a good counselor.",
    category: "Health",
    isPrivate: true,
    isUrgent: false,
  },
  {
    request:
      "Pray for my coworker John. I've been sharing the gospel with him and he seems open. Pray he would accept Christ.",
    category: "Salvation",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My marriage is in crisis. We're in counseling but need prayer for breakthrough and restoration.",
    category: "Relationships",
    isPrivate: true,
    isUrgent: true,
  },
  {
    request:
      "Please pray for our youth group retreat this weekend. Pray for safety, spiritual growth, and that students would encounter God.",
    category: "Spiritual Growth",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "I lost my job two weeks ago. Praying for new employment opportunities and provision during this time.",
    category: "Work/Career",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My son is dealing with addiction. This is confidential - please pray for his deliverance and our family's strength.",
    category: "Health",
    isPrivate: true,
    isUrgent: true,
  },
  {
    request:
      "Thank you for praying! My mom's cancer scan came back clear! Praise God for His healing!",
    category: "Health",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Pray for our small group. We're studying spiritual disciplines and want to grow deeper in our faith.",
    category: "Spiritual Growth",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My grandmother is in hospice. Pray for comfort and peace for her and our family during this time.",
    category: "Health",
    isPrivate: false,
    isUrgent: true,
  },
  {
    request:
      "Struggling with doubt and feeling distant from God. Pray for renewed faith and passion for Him.",
    category: "Spiritual Growth",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My daughter is getting married next month. Pray for their marriage and the beginning of their life together.",
    category: "Family",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Please pray for wisdom regarding a major career decision. I have two job offers and need God's direction.",
    category: "Work/Career",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Pray for our church's building expansion project. We need $500k more in funding by year end.",
    category: "Financial",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My teenage son is rebellious and pulling away from the family. Pray for his heart to soften.",
    category: "Family",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Dealing with chronic pain from an old injury. Doctors don't know how to help. Trusting God for healing.",
    category: "Health",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My sister doesn't know Jesus. She's been resistant for years. Pray God would draw her to Himself.",
    category: "Salvation",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Pray for our missionary friends in Southeast Asia. They face persecution but are seeing people come to Christ.",
    category: "Salvation",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "We're trying to adopt but the process has been very difficult. Pray for patience and for God's timing.",
    category: "Family",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Battling depression and feeling overwhelmed. Need prayer for hope and strength to keep going.",
    category: "Health",
    isPrivate: true,
    isUrgent: false,
  },
  {
    request:
      "My company is downsizing. Pray I would keep my job or find a new one quickly if laid off.",
    category: "Work/Career",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Praise report! My husband accepted Christ last week after 15 years of praying. Thank you for your prayers!",
    category: "Salvation",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My mother-in-law is moving in with us. Pray for patience, grace, and that this would strengthen our family.",
    category: "Family",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "Starting a new business. Pray for wisdom, provision, and that it would honor God.",
    category: "Work/Career",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My friend is going through divorce. Pray for healing, wisdom, and God's comfort during this painful time.",
    category: "Relationships",
    isPrivate: true,
    isUrgent: false,
  },
  {
    request:
      "Pray for our pastor. He's been struggling with burnout and needs rest and renewed vision.",
    category: "Spiritual Growth",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "My nephew is serving in the military overseas. Pray for his safety and that he would sense God's presence.",
    category: "Other",
    isPrivate: false,
    isUrgent: false,
  },
  {
    request:
      "We're facing a legal battle. Don't share details but please pray for justice and God's intervention.",
    category: "Other",
    isPrivate: true,
    isUrgent: true,
  },
  {
    request:
      "Expecting our first baby in 3 months. Pray for a healthy pregnancy and delivery, and for us as new parents.",
    category: "Family",
    isPrivate: false,
    isUrgent: false,
  },
];

/**
 * Generate varied status for test data
 */
function getRandomStatus():
  | "PENDING"
  | "ASSIGNED"
  | "PRAYING"
  | "ANSWERED"
  | "ARCHIVED" {
  const statuses = [
    "PENDING",
    "ASSIGNED",
    "PRAYING",
    "ANSWERED",
    "ARCHIVED",
  ] as const;
  const weights = [0.3, 0.3, 0.2, 0.15, 0.05]; // 30% pending, 30% assigned, etc.

  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return statuses[i];
    }
  }

  return "PENDING"; // Fallback
}

/**
 * Generate realistic dates for answered prayers
 */
function getRandomAnsweredDate(): Date {
  const daysAgo = Math.floor(Math.random() * 60); // Random date in last 60 days
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Get random created date (within last 90 days)
 */
function getRandomCreatedDate(): Date {
  const daysAgo = Math.floor(Math.random() * 90);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function main() {
  console.log("🙏 Starting prayer requests seed...\n");

  // Get existing organization with locations
  const org = await prisma.organization.findFirst({
    where: {
      type: "CHURCH",
      locations: {
        some: {}, // Must have at least one location
      },
    },
    include: {
      locations: true,
      users: {
        where: {
          role: { in: ["church_admin", "user"] },
        },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!org) {
    console.error(
      "❌ No church organization found. Run main seed first: tsx prisma/seed.ts"
    );
    process.exit(1);
  }

  console.log(`📍 Using organization: ${org.name} (${org.slug})`);

  if (org.locations.length === 0) {
    console.error("❌ No locations found. Run main seed first.");
    process.exit(1);
  }

  console.log(`📍 Found ${org.locations.length} location(s)`);

  if (org.users.length === 0) {
    console.warn(
      "⚠️  No users found for assignment. Prayer requests will be unassigned."
    );
  } else {
    console.log(`👥 Found ${org.users.length} user(s) for assignment`);
  }

  // Get some connect cards if they exist (for linking)
  const connectCards = await prisma.connectCard.findMany({
    where: {
      organizationId: org.id,
    },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (connectCards.length > 0) {
    console.log(`📇 Found ${connectCards.length} connect cards for linking\n`);
  }

  // Delete existing prayer requests for clean seed
  console.log("🗑️  Deleting existing prayer requests...");
  await prisma.prayerRequest.deleteMany({
    where: {
      organizationId: org.id,
    },
  });
  console.log("✅ Existing data cleared\n");

  // Create prayer requests
  console.log("📝 Creating prayer requests...\n");

  let createdCount = 0;

  for (let i = 0; i < SAMPLE_REQUESTS.length; i++) {
    const sample = SAMPLE_REQUESTS[i];
    const status = getRandomStatus();
    const createdAt = getRandomCreatedDate();

    // Random location assignment
    const location =
      org.locations[Math.floor(Math.random() * org.locations.length)];

    // Random user assignment (50% chance if users exist and status is not PENDING)
    let assignedUser = null;
    if (org.users.length > 0 && status !== "PENDING" && Math.random() > 0.5) {
      assignedUser = org.users[Math.floor(Math.random() * org.users.length)];
    }

    // Link to connect card (30% chance if connect cards exist)
    const linkedCard =
      connectCards.length > 0 && Math.random() > 0.7
        ? connectCards[Math.floor(Math.random() * connectCards.length)]
        : null;

    // Follow-up date for assigned requests
    let followUpDate: Date | null = null;
    if (status === "ASSIGNED" || status === "PRAYING") {
      const daysAhead = Math.floor(Math.random() * 14) + 1;
      followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + daysAhead);
    }

    // Answered date and notes for answered prayers
    let answeredDate: Date | null = null;
    let answeredNotes: string | null = null;
    if (status === "ANSWERED") {
      answeredDate = getRandomAnsweredDate();
      answeredNotes =
        sample.request.includes("Praise") || sample.request.includes("Thank")
          ? "Prayer answered! Praising God!"
          : "God answered our prayers in His perfect timing. Thank you for praying with us.";
    }

    await prisma.prayerRequest.create({
      data: {
        organizationId: org.id,
        locationId: location.id,
        request: sample.request,
        category: sample.category,
        isPrivate: sample.isPrivate,
        isUrgent: sample.isUrgent,
        status,
        connectCardId: linkedCard?.id || null,
        submittedBy: linkedCard?.name || `Test User ${i + 1}`,
        submitterEmail: linkedCard?.email || null,
        submitterPhone: linkedCard?.phone || null,
        assignedToId: assignedUser?.id || null,
        assignedToName: assignedUser?.name || null,
        followUpDate,
        answeredDate,
        answeredNotes,
        createdAt,
      },
    });

    createdCount++;
    console.log(
      `  ✅ Created: ${sample.category} - ${status}${sample.isPrivate ? " (Private)" : ""}${sample.isUrgent ? " 🚨" : ""}`
    );
  }

  console.log(`\n✅ Created ${createdCount} prayer requests\n`);

  // Display summary statistics
  const stats = {
    total: createdCount,
    pending: await prisma.prayerRequest.count({
      where: { organizationId: org.id, status: "PENDING" },
    }),
    assigned: await prisma.prayerRequest.count({
      where: { organizationId: org.id, status: "ASSIGNED" },
    }),
    praying: await prisma.prayerRequest.count({
      where: { organizationId: org.id, status: "PRAYING" },
    }),
    answered: await prisma.prayerRequest.count({
      where: { organizationId: org.id, status: "ANSWERED" },
    }),
    private: await prisma.prayerRequest.count({
      where: { organizationId: org.id, isPrivate: true },
    }),
    urgent: await prisma.prayerRequest.count({
      where: { organizationId: org.id, isUrgent: true },
    }),
  };

  console.log("📊 Summary:");
  console.log(`   Total: ${stats.total}`);
  console.log(`   Pending: ${stats.pending}`);
  console.log(`   Assigned: ${stats.assigned}`);
  console.log(`   Praying: ${stats.praying}`);
  console.log(`   Answered: ${stats.answered}`);
  console.log(`   Private: ${stats.private}`);
  console.log(`   Urgent: ${stats.urgent}`);
  console.log("");
  console.log("🙏 Prayer requests seed completed successfully!");
}

main()
  .catch(e => {
    console.error("❌ Error seeding prayer requests:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
