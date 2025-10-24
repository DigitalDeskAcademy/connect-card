// Quick debug script to check enrollment status
const { PrismaClient } = require("./lib/generated/prisma");

const prisma = new PrismaClient();

async function checkEnrollments() {
  console.log("=== All Enrollments ===");
  const enrollments = await prisma.enrollment.findMany({
    include: {
      User: { select: { email: true } },
      Course: { select: { title: true, slug: true } },
    },
  });

  console.log(
    enrollments.map(e => ({
      user: e.User.email,
      course: e.Course.title,
      status: e.status,
      amount: e.amount,
      createdAt: e.createdAt,
    }))
  );

  console.log("\n=== Active Enrollments ===");
  const active = await prisma.enrollment.findMany({
    where: { status: "Active" },
    include: {
      User: { select: { email: true } },
      Course: { select: { title: true } },
    },
  });

  console.log(
    active.map(e => ({
      user: e.User.email,
      course: e.Course.title,
      status: e.status,
    }))
  );

  await prisma.$disconnect();
}

checkEnrollments().catch(console.error);
