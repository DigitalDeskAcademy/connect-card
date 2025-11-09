/**
 * Clear all sessions for test user to force re-authentication
 */

import { prisma } from "../lib/db";

async function main() {
  // Find test user
  const user = await prisma.user.findUnique({
    where: { email: "test@playwright.dev" },
  });

  if (!user) {
    console.log("❌ Test user not found");
    return;
  }

  console.log("✅ Found test user:", user.email);

  // Delete all sessions for this user
  const result = await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  console.log(`✅ Deleted ${result.count} session(s)`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
