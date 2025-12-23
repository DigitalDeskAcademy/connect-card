/**
 * Member Unification: Phase 2 Data Migration
 *
 * Migrates data from the Volunteer model to the unified ChurchMember model.
 * This script is idempotent - safe to run multiple times.
 *
 * What it does:
 * 1. Migrates volunteer fields from Volunteer → ChurchMember
 * 2. Splits name into firstName + lastName
 * 3. Maps memberType enum to journeyStatus + role booleans
 * 4. Flattens VolunteerCategory to volunteerCategories array
 * 5. Links VolunteerSkill to ChurchMember via churchMemberId
 *
 * Run with: tsx scripts/migrate-volunteer-to-churchmember.ts
 * Dry run:  tsx scripts/migrate-volunteer-to-churchmember.ts --dry-run
 *
 * @see /docs/member-unification-implementation-plan.md
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

// Check for dry-run flag
const isDryRun = process.argv.includes("--dry-run");

// Stats tracking
const stats = {
  volunteersProcessed: 0,
  volunteersMigrated: 0,
  volunteersSkipped: 0,
  namesSplit: 0,
  journeyStatusUpdated: 0,
  roleFlagsSet: 0,
  categoriesFlattened: 0,
  skillsLinked: 0,
  errors: [] as string[],
};

/**
 * Split a full name into firstName and lastName
 */
function splitName(fullName: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!fullName || fullName.trim() === "") {
    return { firstName: null, lastName: null };
  }

  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length === 1) {
    // Single name - treat as first name
    return { firstName: parts[0], lastName: null };
  }

  // First word is firstName, rest is lastName
  const [first, ...rest] = parts;
  return {
    firstName: first,
    lastName: rest.join(" ") || null,
  };
}

/**
 * Map MemberType enum to journeyStatus string
 */
function mapMemberTypeToJourneyStatus(
  memberType: string | null
): string | null {
  if (!memberType) return "visitor";

  const mapping: Record<string, string> = {
    VISITOR: "visitor",
    RETURNING: "returning",
    MEMBER: "member",
    VOLUNTEER: "regular", // Volunteers who aren't formal members
    STAFF: "member", // Staff are typically members
  };

  return mapping[memberType] || "visitor";
}

/**
 * Map VolunteerStatus enum to lowercase string for unified model
 */
function mapVolunteerStatus(status: string | null): string | null {
  if (!status) return null;

  const mapping: Record<string, string> = {
    ACTIVE: "active",
    ON_BREAK: "on_break",
    INACTIVE: "inactive",
    PENDING_APPROVAL: "pending",
  };

  return mapping[status] || status.toLowerCase();
}

/**
 * Map BackgroundCheckStatus enum to lowercase string
 */
function mapBackgroundCheckStatus(status: string | null): string | null {
  if (!status) return null;

  const mapping: Record<string, string> = {
    NOT_STARTED: "not_started",
    IN_PROGRESS: "in_progress",
    PENDING_REVIEW: "pending_review",
    CLEARED: "cleared",
    FLAGGED: "flagged",
    EXPIRED: "expired",
  };

  return mapping[status] || status.toLowerCase();
}

/**
 * Map AutomationStatus enum to lowercase string
 */
function mapAutomationStatus(status: string | null): string | null {
  if (!status) return null;

  const mapping: Record<string, string> = {
    PENDING: "pending",
    DAY1_SENT: "day1_sent",
    DAY3_SENT: "day3_sent",
    RESPONDED: "responded",
    EXPIRED: "expired",
  };

  return mapping[status] || status.toLowerCase();
}

/**
 * Step 1: Migrate Volunteer data to ChurchMember
 */
