import {
  PrismaClient,
  CourseLevel,
  CourseStatus,
} from "../lib/generated/prisma";

const prisma = new PrismaClient();

/**
 * Platform Course Seed Script for Sidecar Platform
 *
 * Creates the IV Clinic Quick Start course - a platform-wide course available
 * to all agencies for onboarding their IV therapy clinic clients.
 *
 * This is a FREE platform course with no Stripe integration needed.
 */

// Generate rich text description in Tiptap JSON format
function generatePlatformCourseDescription(): string {
  const description = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          { type: "text", text: "Get Your First Booking in 15 Minutes" },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Stop wasting time on complex setups. This quick-start course gets your IV therapy clinic taking online bookings TODAY. Each module delivers a specific win that directly impacts your business - no fluff, just action.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "The One Big Promise" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "You'll take your first online booking within 15 minutes of starting this course. That's not a typo - 15 minutes to your first real patient booking.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "What You'll Accomplish" }],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Take online bookings within 15 minutes",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Connect all your messaging channels in one place",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Set up payment processing to reduce no-shows",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Enable compliant SMS messaging for your clinic",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Run your clinic from your phone" },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Automate review collection for 5-star ratings",
                  },
                ],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Track what's working with real metrics",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "How This Works" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Each module takes 10-15 minutes and delivers ONE specific win. No theory, no fluff - just click this, type that, get results. Built specifically for busy IV therapy clinic owners who need their platform working NOW.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "Prerequisites" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Just your Digital Desk Growth Plan login. That's it. We'll handle everything else step by step.",
          },
        ],
      },
    ],
  };

  return JSON.stringify(description);
}

// Course modules and lessons structure
const courseModules = [
  {
    title: "Get Your First Booking TODAY",
    lessons: [
      {
        title: "Welcome - You'll take bookings in 15 minutes",
        description: "Set expectations and show the end result you'll achieve",
      },
      {
        title: "Login and go straight to calendar",
        description:
          "Navigate directly to calendar settings, skip everything else",
      },
      {
        title: "Create one service: IV Therapy - $150",
        description: "Add single service, set price, configure duration",
      },
      {
        title: "Get your booking link and test it",
        description: "Find the link, copy it, test in new browser",
      },
      {
        title: "Share it and get a real booking",
        description: "Text to yourself, post on social, email to past client",
      },
    ],
  },
  {
    title: "Never Miss Another Call",
    lessons: [
      {
        title: "Connect Facebook Messenger",
        description: "Authorize connection and select your business page",
      },
      {
        title: "Connect Instagram DMs",
        description: "Login to business account and authorize access",
      },
      {
        title: "Tour your unified inbox",
        description: "View all messages in one place",
      },
      {
        title: "Send your first message",
        description: "Select contact, type message, hit send",
      },
    ],
  },
  {
    title: "Get Paid Before Appointments",
    lessons: [
      {
        title: "Connect Stripe",
        description: "Connect or create Stripe account for payments",
      },
      {
        title: "Add deposit to bookings",
        description: "Enable deposit requirement to reduce no-shows",
      },
      {
        title: "Test a payment",
        description: "Book test appointment with Stripe test card",
      },
      {
        title: "Send your first invoice",
        description: "Create and send professional invoice",
      },
    ],
  },
  {
    title: "Unlock SMS Powers",
    lessons: [
      {
        title: "Understanding A2P in 2 minutes",
        description: "Why businesses need approval for SMS",
      },
      {
        title: "Submit your registration",
        description: "Enter business info and submit application",
      },
      {
        title: "What happens during approval",
        description: "Timeline expectations and next steps",
      },
    ],
  },
  {
    title: "Activate SMS Automations",
    lessons: [
      {
        title: "Confirm SMS is active",
        description: "Check approval status and messaging limits",
      },
      {
        title: "Set up missed call text-back",
        description: "Enable auto text responses for missed calls",
      },
      {
        title: "Enable appointment reminders",
        description: "Turn on SMS reminders to reduce no-shows",
      },
      {
        title: "Activate review request texts",
        description: "Set up post-appointment review requests",
      },
    ],
  },
  {
    title: "Mobile Command Center",
    lessons: [
      {
        title: "Download the app",
        description: "Get LeadConnector from App Store or Google Play",
      },
      {
        title: "Manage conversations mobile",
        description: "Reply to patients from anywhere",
      },
      {
        title: "View calendar on-the-go",
        description: "Check schedule and handle changes remotely",
      },
      {
        title: "Add contacts from anywhere",
        description: "Quick contact creation on mobile",
      },
    ],
  },
  {
    title: "Automate 5-Star Reviews",
    lessons: [
      {
        title: "Connect Google Business Profile",
        description: "Link your Google account for reviews",
      },
      {
        title: "Set up review automation",
        description: "Create campaign with proper timing",
      },
      {
        title: "Customize your templates",
        description: "Personalize review request messages",
      },
    ],
  },
  {
    title: "Track Everything",
    lessons: [
      {
        title: "Tour your dashboard",
        description: "Understand key metrics and trends",
      },
      {
        title: "Key numbers that matter",
        description: "Focus on bookings, response time, reviews",
      },
      {
        title: "Your 30-day action plan",
        description: "Weekly goals for maximum impact",
      },
    ],
  },
];

