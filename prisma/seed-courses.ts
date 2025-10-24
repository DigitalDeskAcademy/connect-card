import {
  PrismaClient,
  CourseLevel,
  CourseStatus,
} from "../lib/generated/prisma";
import { stripe } from "../lib/stripe.js";
import slugify from "slugify";

const prisma = new PrismaClient();

/**
 * Course Seed Script for Sidecar Platform Testing
 *
 * Creates sample B2B onboarding workflows with proper Stripe integration.
 *
 * S3 File Organization:
 * - Seed data uses global placeholder files for initial setup
 * - When admins upload actual files via the UI, they follow the structure:
 *   courses/{courseId}/thumbnail.{ext} - Course thumbnails
 *   courses/{courseId}/banner.{ext} - Course banners
 *   courses/{courseId}/lesson-{lessonId}/thumbnail.{ext} - Lesson thumbnails
 *   courses/{courseId}/lesson-{lessonId}/video.{ext} - Lesson videos
 * - The upload API automatically organizes files into proper course folders
 */

/**
 * Clean up existing test Stripe products before creating new ones
 * This prevents accumulation of test products in Stripe Dashboard
 */
async function cleanupStripeTestProducts() {
  console.log("🧹 Cleaning up existing test Stripe products...");

  try {
    // Get all products with our test metadata
    const products = await stripe.products.list({
      limit: 100, // Adjust if you expect more test products
    });

    const testProducts = products.data.filter(
      product =>
        product.metadata?.isTestData === "true" ||
        product.metadata?.source === "seed"
    );

    if (testProducts.length === 0) {
      console.log("✅ No test products found to clean up");
      return;
    }

    console.log(`🗑️  Deleting ${testProducts.length} test products...`);

    // Delete each test product
    for (const product of testProducts) {
      await stripe.products.del(product.id);
      console.log(`   Deleted: ${product.name}`);
    }

    console.log("✅ Stripe cleanup completed");
  } catch (error) {
    console.warn(
      "⚠️  Stripe cleanup failed (continuing anyway):",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Template for generating course content based on concept
interface CourseTemplate {
  concept: string;
  title: string;
  category: string;
  level: CourseLevel;
  price: number;
  duration: number;
  targetAudience?: string;
  skills?: string[];
  chapters?: {
    title: string;
    lessons: { title: string; description?: string }[];
  }[];
}

// Generate rich text description in Tiptap JSON format
function generateRichTextDescription(template: CourseTemplate): string {
  // Special handling for implementation courses
  if (template.category === "Business Software Implementation") {
    const description = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Transform Your Clinic Operations" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Welcome to the Digital Desk Onboarding Experience! This comprehensive ${template.duration}-hour guided implementation will transform your IV therapy clinic operations from start to finish. You'll work directly in your Digital Desk platform to set up all the tools your clinic needs to streamline operations, enhance patient experience, and accelerate growth.`,
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
          content:
            template.skills?.map(skill => ({
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: skill }],
                },
              ],
            })) || [],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Course Structure" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "This isn't a typical course—it's a guided implementation journey. Each module builds on the previous one, taking you through actual business setup tasks that will have immediate impact on your clinic operations. You'll be working in your real Digital Desk platform, configuring actual business processes that your patients will use.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Who This Is For" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text:
                template.targetAudience ||
                "IV therapy clinic owners and managers",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Prerequisites" }],
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
                      text: "Active Digital Desk Growth Plan subscription",
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
                      text: "Access to business information: Legal Business Name, Address, Website URL, EIN",
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
                      text: "Administrative access to Facebook Business Page and Instagram account",
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
                      text: "Stripe account login credentials for payment processing",
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
          content: [{ type: "text", text: "Implementation Timeline" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Plan to complete this implementation over 2-3 business days. Some steps (like A2P 10DLC approval) require external processing time. We'll guide you through everything, including what to expect during waiting periods.",
            },
          ],
        },
      ],
    };
    return JSON.stringify(description);
  }

  // Default handling for educational courses
  const description = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Course Overview" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `Master ${template.concept} with this comprehensive ${template.duration}-hour course designed for ${template.level.toLowerCase()} level students.`,
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "What You'll Learn" }],
      },
      {
        type: "bulletList",
        content: (
          template.skills || [
            `Core fundamentals of ${template.concept}`,
            `Best practices and industry standards`,
            `Real-world practical applications`,
            `Advanced techniques and optimization`,
            `Project-based learning approach`,
          ]
        ).map(skill => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: skill }],
            },
          ],
        })),
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "Who This Course Is For" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              template.targetAudience ||
              `This course is perfect for anyone interested in ${template.concept}, from beginners to professionals looking to enhance their skills.`,
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
            text:
              template.level === CourseLevel.Beginner
                ? "No prior experience required. Just bring your enthusiasm to learn!"
                : template.level === CourseLevel.Intermediate
                  ? `Basic understanding of ${template.category} concepts recommended.`
                  : `Solid foundation in ${template.category} and related technologies required.`,
          },
        ],
      },
    ],
  };

  return JSON.stringify(description);
}