async function migrateVolunteers() {
  console.log("\n📋 Step 1: Migrating Volunteer data to ChurchMember...\n");

  const volunteers = await prisma.volunteer.findMany({
    include: {
      churchMember: true,
      categories: true,
      skills: true,
    },
  });

  console.log(`   Found ${volunteers.length} volunteer records to process\n`);

  for (const volunteer of volunteers) {
    stats.volunteersProcessed++;

    try {
      // Check if already migrated (isVolunteer = true)
      if (volunteer.churchMember.isVolunteer) {
        console.log(
          `   ⏭️  Skipped: ${volunteer.churchMember.name} (already migrated)`
        );
        stats.volunteersSkipped++;
        continue;
      }

      // Flatten categories to string array
      const volunteerCategories = volunteer.categories.map(c => c.category);

      const updateData = {
        // Set role flag
        isVolunteer: true,

        // Location (for multi-campus filtering)
        locationId: volunteer.locationId,

        // Volunteer status
        volunteerStatus: mapVolunteerStatus(volunteer.status),
        volunteerStartDate: volunteer.startDate,
        volunteerEndDate: volunteer.endDate,
        volunteerInactiveReason: volunteer.inactiveReason,
        volunteerNotes: volunteer.notes,

        // Flatten categories
        volunteerCategories,

        // Emergency contact
        emergencyContactName: volunteer.emergencyContactName,
        emergencyContactPhone: volunteer.emergencyContactPhone,

        // Background check
        backgroundCheckStatus: mapBackgroundCheckStatus(
          volunteer.backgroundCheckStatus
        ),
        backgroundCheckDate: volunteer.backgroundCheckDate,
        backgroundCheckExpiry: volunteer.backgroundCheckExpiry,
        bgCheckToken: volunteer.bgCheckToken,
        bgCheckConfirmedAt: volunteer.bgCheckConfirmedAt,

        // Export tracking
        readyForExport: volunteer.readyForExport,
        readyForExportDate: volunteer.readyForExportDate,
        volunteerExportedAt: volunteer.exportedAt,
        documentsSentAt: volunteer.documentsSentAt,

        // Automation
        automationStatus: mapAutomationStatus(volunteer.automationStatus),
        automationStartedAt: volunteer.automationStartedAt,
        automationResponseAt: volunteer.automationResponseAt,
      };

      if (isDryRun) {
        console.log(
          `   🔍 Would migrate: ${volunteer.churchMember.name} (${volunteerCategories.length} categories)`
        );
      } else {
        await prisma.churchMember.update({
          where: { id: volunteer.churchMemberId },
          data: updateData,
        });
        console.log(
          `   ✅ Migrated: ${volunteer.churchMember.name} (${volunteerCategories.length} categories)`
        );
      }

      stats.volunteersMigrated++;
      if (volunteerCategories.length > 0) {
        stats.categoriesFlattened++;
      }
    } catch (error) {
      const errorMsg = `Failed to migrate volunteer ${volunteer.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }
}

/**
 * Step 2: Split names into firstName + lastName
 */
async function splitNames() {
  console.log("\n📋 Step 2: Splitting names into firstName + lastName...\n");

  // Find members where firstName is null but name exists
  const members = await prisma.churchMember.findMany({
    where: {
      firstName: null,
      name: { not: "" },
    },
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`   Found ${members.length} members needing name split\n`);

  for (const member of members) {
    try {
      const { firstName, lastName } = splitName(member.name);

      if (isDryRun) {
        console.log(
          `   🔍 Would split: "${member.name}" → first: "${firstName}", last: "${lastName}"`
        );
      } else {
        await prisma.churchMember.update({
          where: { id: member.id },
          data: { firstName, lastName },
        });
        console.log(
          `   ✅ Split: "${member.name}" → first: "${firstName}", last: "${lastName}"`
        );
      }

      stats.namesSplit++;
    } catch (error) {
      const errorMsg = `Failed to split name for member ${member.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }
}

/**
 * Step 3: Backfill journeyStatus from memberType
 */
async function backfillJourneyStatus() {
  console.log("\n📋 Step 3: Backfilling journeyStatus from memberType...\n");

  // Find members where journeyStatus is still default but memberType might differ
  const members = await prisma.churchMember.findMany({
    where: {
      OR: [{ journeyStatus: "visitor" }, { journeyStatus: null }],
      memberType: { not: "VISITOR" },
    },
    select: {
      id: true,
      name: true,
      memberType: true,
    },
  });

  console.log(
    `   Found ${members.length} members needing journey status update\n`
  );

  for (const member of members) {
    try {
      const journeyStatus = mapMemberTypeToJourneyStatus(member.memberType);

      if (isDryRun) {
        console.log(
          `   🔍 Would update: ${member.name} (${member.memberType} → ${journeyStatus})`
        );
      } else {
        await prisma.churchMember.update({
          where: { id: member.id },
          data: { journeyStatus },
        });
        console.log(
          `   ✅ Updated: ${member.name} (${member.memberType} → ${journeyStatus})`
        );
      }

      stats.journeyStatusUpdated++;
    } catch (error) {
      const errorMsg = `Failed to update journeyStatus for ${member.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }
}

/**
 * Step 4: Set role booleans based on memberType
 */
async function setRoleFlags() {
  console.log("\n📋 Step 4: Setting role booleans from memberType...\n");

  // Set isStaff for STAFF members
  const staffMembers = await prisma.churchMember.findMany({
    where: {
      memberType: "STAFF",
      isStaff: false,
    },
    select: { id: true, name: true },
  });

  console.log(`   Found ${staffMembers.length} staff members to flag\n`);

  for (const member of staffMembers) {
    try {
      if (isDryRun) {
        console.log(`   🔍 Would set isStaff=true: ${member.name}`);
      } else {
        await prisma.churchMember.update({
          where: { id: member.id },
          data: { isStaff: true },
        });
        console.log(`   ✅ Set isStaff=true: ${member.name}`);
      }

      stats.roleFlagsSet++;
    } catch (error) {
      const errorMsg = `Failed to set isStaff for ${member.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }

  // Note: isVolunteer is set in Step 1 during volunteer migration
  // isLeader will be set manually or through future ministry leader assignments
}

/**
 * Step 5: Link VolunteerSkills to ChurchMember
 */
async function linkSkillsToChurchMember() {
  console.log("\n📋 Step 5: Linking VolunteerSkills to ChurchMember...\n");

  // Find skills where churchMemberId is not set
  const skills = await prisma.volunteerSkill.findMany({
    where: {
      churchMemberId: null,
    },
    include: {
      volunteer: {
        select: {
          churchMemberId: true,
          churchMember: { select: { name: true } },
        },
      },
    },
  });

  console.log(`   Found ${skills.length} skills to link\n`);

  for (const skill of skills) {
    try {
      const churchMemberId = skill.volunteer.churchMemberId;
      const memberName = skill.volunteer.churchMember.name;

      if (isDryRun) {
        console.log(`   🔍 Would link: "${skill.skillName}" → ${memberName}`);
      } else {
        await prisma.volunteerSkill.update({
          where: { id: skill.id },
          data: { churchMemberId },
        });
        console.log(`   ✅ Linked: "${skill.skillName}" → ${memberName}`);
      }

      stats.skillsLinked++;
    } catch (error) {
      const errorMsg = `Failed to link skill ${skill.id}: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }
}

/**
 * Validation: Verify migration integrity
 */
async function validateMigration() {
  console.log("\n📋 Validation: Checking migration integrity...\n");

  // Count volunteers vs isVolunteer=true
  const volunteerCount = await prisma.volunteer.count();
  const migratedCount = await prisma.churchMember.count({
    where: { isVolunteer: true },
  });

  console.log(`   Volunteer records: ${volunteerCount}`);
  console.log(`   ChurchMembers with isVolunteer=true: ${migratedCount}`);

  if (volunteerCount !== migratedCount) {
    console.log(
      `   ⚠️  Mismatch: ${volunteerCount - migratedCount} volunteers not yet migrated`
    );
  } else {
    console.log(`   ✅ All volunteers migrated`);
  }

  // Check for skills not linked
  const unlinkedSkills = await prisma.volunteerSkill.count({
    where: { churchMemberId: null },
  });
  console.log(`   Unlinked skills: ${unlinkedSkills}`);

  // Check for members without firstName
  const missingFirstName = await prisma.churchMember.count({
    where: {
      firstName: null,
      name: { not: "" },
    },
  });
  console.log(`   Members missing firstName: ${missingFirstName}`);
}

/**
 * Main migration function
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Member Unification: Phase 2 Data Migration");
  console.log("═══════════════════════════════════════════════════════════");

  if (isDryRun) {
    console.log("\n🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Run migration steps
  await migrateVolunteers();
  await splitNames();
  await backfillJourneyStatus();
  await setRoleFlags();
  await linkSkillsToChurchMember();

  // Validate
  await validateMigration();

  // Print summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Migration Summary");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Volunteers processed: ${stats.volunteersProcessed}`);
  console.log(`  Volunteers migrated:  ${stats.volunteersMigrated}`);
  console.log(`  Volunteers skipped:   ${stats.volunteersSkipped}`);
  console.log(`  Names split:          ${stats.namesSplit}`);
  console.log(`  Journey status set:   ${stats.journeyStatusUpdated}`);
  console.log(`  Role flags set:       ${stats.roleFlagsSet}`);
  console.log(`  Categories flattened: ${stats.categoriesFlattened}`);
  console.log(`  Skills linked:        ${stats.skillsLinked}`);
  console.log(`  Errors:               ${stats.errors.length}`);
  console.log("═══════════════════════════════════════════════════════════");

  if (stats.errors.length > 0) {
    console.log("\n❌ Errors encountered:");
    stats.errors.forEach(err => console.log(`   - ${err}`));
  }

  if (isDryRun) {
    console.log(
      "\n🔍 This was a dry run. Run without --dry-run to apply changes."
    );
  } else {
    console.log("\n✅ Migration complete!");
  }
}

main()
  .catch(error => {
    console.error("\n❌ Migration script failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
