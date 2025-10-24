/**
 * Inspect Course Structure
 *
 * Shows complete course structure with chapters and lessons
 */

import { PrismaClient } from "../../lib/generated/prisma";

const prisma = new PrismaClient();

async function inspectCourse() {
  console.log("\n📚 IV Clinic Quick Start - Course Structure\n");

  const course = await prisma.course.findFirst({
    where: {
      slug: "iv-clinic-quick-start",
    },
    include: {
      chapter: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    console.log("❌ Course not found\n");
    return;
  }

  console.log("📖 Course Details:");
  console.log("=====================================");
  console.log(`Title: ${course.title}`);
  console.log(`Slug: ${course.slug}`);
  console.log(`Category: ${course.category}`);
  console.log(`Level: ${course.level}`);
  console.log(
    `Duration: ${course.duration} hour${course.duration > 1 ? "s" : ""}`
  );
  console.log(
    `Price: $${course.price / 100} (${course.isFree ? "FREE" : "PAID"})`
  );
  console.log(`Thumbnail: ${course.fileKey}`);
  console.log(`Organization: ${course.organizationId || "Platform Course"}`);
  console.log(`Hidden from Clients: ${course.isHiddenFromClients}`);
  console.log(`Total Chapters: ${course.chapter.length}`);
  console.log(
    `Total Lessons: ${course.chapter.reduce((sum, ch) => sum + ch.lessons.length, 0)}`
  );
  console.log("");

  console.log("📁 Chapter & Lesson Structure:");
  console.log("=====================================\n");

  for (const chapter of course.chapter) {
    console.log(`Chapter ${chapter.position}: ${chapter.title}`);
    console.log(`  Slug: ${chapter.slug}`);
    console.log(`  Lessons: ${chapter.lessons.length}`);
    console.log("");

    for (const lesson of chapter.lessons) {
      console.log(
        `    Lesson ${chapter.position}.${lesson.position}: ${lesson.title}`
      );
      console.log(`      Slug: ${lesson.slug}`);
      console.log(`      Video: ${lesson.videoKey || "❌ Not uploaded"}`);
      console.log(
        `      Thumbnail: ${lesson.thumbnailKey || "❌ Not uploaded"}`
      );
      console.log(
        `      Description: ${lesson.description?.substring(0, 80)}...`
      );
      console.log("");
    }
  }

  console.log("✅ Inspection complete\n");
}

async function main() {
  await inspectCourse();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
