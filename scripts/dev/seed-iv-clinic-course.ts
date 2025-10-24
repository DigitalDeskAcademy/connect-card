/**
 * IV Clinic Quick Start Course Seeder
 *
 * Creates complete course structure with chapters and lessons
 * based on /docs/course-planning/course-content.md
 *
 * Usage:
 *   pnpm tsx scripts/dev/seed-iv-clinic-course.ts
 *
 * What it creates:
 *   - 1 Platform Course
 *   - 8 Chapters (Modules)
 *   - 20 Lessons (Videos)
 *
 * Future: This becomes the template for automated course creation
 * from user-uploaded documents.
 */

import { PrismaClient } from "../../lib/generated/prisma";
import slugify from "slugify";

const prisma = new PrismaClient();

interface Lesson {
  title: string;
  description: string;
  duration: number; // minutes
}

interface Chapter {
  title: string;
  lessons: Lesson[];
}

// Course structure from course-content.md
const courseData = {
  title: "IV Clinic Quick Start",
  smallDescription:
    "Get your IV therapy clinic taking online bookings, managing messages, and collecting payments within the first day",
  description: `Complete onboarding for IV therapy clinics using Digital Desk platform.

This course delivers immediate wins - your booking system will be live within 15 minutes. Each module focuses on one specific outcome that directly impacts your business.

Perfect for busy healthcare professionals who need results, not theory.`,
  category: "essentials",
  level: "Core",
  isPlatformCourse: true,
  isHiddenFromClients: false,

  chapters: [
    {
      title: "Module 1: Get Bookings Working",
      lessons: [
        {
          title: "Welcome & Login",
          description:
            "Quick welcome message and platform navigation. Click login button to access platform and navigate to main dashboard.",
          duration: 1,
        },
        {
          title: "Create Calendar Service",
          description:
            "Navigate to Calendars section and select Service Calendar type (not Simple). Add service name, duration, and price. Set 30-minute buffer time between appointments. Service calendars are built for IV therapy - the buffer gives you time to sanitize and prep between patients.",
          duration: 3,
        },
        {
          title: "Get Your Booking Link",
          description:
            "Copy your booking link, test it yourself to see the patient experience, and see where booked appointments appear. Share this link everywhere - website, social media, business cards.",
          duration: 2,
        },
      ],
    },
    {
      title: "Module 2: Connect Your Messages",
      lessons: [
        {
          title: "Connect Facebook",
          description:
            "Navigate to integrations, connect Facebook business page, and test by sending a message. All Facebook messages now flow into one inbox.",
          duration: 2,
        },
        {
          title: "Connect Instagram",
          description:
            "Connect Instagram business account (must be linked to Facebook page) and enable message permissions. Instagram DMs now appear alongside Facebook messages.",
          duration: 2,
        },
        {
          title: "Unified Inbox Tour",
          description:
            "Explore the conversations tab, send a test message, and see how all channels appear in one place. Never miss a patient message again - everything is here.",
          duration: 2,
        },
      ],
    },
    {
      title: "Module 3: Get Paid Before Appointments",
      lessons: [
        {
          title: "Connect Stripe Account",
          description:
            "Navigate to payment settings and connect Stripe. This enables secure payment processing. Verification happens in background over 1-3 days.",
          duration: 3,
        },
        {
          title: "Require Deposits on Appointments",
          description:
            "Enable payment collection in calendar settings and set deposit amount ($50 or 30% recommended). Requiring deposits reduces no-shows by 40%. When patients invest money upfront, they show up.",
          duration: 3,
        },
        {
          title: "Test a Booking with Payment",
          description:
            "Make a test appointment using Stripe test card (4242 4242 4242 4242) and see where completed payments appear. This is exactly what your patients will experience when booking.",
          duration: 2,
        },
        {
          title: "Send Your First Invoice",
          description:
            "Create invoice for a completed service, send it via email or SMS, and track payment status.",
          duration: 2,
        },
      ],
    },
    {
      title: "Module 4: Start Texting Today",
      lessons: [
        {
          title: "Get Toll-Free Number for Instant SMS",
          description:
            "Purchase a toll-free (800/888) number and send a test text message immediately. Toll-free numbers let you text patients right away while waiting for your local number. They're free to register and work within minutes.",
          duration: 3,
        },
        {
          title: "Submit A2P Registration for Local Number",
          description:
            "Walk through exact requirements for guaranteed approval. Important: exact business name matching, sample messages, etc. One mistake means 2+ week delays.",
          duration: 5,
        },
      ],
    },
    {
      title: "Module 5: SMS Automations",
      lessons: [
        {
          title: "Activate Missed Call Text-Back",
          description:
            "Enable the MCTB feature in phone number settings and write a response message. You're in treatments for 45 minutes and can't answer calls. This feature automatically texts anyone who calls, turning missed calls into bookings.",
          duration: 3,
        },
        {
          title: "Set Up Automated Reminders",
          description:
            "Create appointment reminder workflow (24 hours and 2 hours before) and set up review request automation (2 hours after appointment). Automated reminders cut no-shows in half. Review requests sent at the right time get 3x more responses.",
          duration: 4,
        },
      ],
    },
    {
      title: "Module 6: Mobile App Setup",
      lessons: [
        {
          title: "Download LeadConnector App",
          description:
            "Search for 'LeadConnector' in app store (NOT 'HighLevel') and walk through login process. This app lets you manage your clinic from anywhere - at home, between appointments, even on vacation.",
          duration: 2,
        },
        {
          title: "Mobile Capabilities Tour",
          description:
            "Explore what works: responding to messages, viewing calendar, seeing notifications. Learn limitations: can't create workflows, forms, or calendars on mobile. The app is perfect for day-to-day management. All setup and configuration happens on desktop.",
          duration: 3,
        },
      ],
    },
    {
      title: "Module 7: Automate Reviews",
      lessons: [
        {
          title: "Connect Google Business Profile",
          description:
            "Navigate to reputation management settings and connect Google account (must be owner/manager of GBP). Your Google reviews directly impact how many new patients find you. More reviews = higher ranking = more bookings.",
          duration: 3,
        },
        {
          title: "Create Review Automation Campaign",
          description:
            "Build automated campaign that triggers 2 hours after appointment. Positive reviews (4-5 stars) go to Google, while lower ratings come to you privately first. Most happy patients would leave reviews but forget. This system asks at the perfect moment.",
          duration: 4,
        },
      ],
    },
    {
      title: "Module 8: Pro Tips from a GHL Expert",
      lessons: [
        {
          title: "The Quick Daily Routine",
          description:
            "Essential daily tasks that keep everything running smoothly in your clinic. The 5-minute routine that prevents 90% of problems.",
          duration: 3,
        },
        {
          title: "Time-Saving Shortcuts",
          description:
            "My favorite shortcuts most users miss. Small changes that save hours every week.",
          duration: 3,
        },
        {
          title: "The One Automation That Changes Everything",
          description:
            "The single automation that has the biggest impact on clinic efficiency and patient satisfaction.",
          duration: 3,
        },
        {
          title: "Essential Backup and Safety Nets",
          description:
            "The backup systems everyone should set up but most people skip. Protect yourself from common disasters.",
          duration: 3,
        },
        {
          title: "Common Mistakes to Avoid",
          description:
            "Mistakes that cause headaches later. Learn from others' errors and save yourself the pain.",
          duration: 3,
        },
      ],
    },
  ] as Chapter[],
};

