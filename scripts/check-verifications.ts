import { prisma } from "../lib/db";

async function checkVerifications() {
  const verifications = await prisma.verification.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  console.log("=== Recent Verification Records ===");
  console.log(JSON.stringify(verifications, null, 2));
  console.log(`\nTotal records: ${verifications.length}`);

  await prisma.$disconnect();
}

checkVerifications().catch(console.error);
