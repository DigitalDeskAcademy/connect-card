import { PrismaClient } from "../lib/generated/prisma";
import { placeholderCourseThumbnail } from "../lib/constants/placeholder-assets";

const prisma = new PrismaClient();

/**
 * Platform Courses Seed - Subscription Model
 *
 * All courses are FREE and included in the $297/month agency subscription.
 * No per-course pricing (isFree: true, price: 0, stripePriceId: null)
 */

async function seedPlatformCourses() {
  try {
    console.log("🌱 Starting platform courses seed...\n");

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

    // IV Therapy Quick Start - Main onboarding course
    console.log(`📚 Creating course: IV Therapy Quick Start`);

    const course = await prisma.course.upsert({
      where: { id: "iv-clinic-quickstart" },
      update: {
        title: "IV Therapy Quick Start",
        slug: "iv-clinic-quickstart",
        smallDescription:
          "Complete GoHighLevel setup guide for IV therapy clinics - from zero to fully operational in hours, not weeks",
        description:
          "<p>Transform your IV therapy clinic operations with our comprehensive GoHighLevel implementation course. Learn to set up automated booking, patient communication, payment processing, and review collection - reducing your onboarding support from 10+ hours to under 3 hours per client.</p>",
        price: 0,
        isFree: true,
        duration: 6,
        level: "Beginner",
        category: "Healthcare Practice Management",
        status: "Published",
        userId: platformAdmin.id,
        isPlatformCourse: true,
        organizationId: null,
        fileKey: placeholderCourseThumbnail,
      },
      create: {
        id: "iv-clinic-quickstart",
        title: "IV Therapy Quick Start",
        slug: "iv-clinic-quickstart",
        smallDescription:
          "Complete GoHighLevel setup guide for IV therapy clinics - from zero to fully operational in hours, not weeks",
        description:
          "<p>Transform your IV therapy clinic operations with our comprehensive GoHighLevel implementation course. Learn to set up automated booking, patient communication, payment processing, and review collection - reducing your onboarding support from 10+ hours to under 3 hours per client.</p>",
        price: 0,
        isFree: true,
        duration: 6,
        level: "Beginner",
        category: "Healthcare Practice Management",
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

    // Create chapters for IV Therapy Quick Start
    const chaptersData = [
      {
        slug: "getting-started",
        title: "Getting Started with Your CRM",
        position: 1,
        lessons: [
          {
            slug: "welcome-overview",
            title: "Welcome & Overview",
            description:
              "Introduction to your CRM and what you'll accomplish in this course",
          },
          {
            slug: "initial-login",
            title: "Initial Login & Navigation",
            description:
              "Learn how to access your CRM and navigate the main interface",
          },
          {
            slug: "basic-configuration",
            title: "Basic Configuration",
            description: "Set up essential settings to get your CRM ready",
          },
        ],
      },
      {
        slug: "patient-setup",
        title: "Setting Up Patient Management",
        position: 2,
        lessons: [
          {
            slug: "first-patient",
            title: "Adding Your First Patient",
            description: "Step-by-step guide to creating patient records",
          },
          {
            slug: "communication-settings",
            title: "Patient Communication Settings",
            description:
              "Configure automated messages and communication preferences",
          },
        ],
      },
      {
        slug: "service-catalog",
        title: "Creating Your Service Catalog",
        position: 3,
        lessons: [
          {
            slug: "iv-therapy-setup",
            title: "IV Therapy Service Setup",
            description: "Add and configure your IV therapy services",
          },
          {
            slug: "pricing-packages",
            title: "Pricing & Packages",
            description:
              "Set up pricing tiers and service packages for clients",
          },
        ],
      },
      {
        slug: "booking-system",
        title: "Configuring Online Booking",
        position: 4,
        lessons: [
          {
            slug: "booking-customization",
            title: "Booking Page Customization",
            description:
              "Customize your online booking page for optimal client experience",
          },
          {
            slug: "advanced-settings",
            title: "Advanced Settings",
            description:
              "Fine-tune booking rules, notifications, and integrations",
          },
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

      console.log(`   📖 Chapter created: ${chapter.title} (${chapter.slug})`);

      // Create lessons for this chapter
      for (let i = 0; i < lessons.length; i++) {
        await prisma.lesson.create({
          data: {
            slug: lessons[i].slug,
            title: lessons[i].title,
            description: lessons[i].description,
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

    console.log("🎉 Platform courses seeded successfully!\n");
    console.log("📊 Summary:");
    console.log(`   📚 Total courses: 1`);
    console.log(`   📖 Total chapters: ${chaptersData.length}`);
    console.log(`   📝 Total lessons: ${totalLessons}`);
    console.log(
      `\n💰 Pricing Model: FREE (included in $297/month subscription)`
    );
  } catch (error) {
    console.error("❌ Error seeding platform courses:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedPlatformCourses();
