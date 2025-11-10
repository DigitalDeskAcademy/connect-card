/**
 * Clear Connect Cards Script
 *
 * Removes all connect cards and batches from the database.
 * Useful for testing and resetting the system.
 */

import "dotenv/config";
import { prisma } from "../lib/db";

async function clearConnectCards() {
  try {
    console.log("🗑️  Clearing all connect cards and batches...");

    // Delete in correct order (cards first, then batches due to foreign key)
    const deletedCards = await prisma.connectCard.deleteMany({});
    console.log(`✅ Deleted ${deletedCards.count} connect cards`);

    const deletedBatches = await prisma.connectCardBatch.deleteMany({});
    console.log(`✅ Deleted ${deletedBatches.count} batches`);

    console.log("✨ Database cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearConnectCards();