// Generate chapters and lessons based on concept
function generateChapters(template: CourseTemplate) {
  if (template.chapters) {
    return template.chapters;
  }

  // Default chapter structure
  return [
    {
      title: `Introduction to ${template.concept}`,
      lessons: [
        {
          title: "Course Overview",
          description: "What you'll learn in this course",
        },
        {
          title: "Setting Up Your Environment",
          description: "Getting your workspace ready",
        },
        {
          title: "Basic Concepts",
          description: `Understanding the fundamentals of ${template.concept}`,
        },
      ],
    },
    {
      title: "Core Fundamentals",
      lessons: [
        {
          title: "Key Principles",
          description: "Essential principles you need to know",
        },
        {
          title: "Common Patterns",
          description: "Patterns you'll use frequently",
        },
        {
          title: "Best Practices",
          description: "Industry standards and conventions",
        },
        {
          title: "Hands-on Exercise",
          description: "Practice what you've learned",
        },
      ],
    },
    {
      title: "Intermediate Concepts",
      lessons: [
        {
          title: "Advanced Features",
          description: "Exploring more complex features",
        },
        {
          title: "Performance Optimization",
          description: "Making your work more efficient",
        },
        {
          title: "Debugging Techniques",
          description: "How to troubleshoot common issues",
        },
        {
          title: "Real-world Examples",
          description: "Practical application examples",
        },
      ],
    },
    {
      title: "Practical Projects",
      lessons: [
        { title: "Project Setup", description: "Starting your first project" },
        {
          title: "Building Core Features",
          description: "Implementing main functionality",
        },
        { title: "Testing and Refinement", description: "Ensuring quality" },
        {
          title: "Deployment",
          description: "Sharing your work with the world",
        },
      ],
    },
    {
      title: "Advanced Topics",
      lessons: [
        {
          title: "Scaling Strategies",
          description: "Growing your application",
        },
        {
          title: "Security Considerations",
          description: "Keeping your work secure",
        },
        {
          title: "Integration with Other Tools",
          description: "Working with external services",
        },
      ],
    },
    {
      title: "Course Conclusion",
      lessons: [
        { title: "Course Recap", description: "Review of what we've learned" },
        { title: "Next Steps", description: "Where to go from here" },
        {
          title: "Additional Resources",
          description: "Further learning materials",
        },
      ],
    },
  ];
}

