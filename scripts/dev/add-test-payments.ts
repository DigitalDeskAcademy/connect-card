/**
 * Quick script to add test payment data for pagination testing
 * Run: pnpm tsx scripts/dev/add-test-payments.ts
 */

import { prisma } from "../../lib/db";
import { Decimal } from "@prisma/client/runtime/library";

const patientNames = [
  "John Smith",
  "Sarah Johnson",
  "Michael Brown",
  "Emily Davis",
  "David Wilson",
  "Jessica Martinez",
  "Christopher Taylor",
  "Amanda Anderson",
  "Matthew Thomas",
  "Ashley Jackson",
  "Daniel White",
  "Jennifer Harris",
  "James Martin",
  "Lisa Thompson",
  "Robert Garcia",
  "Mary Rodriguez",
  "William Martinez",
  "Patricia Robinson",
  "Richard Clark",
  "Linda Lewis",
  "Joseph Lee",
  "Barbara Walker",
  "Thomas Hall",
  "Susan Allen",
  "Charles Young",
];

const services = [
  "Myers' Cocktail IV",
  "Hydration Therapy",
  "Vitamin B12 Shot",
  "Glutathione IV",
  "NAD+ IV Therapy",
  "Beauty Drip",
  "Athletic Performance IV",
  "Hangover Relief IV",
  "Immune Boost IV",
  "Energy Boost Package",
];

const paymentMethods = ["card", "cash", "insurance", "bank_transfer"];
const statuses = ["PAID", "PENDING", "FAILED", "REFUNDED"] as const;

async function main() {
  console.log("🔍 Looking for existing organization...");

  // Find first organization with payments
  const orgWithPayments = await prisma.organization.findFirst({
    where: {
      payments: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!orgWithPayments) {
    console.log(
      "❌ No organization with payments found. Please add payments manually first."
    );
    return;
  }

  console.log(
    `✅ Found organization: ${orgWithPayments.name} (${orgWithPayments.slug})`
  );
  console.log("📝 Adding 25 test payments...");

  const payments = [];

  for (let i = 0; i < 25; i++) {
    const randomPatient =
      patientNames[Math.floor(Math.random() * patientNames.length)];
    const randomService = services[Math.floor(Math.random() * services.length)];
    const randomAmount = (Math.random() * 300 + 50).toFixed(2); // $50-$350
    const randomMethod =
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Random date in last 60 days
    const daysAgo = Math.floor(Math.random() * 60);
    const paymentDate = new Date();
    paymentDate.setDate(paymentDate.getDate() - daysAgo);

    payments.push({
      organizationId: orgWithPayments.id,
      patientName: randomPatient,
      patientEmail: `${randomPatient.toLowerCase().replace(" ", ".")}@example.com`,
      patientPhone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      amount: new Decimal(randomAmount),
      status: randomStatus,
      paymentMethod: randomMethod,
      description: randomService,
      invoiceNumber: `INV-${Date.now()}-${i}`,
      paidAt: randomStatus === "PAID" ? paymentDate : null,
      createdAt: paymentDate,
    });
  }

  // Batch create
  await prisma.payment.createMany({
    data: payments,
  });

  console.log(
    `✅ Successfully added 25 test payments to ${orgWithPayments.name}`
  );
  console.log(`🔗 View at: /agency/${orgWithPayments.slug}/admin/payments`);
  console.log(`🔗 Or platform admin: /platform/admin/payments`);
}

main()
  .catch(e => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