async function seedPlatformCourses() {
  console.log("\n🚀 Starting Platform Course Seeding...");
  console.log("📚 Creating IV Clinic Quick Start course\n");

  try {
    // Check if platform course already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        slug: "iv-clinic-quick-start",
      },
    });

    if (existingCourse) {
      console.log("⚠️  Platform course already exists. Skipping creation.");
      return;
    }

    // Get platform admin user (or create a system user)
    let platformUser = await prisma.user.findFirst({
      where: {
        role: "platform_admin",
      },
    });

    if (!platformUser) {
      // Create a system user for platform courses
      console.log("📤 Creating system user for platform courses...");
      platformUser = await prisma.user.create({
        data: {
          id: "system-platform-courses",
          email: "platform@sidecarplatform.com",
          name: "Sidecar Platform",
          role: "platform_admin",
          emailVerified: true,
        },
      });
    }

    // Create the platform course
    const course = await prisma.course.create({
      data: {
        title: "IV Clinic Quick Start",
        description: generatePlatformCourseDescription(),
        smallDescription:
          "Get your IV therapy clinic taking online bookings in 15 minutes",
        fileKey: "courses/platform/iv-clinic-thumbnail.jpg", // Placeholder
        price: 0,
        isFree: true,
        isPlatformCourse: true, // Platform course flag
        isHiddenFromClients: false, // Visible to all clients
        organizationId: null, // No organization ownership
        duration: 84, // 1.4 hours total
        level: CourseLevel.Beginner,
        category: "Healthcare Practice Management",
        slug: "iv-clinic-quick-start",
        stripePriceId: null, // No Stripe needed for free course
        status: CourseStatus.Published,
        userId: platformUser.id,
        chapter: {
          create: courseModules.map((module, moduleIndex) => ({
            title: module.title,
            position: moduleIndex + 1,
            lessons: {
              create: module.lessons.map((lesson, lessonIndex) => ({
                title: lesson.title,
                description: lesson.description,
                position: lessonIndex + 1,
                thumbnailKey: "placeholder-lesson-thumbnail.png",
                videoKey: "placeholder-lesson-video.mp4",
              })),
            },
          })),
        },
      },
      include: {
        chapter: {
          include: {
            lessons: true,
          },
        },
      },
    });

    // Log success details
    console.log("✅ Platform course created successfully!");
    console.log(`📊 Course: ${course.title}`);
    console.log(`🏷️  Slug: ${course.slug}`);
    console.log(`⭐ Platform Course: ${course.isPlatformCourse}`);
    console.log(`👁️  Hidden from Clients: ${course.isHiddenFromClients}`);
    console.log(`🏢 Organization: ${course.organizationId || "Platform-wide"}`);
    console.log(`💰 Price: FREE`);
    console.log(`📚 Modules: ${course.chapter.length}`);

    const totalLessons = course.chapter.reduce(
      (sum, ch) => sum + ch.lessons.length,
      0
    );
    console.log(`📝 Total Lessons: ${totalLessons}`);

    // Log module breakdown
    console.log("\n📋 Module Breakdown:");
    course.chapter.forEach((chapter, index) => {
      console.log(
        `   Module ${index + 1}: ${chapter.title} (${chapter.lessons.length} lessons)`
      );
    });

    console.log("\n🎉 Platform course seeding completed successfully!");
    console.log("🚀 Ready for agencies to use with their IV therapy clients!");
  } catch (error) {
    console.error("❌ Error seeding platform course:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedPlatformCourses().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
