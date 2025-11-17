/**
 * Church Connect Card - Weekly Simulation Seed
 *
 * Simulates a typical Sunday service week by adding:
 * - Connect cards from all campuses (20-40 per location)
 * - Prayer requests with severity scoring
 * - Prayer escalations for high-priority requests
 * - Volunteer interest signups
 * - New staff onboarding
 *
 * Run this after seed.ts to add weekly data.
 * Can be run multiple times to simulate multiple weeks.
 */

import { PrismaClient } from "../lib/generated/prisma";
import crypto from "crypto";

const prisma = new PrismaClient();

// Realistic name pools
const FIRST_NAMES = [
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
  "Daniel",
  "Nancy",
  "Matthew",
  "Lisa",
  "Anthony",
  "Betty",
  "Mark",
  "Margaret",
  "Donald",
  "Sandra",
  "Steven",
  "Ashley",
  "Andrew",
  "Kimberly",
  "Joshua",
  "Emily",
  "Kevin",
  "Donna",
  "Brian",
  "Michelle",
];

const LAST_NAMES = [
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
  "Thompson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
];

const PRAYER_REQUEST_TEMPLATES = {
  medical: [
    "My father was diagnosed with cancer and needs prayer for healing",
    "Please pray for my mother's upcoming surgery",
    "Struggling with chronic pain, need prayer for relief",
    "Family member in the hospital, pray for recovery",
    "Dealing with a serious health diagnosis, need strength",
  ],
  family: [
    "Marriage is struggling, need prayer for restoration",
    "Teenage son is making poor choices, pray for wisdom",
    "Daughter away at college, pray for her safety",
    "Family conflict needs resolution",
    "Expecting a baby, pray for safe delivery",
  ],
  financial: [
    "Lost my job, praying for provision",
    "Struggling with debt, need breakthrough",
    "Business is failing, need direction",
    "Medical bills are overwhelming",
  ],
  spiritual: [
    "Struggling with doubt, need stronger faith",
    "Feel distant from God, need reconnection",
    "Dealing with addiction, need freedom",
    "Battling depression and anxiety",
    "Want to grow closer to God",
  ],
  general: [
    "Pray for wisdom in a big decision",
    "Need direction for my life",
    "Dealing with loneliness",
    "Struggling with work stress",
    "Please pray for me",
  ],
};

const INTERESTS = [
  "Volunteering",
  "Youth Ministry",
  "Worship Team",
  "Children's Ministry",
  "Prayer Team",
  "Hospitality Team",
  "Missions",
  "Small Groups",
  "Counseling Ministry",
];

const VOLUNTEER_CATEGORIES = [
  "Hospitality",
  "Worship",
  "Kids Ministry",
  "Youth",
  "First Impressions",
  "Production",
  "Prayer",
  "Outreach",
];

const VISIT_TYPES = [
  "First Time Guest",
  "First Time Guest",
  "First Time Guest",
  "Returning Guest",
  "Returning Guest",
  "Regular Attender",
  "Regular Attender",
  "Regular Attender",
  "Member",
];

/**
 * Generate random full name
 */
function randomName(): { first: string; last: string; full: string } {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return { first, last, full: `${first} ${last}` };
}

/**
 * Generate email from name
 */
function generateEmail(firstName: string, lastName: string): string {
  const providers = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com"];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const random = Math.floor(Math.random() * 999);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${random}@${provider}`;
}

/**
 * Generate phone number
 */