async function seedCourse() {
  console.log("\n📚 Seeding IV Clinic Quick Start Course\n");

  try {
    // Get or create platform admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: "platform_admin" },
    });

    if (!adminUser) {
      console.log("⚠️  No platform admin found. Creating one...");
      adminUser = await prisma.user.create({
        data: {
          email: "admin@sidecar.com",
          name: "Platform Admin",
          role: "platform_admin",
        },
      });
      console.log(`   ✅ Admin user created: ${adminUser.email}\n`);
    }

    // Check if course already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        slug: slugify(courseData.title, { lower: true, strict: true }),
      },
    });

    if (existingCourse) {
      console.log("⚠️  Course already exists. Deleting old version...\n");
      await prisma.course.delete({
        where: { id: existingCourse.id },
      });
    }

    // Calculate total duration in minutes, then convert to hours
    const totalMinutes = courseData.chapters.reduce(
      (sum, ch) => sum + ch.lessons.reduce((lSum, l) => lSum + l.duration, 0),
      0
    );
    const totalHours = Math.ceil(totalMinutes / 60); // Round up to nearest hour

    // Create the course
    console.log("📖 Creating course...");
    const course = await prisma.course.create({
      data: {
        title: courseData.title,
        slug: slugify(courseData.title, { lower: true, strict: true }),
        smallDescription: courseData.smallDescription,
        description: courseData.description,
        category: courseData.category,
        level: courseData.level,
        price: 0, // Free platform course
        isFree: true,
        duration: totalHours, // Duration in hours
        organizationId: null, // Platform course
        isHiddenFromClients: courseData.isHiddenFromClients,
        fileKey: "/Thumbnail-Placeholder.png", // Public folder placeholder (served via Vercel CDN)
        userId: adminUser.id,
      },
    });

    console.log(`   ✅ Course created: ${course.title} (${course.id})\n`);

    // Create chapters and lessons
    let totalLessons = 0;

    for (
      let chapterIndex = 0;
      chapterIndex < courseData.chapters.length;
      chapterIndex++
    ) {
      const chapterData = courseData.chapters[chapterIndex];

      console.log(`📁 Creating ${chapterData.title}...`);

      const chapter = await prisma.chapter.create({
        data: {
          title: chapterData.title,
          slug: slugify(chapterData.title, { lower: true, strict: true }),
          courseId: course.id,
          position: chapterIndex + 1,
        },
      });

      console.log(
        `   ✅ Chapter created (${chapter.lessons?.length || 0} lessons planned)`
      );

      // Create lessons for this chapter
      for (
        let lessonIndex = 0;
        lessonIndex < chapterData.lessons.length;
        lessonIndex++
      ) {
        const lessonData = chapterData.lessons[lessonIndex];

        const lesson = await prisma.lesson.create({
          data: {
            title: lessonData.title,
            slug: slugify(lessonData.title, { lower: true, strict: true }),
            description: lessonData.description,
            chapterId: chapter.id,
            position: lessonIndex + 1,
            // Note: videoKey and thumbnailKey will be added when videos are uploaded
            // For now, lessons exist as placeholders ready for content
          },
        });

        totalLessons++;
        console.log(
          `      📹 Lesson ${lessonIndex + 1}: ${lesson.title} (${lessonData.duration} min)`
        );
      }

      console.log("");
    }

    // Summary
    console.log("📊 Seeding Summary:");
    console.log("=====================================");
    console.log(`✅ Course: ${course.title}`);
    console.log(`✅ Chapters: ${courseData.chapters.length}`);
    console.log(`✅ Lessons: ${totalLessons}`);
    console.log(
      `✅ Total Duration: ${totalMinutes} minutes (~${totalHours} hour${totalHours > 1 ? "s" : ""})`
    );
    console.log(`✅ Category: ${courseData.category}`);
    console.log(`✅ Level: ${courseData.level}`);
    console.log("");
    console.log("🎬 Next Steps:");
    console.log("1. Record videos for each lesson");
    console.log("2. Upload videos via course edit UI");
    console.log("3. Add course thumbnail image");
    console.log("4. Publish and test with real users");
    console.log("");
  } catch (error) {
    console.error("❌ Error seeding course:", error);
    throw error;
  }
}

async function main() {
  await seedCourse();
}

main()
  .then(() => {
    console.log("✅ Seeding complete!\n");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
