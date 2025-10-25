/**
 * IV Therapy Clinic Course Seed Script
 *
 * Creates sample courses relevant to an IV therapy clinic using a CRM system.
 * Includes onboarding, marketing, operations, and compliance courses.
 *
 * Run with: npx tsx scripts/seed-iv-therapy-courses.ts
 */

import { PrismaClient } from "../lib/generated/prisma";
import { placeholderCourseThumbnail } from "../lib/constants/placeholder-assets";

const prisma = new PrismaClient();

async function seedIVTherapyCourses() {
  console.log("💉 Creating IV Therapy clinic courses...\n");

  try {
    // Get the Digital Desk organization
    const org = await prisma.organization.findFirst({
      where: {
        OR: [{ slug: "digital-desk" }, { name: "Digital Desk" }],
      },
    });

    if (!org) {
      console.error(
        "❌ Organization 'Digital Desk' not found. Please run user seed first."
      );
      return;
    }

    // Get a platform admin user to assign as course creator
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "platform_admin",
      },
    });

    if (!adminUser) {
      console.error(
        "❌ No platform admin found. Please ensure you have a platform admin user."
      );
      return;
    }

    console.log(`✅ Using organization: ${org.name}`);
    console.log(`✅ Course creator: ${adminUser.email}\n`);

    // Define IV Therapy specific courses
    const courses = [
      {
        id: "iv-clinic-quickstart",
        title: "IV Clinic Quick Start",
        slug: "iv-clinic-quick-start",
        description:
          "Get your IV therapy clinic up and running with our comprehensive CRM system in just 7 days. This course covers everything from initial setup to your first patient booking.",
        smallDescription:
          "Complete CRM setup guide for IV therapy clinics - from zero to operational in 7 days",
        duration: 3,
        level: "Beginner",
        category: "Onboarding",
        status: "Published",
        price: 0,
        isFree: true,
        fileKey: placeholderCourseThumbnail,
        organizationId: null, // Platform course - available to all
        userId: adminUser.id,
        isHiddenFromClients: false,
      },
      {
        id: "iv-marketing-mastery",
        title: "IV Therapy Marketing Mastery",
        slug: "iv-therapy-marketing-mastery",
        description:
          "Learn how to leverage your CRM for automated marketing campaigns, email sequences, and social media integration. Includes templates specific to IV therapy services like NAD+, Myers Cocktail, and Immunity Boosts.",
        smallDescription:
          "Automate your IV clinic marketing with CRM-powered campaigns and templates",
        duration: 5,
        level: "Intermediate",
        category: "Marketing",
        status: "Published",
        price: 0,
        isFree: true,
        fileKey: placeholderCourseThumbnail,
        organizationId: null, // Platform course
        userId: adminUser.id,
        isHiddenFromClients: false,
      },
      {
        id: "patient-management-pro",
        title: "Patient Management & Retention",
        slug: "patient-management-retention",
        description:
          "Master patient relationship management using your CRM. Learn to track patient preferences, automate appointment reminders, manage consent forms, and implement loyalty programs.",
        smallDescription:
          "Build lasting patient relationships with smart CRM strategies",
        duration: 4,
        level: "Intermediate",
        category: "Operations",
        status: "Published",
        price: 0,
        isFree: true,
        fileKey: placeholderCourseThumbnail,
        organizationId: null,
        userId: adminUser.id,
        isHiddenFromClients: false,
      },
      {
        id: "compliance-documentation",
        title: "Compliance & Documentation",
        slug: "compliance-documentation",
        description:
          "Ensure your IV therapy clinic meets all regulatory requirements. Learn to use the CRM for HIPAA-compliant record keeping, consent management, and automated compliance reporting.",
        smallDescription:
          "Stay compliant with automated documentation and reporting",
        duration: 2,
        level: "Beginner",
        category: "Compliance",
        status: "Published",
        price: 0,
        isFree: true,
        fileKey: placeholderCourseThumbnail,
        organizationId: null,
        userId: adminUser.id,
        isHiddenFromClients: false,
      },
      {
        id: "revenue-optimization",
        title: "Revenue Optimization Strategies",
        slug: "revenue-optimization",
        description:
          "Maximize your clinic's revenue using CRM analytics. Learn to identify high-value services, optimize pricing, implement membership programs, and track ROI on marketing campaigns.",
        smallDescription:
          "Data-driven strategies to increase your clinic's revenue",
        duration: 3,
        level: "Advanced",
        category: "Business",
        status: "Published",
        price: 0,
        isFree: true,
        fileKey: placeholderCourseThumbnail,
        organizationId: null,
        userId: adminUser.id,
        isHiddenFromClients: false,
      },
      {
        id: "team-training-sops",
        title: "Team Training & SOPs",
        slug: "team-training-sops",
        description:
          "Build a consistent patient experience with standardized procedures. Create training modules in your CRM, track staff certifications, and maintain digital SOPs for all clinic operations.",
        smallDescription:
          "Standardize operations and train your team effectively",
        duration: 4,
        level: "Intermediate",
        category: "Operations",
        status: "Published",
        price: 0,
        isFree: true,
        fileKey: placeholderCourseThumbnail,
        organizationId: org.id, // Agency-specific course
        userId: adminUser.id,
        isHiddenFromClients: false,
      },
    ];

    // Create courses
    for (const course of courses) {
      const created = await prisma.course.upsert({
        where: { slug: course.slug },
        update: {
          title: course.title,
          description: course.description,
          smallDescription: course.smallDescription,
          duration: course.duration,
          level: course.level,
          category: course.category,
          status: course.status,
          price: course.price,
          isFree: course.isFree,
          fileKey: course.fileKey,
          isHiddenFromClients: course.isHiddenFromClients,
          updatedAt: new Date(),
        },
        create: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          smallDescription: course.smallDescription,
          duration: course.duration,
          level: course.level,
          category: course.category,
          status: course.status,
          price: course.price,
          isFree: course.isFree,
          fileKey: course.fileKey,
          isHiddenFromClients: course.isHiddenFromClients,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            connect: { id: course.userId },
          },
          organization: course.organizationId
            ? {
                connect: { id: course.organizationId },
              }
            : undefined,
        },
      });

      const courseType = created.organizationId ? "Agency" : "Platform";
      console.log(`✅ Created ${courseType} course: ${created.title}`);

      // Create sample chapters for IV Clinic Quick Start
      if (course.id === "iv-clinic-quickstart") {
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

          // Create chapter with UUID auto-generated
          const createdChapter = await prisma.chapter.create({
            data: {
              ...chapterInfo,
              courseId: created.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Create lessons for this chapter
          for (let i = 0; i < lessons.length; i++) {
            await prisma.lesson.create({
              data: {
                slug: lessons[i].slug,
                title: lessons[i].title,
                description: lessons[i].description,
                position: i + 1,
                chapterId: createdChapter.id, // Use auto-generated UUID
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }
        }
        console.log(
          "   📚 Created 4 chapters with lessons for IV Clinic Quick Start"
        );
      }
    }

    console.log("\n🎉 IV Therapy courses created successfully!");
    console.log("\n📊 Summary:");
    console.log(`- 5 Platform courses (available to all agencies)`);
    console.log(`- 1 Agency-specific course (Team Training & SOPs)`);
    console.log(`- IV Clinic Quick Start includes 4 chapters with lessons`);
    console.log("\n💡 Topics covered:");
    console.log("- Initial CRM setup and onboarding");
    console.log("- Marketing automation and campaigns");
    console.log("- Patient relationship management");
    console.log("- Compliance and documentation");
    console.log("- Revenue optimization");
    console.log("- Team training and SOPs");
  } catch (error) {
    console.error("❌ Error creating courses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedIVTherapyCourses();
