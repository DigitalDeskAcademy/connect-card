import { PrismaClient } from "../lib/generated/prisma";
import { placeholderCourseThumbnail } from "../lib/constants/placeholder-assets";

const prisma = new PrismaClient();

/**
 * Test Course Seed - Simple numbered chapters and lessons for drag-and-drop testing
 */

async function seedTestCourse() {
  try {
    console.log("🌱 Starting test course seed...\n");

    // Get platform admin user
    const platformAdmin = await prisma.user.findFirst({
      where: { role: "platform_admin" },
    });

    if (!platformAdmin) {
      throw new Error(
        "Platform admin user not found. Please run seed:users first."
      );
    }

    console.log(`✅ Found platform admin: ${platformAdmin.email}\n`);

    // Create test course
    console.log(`📚 Creating test course: Drag & Drop Test Course`);

    // Delete existing test course if it exists
    await prisma.course.deleteMany({
      where: { slug: "drag-drop-test-course" },
    });

    const course = await prisma.course.create({
      data: {
        title: "Drag & Drop Test Course",
        slug: "drag-drop-test-course",
        smallDescription:
          "Test course with numbered chapters and lessons for drag-and-drop testing",
        description:
          "<p>This course is for testing drag-and-drop functionality with clearly numbered chapters and lessons.</p>",
        price: 0,
        isFree: true,
        duration: 1,
        level: "Beginner",
        category: "Testing",
        status: "Published",
        userId: platformAdmin.id,
        isPlatformCourse: true,
        organizationId: null,
        fileKey: placeholderCourseThumbnail,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Course created: ${course.id}`);

    // Create 6 chapters with 3 lessons each
    const chaptersData = [
      {
        slug: "chapter-1",
        title: "Chapter 1",
        position: 1,
        lessons: [
          { slug: "lesson-1-1", title: "Lesson 1.1" },
          { slug: "lesson-1-2", title: "Lesson 1.2" },
          { slug: "lesson-1-3", title: "Lesson 1.3" },
        ],
      },
      {
        slug: "chapter-2",
        title: "Chapter 2",
        position: 2,
        lessons: [
          { slug: "lesson-2-1", title: "Lesson 2.1" },
          { slug: "lesson-2-2", title: "Lesson 2.2" },
          { slug: "lesson-2-3", title: "Lesson 2.3" },
        ],
      },
      {
        slug: "chapter-3",
        title: "Chapter 3",
        position: 3,
        lessons: [
          { slug: "lesson-3-1", title: "Lesson 3.1" },
          { slug: "lesson-3-2", title: "Lesson 3.2" },
          { slug: "lesson-3-3", title: "Lesson 3.3" },
        ],
      },
      {
        slug: "chapter-4",
        title: "Chapter 4",
        position: 4,
        lessons: [
          { slug: "lesson-4-1", title: "Lesson 4.1" },
          { slug: "lesson-4-2", title: "Lesson 4.2" },
          { slug: "lesson-4-3", title: "Lesson 4.3" },
        ],
      },
      {
        slug: "chapter-5",
        title: "Chapter 5",
        position: 5,
        lessons: [
          { slug: "lesson-5-1", title: "Lesson 5.1" },
          { slug: "lesson-5-2", title: "Lesson 5.2" },
          { slug: "lesson-5-3", title: "Lesson 5.3" },
        ],
      },
      {
        slug: "chapter-6",
        title: "Chapter 6",
        position: 6,
        lessons: [
          { slug: "lesson-6-1", title: "Lesson 6.1" },
          { slug: "lesson-6-2", title: "Lesson 6.2" },
          { slug: "lesson-6-3", title: "Lesson 6.3" },
        ],
      },
    ];

    for (const chapterData of chaptersData) {
      const { lessons, ...chapterInfo } = chapterData;

      const chapter = await prisma.chapter.create({
        data: {
          ...chapterInfo,
          courseId: course.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`   📖 Chapter created: ${chapter.title}`);

      // Create lessons for this chapter
      for (let i = 0; i < lessons.length; i++) {
        await prisma.lesson.create({
          data: {
            slug: lessons[i].slug,
            title: lessons[i].title,
            description: `Test lesson ${lessons[i].title}`,
            position: i + 1,
            chapterId: chapter.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(`      ✓ Lesson created: ${lessons[i].title}`);
      }
    }

    const totalLessons = chaptersData.reduce(
      (sum, ch) => sum + ch.lessons.length,
      0
    );
    console.log(
      `   📊 Total: ${chaptersData.length} chapters, ${totalLessons} lessons\n`
    );

    console.log("🎉 Test course seeded successfully!\n");
    console.log("📊 Summary:");
    console.log(`   📚 Course: Drag & Drop Test Course`);
    console.log(`   📖 Chapters: ${chaptersData.length}`);
    console.log(`   📝 Lessons: ${totalLessons}`);
    console.log(
      `\n🔗 Navigate to /platform/admin/courses/${course.id}/edit?tab=structure to test drag-and-drop`
    );
  } catch (error) {
    console.error("❌ Error seeding test course:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTestCourse();