// Production B2B Software Onboarding Workflows for Sidecar Platform
const courseTemplates: CourseTemplate[] = [
  {
    concept: "Digital Desk Media Platform Implementation",
    title: "Digital Desk Media - Client Onboarding",
    category: "Healthcare Practice Management",
    level: CourseLevel.Beginner,
    price: 0, // Included with Growth Plan subscription
    duration: 6,
    targetAudience:
      "IV Therapy Clinic Owners and Clinic Managers implementing Digital Desk Media for patient acquisition and clinic operations management",
    skills: [
      "Complete Digital Desk platform account setup and clinic profile configuration",
      "Navigate A2P 10DLC registration process for compliant business SMS messaging",
      "Activate unified communication channels: SMS, Facebook, Instagram messaging",
      "Launch professional 24/7 patient self-booking system with automated reminders",
      "Integrate Stripe payment processing for deposits and invoicing",
      "Master mobile app for on-the-go clinic management and patient communications",
      "Implement automated 5-star review collection system",
      "Use clinic growth dashboard for performance tracking and business insights",
    ],
    chapters: [
      {
        title: "Your Digital Foundation",
        lessons: [
          {
            title: "Watch Your Welcome Video",
            description:
              "Introduction to Digital Desk Media and implementation roadmap",
          },
          {
            title: "Log In To Your Digital Desk Platform",
            description: "Access your accounts and navigate the main dashboard",
          },
          {
            title: "Set Up Your Clinic Profile & Business Details",
            description: "Complete clinic information and SMS policy agreement",
          },
          {
            title: "Open Your Calendar for Online Bookings",
            description:
              "Configure general availability for patient scheduling",
          },
        ],
      },
      {
        title: "Enable Compliant SMS Messaging for Your Clinic",
        lessons: [
          {
            title: "Watch: Understanding Your Business SMS Setup (A2P 10DLC)",
            description:
              "Learn compliance requirements and business benefits of proper SMS setup",
          },
          {
            title: "Confirm Your Details for SMS Approval",
            description:
              "Submit accurate business information for carrier approval process",
          },
          {
            title: "Approve Your Clinic's SMS Registration",
            description:
              "Complete the registration submission and verification steps",
          },
          {
            title: "(Status Update) Awaiting Carrier Approval for SMS",
            description:
              "Understanding approval timeline and next steps while waiting",
          },
        ],
      },
      {
        title: "Activate Communication Tools",
        lessons: [
          {
            title: "Confirm Your Business SMS is Live & Ready",
            description:
              "Verify SMS capabilities are active and test functionality",
          },
          {
            title: "Launch Instant Missed Call Engagement (Auto Text-Back)",
            description: "Set up automated text responses for missed calls",
          },
          {
            title: "Connect Your Social Chat: Facebook & Instagram",
            description: "Integrate social media messaging into unified inbox",
          },
          {
            title: "Explore Your Unified Conversations Hub",
            description: "Master centralized patient communication management",
          },
        ],
      },
      {
        title: "Enable 24/7 Patient Self-Booking",
        lessons: [
          {
            title: "Fine-Tune Your Services & Schedule in Digital Desk",
            description:
              "Configure detailed service offerings and availability windows",
          },
          {
            title: "Brand Your Booking Page for a Professional Look",
            description:
              "Customize booking experience with clinic branding and messaging",
          },
          {
            title: "Slash No-Shows with Automated Reminders",
            description:
              "Set up confirmation and reminder sequences to reduce no-shows",
          },
          {
            title: "Get Your Shareable Online Booking Link",
            description:
              "Generate and test your unique booking URL for patients",
          },
          {
            title: "(Bonus) Put Your Calendar on Your Website",
            description:
              "Embed booking widget directly into your clinic website",
          },
          {
            title: "(Bonus) Learn to Promote Your Booking Link",
            description:
              "Best practices for marketing your new online booking system",
          },
        ],
      },
      {
        title: "Secure Your Revenue & Get Paid Faster",
        lessons: [
          {
            title: "Connect Stripe to Enable Secure Payments",
            description:
              "Link payment processing for online transactions and deposits",
          },
          {
            title: "Require Deposits on Bookings to Reduce No-Shows",
            description:
              "Configure deposit requirements and payment collection at booking",
          },
          {
            title: "Create & Send Your First Patient Invoice",
            description:
              "Generate and send professional invoices through the platform",
          },
        ],
      },
      {
        title: "Go Mobile: Your Clinic in Your Pocket",
        lessons: [
          {
            title: "Manage Conversations from Your Phone",
            description:
              "Handle patient communications on-the-go with mobile app",
          },
          {
            title: "View and Manage Your Schedule On-the-Go",
            description:
              "Access and modify appointments from anywhere using mobile",
          },
          {
            title: "Add a New Patient Contact Remotely",
            description:
              "Create new patient records and contacts while away from office",
          },
        ],
      },
      {
        title: "Automate Your 5-Star Patient Reviews",
        lessons: [
          {
            title: "Connect Your Google & Facebook Review Pages",
            description:
              "Link review platforms to enable automated review requests",
          },
          {
            title: "Customize & Activate Your Automated Review Requests",
            description:
              "Set up personalized review collection workflows post-appointment",
          },
        ],
      },
      {
        title: "Measure Your Success & Launch with Confidence",
        lessons: [
          {
            title: "Tour Your Clinic Growth Dashboard",
            description:
              "Navigate analytics and understand key performance metrics",
          },
          {
            title: "Final Q&A and Best Practices Session",
            description:
              "Address common questions and share optimization strategies",
          },
          {
            title: "Create Your 'Go-Live' Action Plan",
            description:
              "Plan your full platform launch and patient communication strategy",
          },
        ],
      },
    ],
  },
  {
    concept: "Restaurant POS System Implementation",
    title: "RestaurantOS - Complete Setup & Staff Training",
    category: "Restaurant Management Software",
    level: CourseLevel.Beginner,
    price: 299,
    duration: 4,
    targetAudience:
      "Restaurant owners and managers implementing RestaurantOS for order management, inventory tracking, and staff coordination",
    skills: [
      "Configure POS terminals and menu management system",
      "Set up inventory tracking with automatic low-stock alerts",
      "Train staff on order processing and payment handling",
      "Implement customer loyalty program and marketing automation",
      "Generate financial reports and track key restaurant metrics",
      "Integrate online ordering and delivery platform connections",
    ],
  },
  {
    concept: "Real Estate CRM Platform Implementation",
    title: "PropertyPro CRM - Agent Onboarding Program",
    category: "Real Estate Technology",
    level: CourseLevel.Beginner,
    price: 199,
    duration: 3,
    targetAudience:
      "Real estate agents and brokers implementing PropertyPro CRM for lead management, transaction tracking, and client communication",
    skills: [
      "Import and organize existing client database and leads",
      "Set up automated lead nurturing campaigns and follow-up sequences",
      "Configure MLS integration and property listing management",
      "Master transaction pipeline tracking from listing to closing",
      "Generate market reports and client presentations",
      "Implement automated client communication and appointment scheduling",
    ],
  },
  {
    concept: "Accounting Software Implementation",
    title: "BookKeepPro - Small Business Financial Setup",
    category: "Financial Management Software",
    level: CourseLevel.Beginner,
    price: 149,
    duration: 3,
    targetAudience:
      "Small business owners and bookkeepers implementing BookKeepPro for comprehensive financial management and compliance",
    skills: [
      "Set up chart of accounts and connect bank accounts for automatic transactions",
      "Configure invoice templates and automated payment reminders",
      "Implement expense tracking and receipt management system",
      "Generate tax-ready financial reports and quarterly statements",
      "Set up payroll processing and employee tax withholdings",
      "Configure automated backup and data security measures",
    ],
  },
];

