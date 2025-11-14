/**
 * Backfill Prayer Requests from Existing Connect Cards
 *
 * Creates PrayerRequest records for connect cards that have prayer requests
 * but don't yet have a PrayerRequest record created.
 *
 * This script is safe to run multiple times - it will skip cards that already
 * have prayer requests created.
 *
 * Run with: tsx scripts/backfill-prayer-requests.ts
 */

import { PrismaClient } from "../lib/generated/prisma";
import { createPrayerRequestFromConnectCard } from "../lib/data/prayer-requests";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting prayer request backfill...\n");

  // Find all reviewed connect cards with prayer requests
  // that don't yet have a PrayerRequest record
  const connectCards = await prisma.connectCard.findMany({
    where: {
      status: { in: ["REVIEWED", "PROCESSED"] }, // Only backfill reviewed cards
      prayerRequest: { not: null }, // Has a prayer request
      prayerRequests: { none: {} }, // But no PrayerRequest record yet
    },
    select: {
      id: true,
      organizationId: true,
      locationId: true,
      prayerRequest: true,
      name: true,
      scannedAt: true,
    },
    orderBy: {
      scannedAt: "asc", // Oldest first
    },
  });

  if (connectCards.length === 0) {
    console.log("✅ No connect cards need backfilling!");
    console.log("   All prayer requests have already been created.\n");
    return;
  }

  console.log(
    `📋 Found ${connectCards.length} connect cards with prayer requests to backfill\n`
  );

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const card of connectCards) {
    try {
      // Double-check prayer request text is not empty
      const prayerText = card.prayerRequest?.trim();
      if (!prayerText || prayerText.length === 0) {
        console.log(
          `  ⏭️  Skipped: ${card.name || card.id} (empty prayer request)`
        );
        skipCount++;
        continue;
      }

      // Create prayer request from connect card
      await createPrayerRequestFromConnectCard(
        card.id,
        card.organizationId,
        card.locationId,
        prayerText
      );

      successCount++;
      console.log(
        `  ✅ Created: ${card.name || card.id} - "${prayerText.substring(0, 50)}${prayerText.length > 50 ? "..." : ""}"`
      );
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed: ${card.name || card.id}`, error);
    }
  }

  console.log("\n📊 Backfill Summary:");
  console.log(`   Total cards processed: ${connectCards.length}`);
  console.log(`   ✅ Successfully created: ${successCount}`);
  console.log(`   ⏭️  Skipped (empty text): ${skipCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);

  if (errorCount > 0) {
    console.log(
      "\n⚠️  Some prayer requests failed to create. Check the error logs above."
    );
  } else {
    console.log("\n🙏 Prayer request backfill completed successfully!");
  }
}

main()
  .catch(error => {
    console.error("\n❌ Backfill script failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