function generatePhone(): string {
  const area = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${prefix}-${line}`;
}

/**
 * Get random prayer request with severity
 */
function generatePrayerRequest(): {
  request: string;
  category: string;
  severity: number;
} {
  const categories = Object.keys(PRAYER_REQUEST_TEMPLATES);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const templates =
    PRAYER_REQUEST_TEMPLATES[category as keyof typeof PRAYER_REQUEST_TEMPLATES];
  const request = templates[Math.floor(Math.random() * templates.length)];

  // Severity scoring (1-10)
  // Medical and family issues tend to be more severe
  let severity: number;
  if (category === "medical") {
    severity = Math.floor(Math.random() * 4) + 7; // 7-10
  } else if (category === "family") {
    severity = Math.floor(Math.random() * 5) + 5; // 5-9
  } else if (category === "spiritual") {
    severity = Math.floor(Math.random() * 6) + 4; // 4-9
  } else {
    severity = Math.floor(Math.random() * 6) + 3; // 3-8
  }

  return { request, category, severity };
}

/**
 * Determine if card should have prayer request (40% chance)
 */
function shouldHavePrayerRequest(): boolean {
  return Math.random() < 0.4;
}

/**
 * Determine if visitor is interested in volunteering (25% chance)
 */
function shouldHaveVolunteerInterest(): boolean {
  return Math.random() < 0.25;
}

/**
 * Get Sunday date for this week
 */
function getLastSunday(weeksAgo: number = 0): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? 0 : dayOfWeek; // If today is Sunday (0), use today, else go back
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - diff - weeksAgo * 7); // Go back N weeks
  sunday.setHours(10, 30, 0, 0); // 10:30 AM service time
  return sunday;
}

/**
 * Generate realistic scanned timestamp
 * Cards are collected on Sunday but scanned/entered throughout the week
 */
function generateScanTimestamp(baseDate: Date): Date {
  // Distribute across Sun-Wed (4 days) to create smooth chart trends
  const daysAfter = Math.floor(Math.random() * 4); // 0-3 days after Sunday
  const scanTime = new Date(baseDate);
  scanTime.setDate(scanTime.getDate() + daysAfter);

  // Random time during business hours (9 AM - 5 PM)
  const hours = 9 + Math.floor(Math.random() * 8);
  const minutes = Math.floor(Math.random() * 60);
  scanTime.setHours(hours, minutes, 0, 0);

  return scanTime;
}

async function main() {
  // Get weeksAgo from command line argument (default: 0 = this week)
  const weeksAgo = process.argv[2] ? parseInt(process.argv[2]) : 0;

  console.log("🌱 Starting Weekly Simulation Seed...\n");

  // Get Newlife Church organization
  const newlifeOrg = await prisma.organization.findUnique({
    where: { slug: "newlife" },
    include: {
      locations: true,
    },
  });

  if (!newlifeOrg) {
    console.error(
      "❌ Newlife Church organization not found. Please run seed.ts first."
    );
    process.exit(1);
  }

  console.log(`✅ Found organization: ${newlifeOrg.name}`);
  console.log(`📍 Locations: ${newlifeOrg.locations.length}\n`);

  // Sunday service date
  const sundayDate = getLastSunday(weeksAgo);
  console.log(
    `📅 Simulating Sunday service: ${sundayDate.toLocaleDateString()} ${weeksAgo > 0 ? `(${weeksAgo} weeks ago)` : "(this week)"}\n`
  );

  // Statistics
  let totalCards = 0;
  let totalPrayerRequests = 0;
  let escalatedPrayers = 0;
  let volunteerSignups = 0;

  const prayerEscalations: Array<{
    name: string;
    location: string;
    request: string;
    severity: number;
    category: string;
  }> = [];

  // Generate connect cards for each location
  for (const location of newlifeOrg.locations) {
    // Base attendance by campus size
    const baseAttendanceByLocation: Record<string, number> = {
      bainbridge: 45, // Main campus
      bremerton: 35,
      silverdale: 30,
      "port-orchard": 25,
      poulsbo: 20,
    };

    const baseAttendance =
      baseAttendanceByLocation[location.slug] ||
      Math.floor(Math.random() * 20) + 15;

    // Add realistic weekly variance (+/- 30% to create visible trends)
    const variance = 0.3; // 30% variance
    const minAttendance = Math.floor(baseAttendance * (1 - variance));
    const maxAttendance = Math.floor(baseAttendance * (1 + variance));
    const numCards =
      Math.floor(Math.random() * (maxAttendance - minAttendance + 1)) +
      minAttendance;

    console.log(
      `📍 ${location.name} Campus - Generating ${numCards} connect cards...`
    );

    for (let i = 0; i < numCards; i++) {
      const name = randomName();
      const email = generateEmail(name.first, name.last);
      const phone = generatePhone();
      const visitType =
        VISIT_TYPES[Math.floor(Math.random() * VISIT_TYPES.length)];
      const scanTimestamp = generateScanTimestamp(sundayDate);

      // Prayer request (40% chance)
      let prayerRequest = null;
      let prayerCategory = null;
      let prayerSeverity = null;

      if (shouldHavePrayerRequest()) {
        const prayer = generatePrayerRequest();
        prayerRequest = prayer.request;
        prayerCategory = prayer.category;
        prayerSeverity = prayer.severity;
        totalPrayerRequests++;

        // Escalate high-priority prayers (severity >= 8)
        if (prayer.severity >= 8) {
          escalatedPrayers++;
          prayerEscalations.push({
            name: name.full,
            location: location.name,
            request: prayer.request,
            severity: prayer.severity,
            category: prayer.category,
          });
        }
      }

      // Volunteer interest (25% chance)
      const interests: string[] = [];
      let volunteerCategory = null;
      let volunteerOnboardingStatus = null;
      let volunteerDocumentsSent = null;
      let volunteerOrientationDate = null;
      let volunteerOnboardingNotes = null;

      if (shouldHaveVolunteerInterest()) {
        // Always include "Volunteering" interest
        interests.push("Volunteering");

        // Add 0-1 additional interests
        const numAdditionalInterests = Math.floor(Math.random() * 2); // 0-1 additional
        const availableInterests = INTERESTS.filter(i => i !== "Volunteering");
        for (let j = 0; j < numAdditionalInterests; j++) {
          const idx = Math.floor(Math.random() * availableInterests.length);
          interests.push(availableInterests[idx]);
          availableInterests.splice(idx, 1);
        }

        // Assign volunteer category
        volunteerCategory =
          VOLUNTEER_CATEGORIES[
            Math.floor(Math.random() * VOLUNTEER_CATEGORIES.length)
          ];

        // Assign onboarding status (weighted distribution for demo)
        const statusChance = Math.random();
        if (statusChance < 0.5) {
          volunteerOnboardingStatus = "INQUIRY"; // 50% still at inquiry
        } else if (statusChance < 0.7) {
          volunteerOnboardingStatus = "WELCOME_SENT"; // 20% at welcome sent
          volunteerOnboardingNotes = "Welcome message sent automatically";
        } else if (statusChance < 0.85) {
          volunteerOnboardingStatus = "DOCUMENTS_SHARED"; // 15% at documents shared
          volunteerDocumentsSent = {
            "Welcome Email": true,
            "Leader Introduction": true,
            "Background Check Form": volunteerCategory === "Kids Ministry",
            "Volunteer Waiver": volunteerCategory !== "Kids Ministry",
          };
          volunteerOnboardingNotes = "Documents sent via email";
        } else if (statusChance < 0.95) {
          volunteerOnboardingStatus = "LEADER_CONNECTED"; // 10% at leader connected
          volunteerDocumentsSent = {
            "Welcome Email": true,
            "Leader Introduction": true,
            "Background Check Form": volunteerCategory === "Kids Ministry",
          };
          volunteerOnboardingNotes = "Connected with ministry leader";
        } else {
          volunteerOnboardingStatus = "ORIENTATION_SET"; // 5% at orientation scheduled
          volunteerDocumentsSent = {
            "Welcome Email": true,
            "Leader Introduction": true,
            "Background Check Form": true,
            "Orientation Calendar": true,
          };
          // Set orientation date 1-2 weeks from scan date
          const daysUntilOrientation = Math.floor(Math.random() * 7) + 7; // 7-14 days
          volunteerOrientationDate = new Date(scanTimestamp);
          volunteerOrientationDate.setDate(
            volunteerOrientationDate.getDate() + daysUntilOrientation
          );
          volunteerOnboardingNotes = `Orientation scheduled for ${volunteerOrientationDate.toLocaleDateString()}`;
        }

        volunteerSignups++;
      }

      // Create connect card
      await prisma.connectCard.create({
        data: {
          organizationId: newlifeOrg.id,
          locationId: location.id,
          imageKey: `demo/connect-cards/${crypto.randomUUID()}.jpg`, // Demo placeholder
          name: name.full,
          email,
          phone,
          visitType,
          prayerRequest,
          interests,
          volunteerCategory,
          status: "EXTRACTED",
          scannedAt: scanTimestamp,
          // Volunteer onboarding fields
          volunteerOnboardingStatus,
          volunteerDocumentsSent,
          volunteerOrientationDate,
          volunteerOnboardingNotes,
          extractedData: {
            firstName: name.first,
            lastName: name.last,
            email,
            phone,
            visitType,
            prayerRequest,
            interests,
            prayerCategory,
            prayerSeverity,
            volunteerCategory,
          },
          createdAt: scanTimestamp,
          updatedAt: scanTimestamp,
        },
      });

      totalCards++;
    }

    console.log(`   ✅ ${numCards} cards created for ${location.name}\n`);
  }

  // Generate detailed reports
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 WEEKLY SIMULATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`📅 Service Date: ${sundayDate.toLocaleDateString()}`);
  console.log(`🏢 Organization: ${newlifeOrg.name}`);
  console.log(`📍 Locations: ${newlifeOrg.locations.length} campuses\n`);

  console.log("📈 ATTENDANCE METRICS:");
  console.log(`   Total Connect Cards: ${totalCards}`);
  console.log(`   Prayer Requests: ${totalPrayerRequests}`);
  console.log(`   Volunteer Signups: ${volunteerSignups}\n`);

  // Breakdown by location
  console.log("📍 ATTENDANCE BY CAMPUS:");
  for (const location of newlifeOrg.locations) {
    const locationCards = await prisma.connectCard.count({
      where: {
        locationId: location.id,
        scannedAt: {
          gte: sundayDate,
        },
      },
    });
    const locationPrayers = await prisma.connectCard.count({
      where: {
        locationId: location.id,
        scannedAt: {
          gte: sundayDate,
        },
        prayerRequest: {
          not: null,
        },
      },
    });
    console.log(
      `   ${location.name.padEnd(15)} ${locationCards} cards, ${locationPrayers} prayer requests`
    );
  }

  // Visitor type breakdown
  console.log("\n👥 VISITOR TYPE BREAKDOWN:");
  const firstTime = await prisma.connectCard.count({
    where: {
      organizationId: newlifeOrg.id,
      scannedAt: { gte: sundayDate },
      visitType: { contains: "First Time" },
    },
  });
  const returning = await prisma.connectCard.count({
    where: {
      organizationId: newlifeOrg.id,
      scannedAt: { gte: sundayDate },
      visitType: "Returning Guest",
    },
  });
  const regular = await prisma.connectCard.count({
    where: {
      organizationId: newlifeOrg.id,
      scannedAt: { gte: sundayDate },
      visitType: "Regular Attender",
    },
  });
  const members = await prisma.connectCard.count({
    where: {
      organizationId: newlifeOrg.id,
      scannedAt: { gte: sundayDate },
      visitType: "Member",
    },
  });

  console.log(`   First-Time Guests:  ${firstTime}`);
  console.log(`   Returning Guests:   ${returning}`);
  console.log(`   Regular Attenders:  ${regular}`);
  console.log(`   Members:            ${members}`);

  // Prayer escalations report
  if (escalatedPrayers > 0) {
    console.log("\n🚨 PRAYER ESCALATIONS (ELDER ATTENTION REQUIRED):");
    console.log(
      `   ${escalatedPrayers} high-priority prayer requests (severity 8-10)\n`
    );

    prayerEscalations.forEach((escalation, index) => {
      console.log(
        `   ${index + 1}. ${escalation.name} (${escalation.location})`
      );
      console.log(`      Category: ${escalation.category}`);
      console.log(`      Severity: ${escalation.severity}/10`);
      console.log(`      Request: "${escalation.request}"`);
      console.log("");
    });
  } else {
    console.log("\n✅ No high-priority prayer escalations this week");
  }

  // Follow-up tasks
  console.log("\n📋 RECOMMENDED FOLLOW-UP ACTIONS:");
  if (firstTime > 0) {
    console.log(`   ✉️  Send welcome emails to ${firstTime} first-time guests`);
  }
  if (returning > 0) {
    console.log(`   📞 Follow up with ${returning} returning guests`);
  }
  if (volunteerSignups > 0) {
    console.log(`   🤝 Contact ${volunteerSignups} volunteer interest signups`);
  }
  if (escalatedPrayers > 0) {
    console.log(`   🙏 Assign ${escalatedPrayers} escalated prayers to elders`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅ Weekly simulation completed successfully!");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("💡 DEMO WALKTHROUGH:");
  console.log("   1. Login: http://localhost:3000/church/newlife/login");
  console.log("   2. View Dashboard with updated analytics");
  console.log("   3. Check Connect Cards section for new entries");
  console.log("   4. Review prayer escalations in review queue");
  console.log("   5. Run this seed again to simulate next week's service\n");
}

main()
  .catch(e => {
    console.error("❌ Error running weekly simulation:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