async function seedCourses() {
  try {
    console.log("🌱 Starting course seeding...");

    // Clean up existing Stripe test products first
    await cleanupStripeTestProducts();

    // Clean up existing courses
    console.log("🧹 Cleaning up existing courses...");
    await prisma.course.deleteMany({});
    console.log("✅ Existing courses removed");

    // Get the platform admin user to be the course creator
    const user = await prisma.user.findFirst({
      where: {
        role: "platform_admin",
      },
    });

    if (!user) {
      console.error("❌ No user found. Please create a user first.");
      return;
    }

    console.log(`👤 Using user: ${user.email}`);

    for (const template of courseTemplates) {
      const slug = template.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      console.log(`\n📚 Creating course: ${template.title}`);

      // Create Stripe product for this course (just like admin course creation)
      console.log(`💳 Creating Stripe product for: ${template.title}`);
      const stripeProduct = await stripe.products.create({
        name: template.title,
        description: `Learn ${template.concept} with hands-on projects and real-world examples. Perfect for ${template.level.toLowerCase()} level students.`,
        metadata: {
          isTestData: "true", // Mark as test data for cleanup
          source: "seed", // Mark as seeded content
          courseSlug: slug, // Reference back to course
        },
        default_price_data: {
          currency: "usd",
          unit_amount: template.price * 100, // Convert to cents
        },
      });

      console.log(`✅ Stripe product created: ${stripeProduct.id}`);

      // Create course with proper S3 folder structure
      const course = await prisma.course.create({
        data: {
          title: template.title,
          description: generateRichTextDescription(template),
          smallDescription: `Learn ${template.concept} with hands-on projects and real-world examples. Perfect for ${template.level.toLowerCase()} level students.`,
          fileKey: "/Thumbnail-Placeholder.png", // Global placeholder from /public
          price: template.price,
          duration: template.duration,
          level: template.level,
          category: template.category,
          slug: slug,
          stripePriceId: stripeProduct.default_price as string, // Real Stripe price ID
          status: CourseStatus.Published,
          userId: user.id,
          chapter: {
            create: generateChapters(template).map((chapter, chapterIndex) => ({
              slug: slugify(chapter.title, { lower: true, strict: true }), // Add slug for chapter
              title: chapter.title,
              position: chapterIndex + 1, // 1-based positioning for chapters
              lessons: {
                create: chapter.lessons.map((lesson, lessonIndex) => ({
                  slug: slugify(lesson.title, { lower: true, strict: true }), // Add slug for lesson
                  title: lesson.title,
                  description: lesson.description || "",
                  position: lessonIndex + 1, // 1-based positioning for lessons
                  thumbnailKey: "/Thumbnail-Placeholder.png", // Global placeholder from /public
                  videoKey: "placeholder-lesson-video.mp4", // Placeholder for lesson videos
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

      console.log(`✅ Created course with ${course.chapter.length} chapters`);
      const totalLessons = course.chapter.reduce(
        (sum, ch) => sum + ch.lessons.length,
        0
      );
      console.log(`   📝 Total lessons: ${totalLessons}`);
    }

    console.log("\n🎉 Course seeding completed successfully!");
    console.log(`📊 Total courses created: ${courseTemplates.length}`);
  } catch (error) {
    console.error("❌ Error seeding courses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCourses();
