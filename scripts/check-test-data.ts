/**
 * Check test data for SMS invite flow
 * Run with: npx tsx scripts/check-test-data.ts
 */

import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function check() {
  console.log("\n=== SMS INVITE FLOW - TEST DATA CHECK ===\n");

  // 1. Check organization
  const org = await prisma.organization.findFirst({
    where: { slug: "newlife" },
  });
  console.log(
    "1. Organization:",
    org ? `✅ ${org.name} (${org.id})` : "❌ Missing - run pnpm seed:all"
  );

  if (!org) {
    console.log(
      "\n⚠️  Cannot continue without organization. Run: pnpm seed:all\n"
    );
    await prisma.$disconnect();
    return;
  }

  // 2. Check volunteers with phone numbers
  const volunteersWithPhone = await prisma.volunteer.findMany({
    where: {
      organizationId: org.id,
      status: "ACTIVE",
      churchMember: { phone: { not: null } },
    },
    include: {
      churchMember: {
        select: { id: true, name: true, phone: true, email: true },
      },
    },
    take: 5,
  });

  console.log(
    "2. Active Volunteers with Phone:",
    volunteersWithPhone.length > 0
      ? `✅ ${volunteersWithPhone.length} found`
      : "❌ None - need to add phone numbers"
  );
  volunteersWithPhone.forEach(v =>
    console.log(
      `   - ${v.churchMember?.name} | ${v.churchMember?.phone} | ${v.churchMember?.email}`
    )
  );

  // 3. Check events
  const events = await prisma.volunteerEvent.findMany({
    where: { organizationId: org.id },
    include: { sessions: true },
    take: 5,
  });

  console.log(
    "3. Volunteer Events:",
    events.length > 0
      ? `✅ ${events.length} found`
      : "❌ None - need to create an event"
  );
  events.forEach(e =>
    console.log(
      `   - ${e.name} | Sessions: ${e.sessions.length} | Total Slots: ${e.sessions.reduce((acc, s) => acc + s.slotsNeeded, 0)}`
    )
  );

  // 4. Check sessions with available slots
  const sessionsWithSlots = await prisma.eventSession.findMany({
    where: {
      event: { organizationId: org.id },
      slotsNeeded: { gt: 0 },
    },
    include: { event: { select: { name: true } } },
    take: 5,
  });

  console.log(
    "4. Sessions needing volunteers:",
    sessionsWithSlots.length > 0
      ? `✅ ${sessionsWithSlots.length} found`
      : "❌ None - events have no open slots"
  );

  // 5. Check GHL integration records
  const memberIntegrations = await prisma.memberIntegration.count({
    where: { provider: "ghl" },
  });
  console.log(
    "5. GHL MemberIntegrations:",
    memberIntegrations > 0
      ? `✅ ${memberIntegrations} contacts synced`
      : "ℹ️  None yet (created when invite sent)"
  );

  // Summary
  console.log("\n=== SUMMARY ===\n");

  const ready =
    org &&
    volunteersWithPhone.length > 0 &&
    events.length > 0 &&
    sessionsWithSlots.length > 0;

  if (ready) {
    console.log("✅ Database is ready for SMS invite testing!\n");
    console.log("Next steps:");
    console.log(
      "1. Open: http://localhost:3003/church/newlife/admin/volunteer/events"
    );
    console.log("2. Click on an event");
    console.log('3. Click "Assign" on a session');
    console.log('4. Toggle "Send SMS Invite" ON');
    console.log("5. Select a volunteer and click Send Invite\n");
  } else {
    console.log(
      "❌ Missing test data. See above for what needs to be created.\n"
    );

    if (volunteersWithPhone.length === 0) {
      console.log("To add a phone number to an existing volunteer:");
      console.log("  npx prisma studio  (then edit ChurchMember)\n");
    }

    if (events.length === 0 || sessionsWithSlots.length === 0) {
      console.log("To create a test event:");
      console.log("  Use the Events UI or run a seed script\n");
    }
  }

  await prisma.$disconnect();
}

check().catch(console.error);
