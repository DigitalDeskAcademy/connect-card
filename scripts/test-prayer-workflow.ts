import { prisma } from "@/lib/db";

async function checkWorkflow() {
  console.log("\n=== Connect Card → Prayer Workflow Verification ===\n");

  // 1. Check connect cards with prayer requests
  const cardsWithPrayers = await prisma.connectCard.findMany({
    where: {
      prayerRequest: { not: null },
    },
    select: {
      id: true,
      name: true,
      prayerRequest: true,
      status: true,
      scannedAt: true,
    },
    orderBy: { scannedAt: "desc" },
    take: 5,
  });

  console.log(
    `📋 Connect Cards with Prayer Requests: ${cardsWithPrayers.length} found\n`
  );
  for (let i = 0; i < cardsWithPrayers.length; i++) {
    const card = cardsWithPrayers[i];
    console.log(`${i + 1}. ${card.name} (${card.status})`);
    const prayerText = card.prayerRequest?.substring(0, 60) || "";
    console.log(`   Prayer: ${prayerText}...`);
    console.log(`   Scanned: ${card.scannedAt.toLocaleDateString()}\n`);
  }

  // 2. Check prayer requests created from connect cards
  const prayersFromCards = await prisma.prayerRequest.findMany({
    where: {
      connectCardId: { not: null },
    },
    select: {
      id: true,
      request: true,
      category: true,
      isPrivate: true,
      status: true,
      connectCardId: true,
      submittedBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log(
    `🙏 Prayer Requests from Connect Cards: ${prayersFromCards.length} found\n`
  );
  for (let i = 0; i < prayersFromCards.length; i++) {
    const prayer = prayersFromCards[i];
    console.log(
      `${i + 1}. ${prayer.submittedBy || "Unknown"} (${prayer.status})`
    );
    console.log(`   Request: ${prayer.request.substring(0, 60)}...`);
    console.log(
      `   Category: ${prayer.category || "None"} | Private: ${prayer.isPrivate}`
    );
    console.log(`   Created: ${prayer.createdAt.toLocaleDateString()}\n`);
  }

  // 3. Check total prayer requests
  const totalPrayers = await prisma.prayerRequest.count();
  const manualPrayers = await prisma.prayerRequest.count({
    where: { connectCardId: null },
  });

  console.log(`📊 Summary:`);
  console.log(`   Total Prayers: ${totalPrayers}`);
  console.log(`   From Connect Cards: ${prayersFromCards.length}`);
  console.log(`   Manual Entry: ${manualPrayers}`);
  const automationRate =
    totalPrayers > 0
      ? Math.round((prayersFromCards.length / totalPrayers) * 100)
      : 0;
  console.log(`   Automation Rate: ${automationRate}%\n`);

  await prisma.$disconnect();
}

checkWorkflow().catch(console.error);
