import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function cleanAllCourses() {
  console.log("🗑️  Starting to delete all courses...");

  try {
    // Delete all courses (cascade will handle chapters, lessons, enrollments, and progress)
    const deletedCourses = await prisma.course.deleteMany({});

    console.log(`✅ Deleted ${deletedCourses.count} courses successfully`);
    console.log(
      "✅ Associated chapters, lessons, enrollments, and progress were cascade deleted"
    );
  } catch (error) {
    console.error("❌ Error deleting courses:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllCourses()
  .then(() => {
    console.log("✅ Course cleanup complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Course cleanup failed:", error);
    process.exit(1);
  });
