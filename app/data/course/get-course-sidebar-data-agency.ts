/**
 * Agency-aware course sidebar data fetcher
 *
 * Unlike the single-tenant version, this doesn't check for individual enrollments.
 * In the multi-tenant system, users have access to courses through their agency's
 * subscription, not individual enrollments.
 *
 * Access rules:
 * - Platform courses: Available to all agency users
 * - Agency courses: Available to users in that agency
 * - Hidden courses: Not available to end users (role: "user")
 */

import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export async function getCourseSidebarDataForAgency(courseSlug: string) {
  // Get current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return notFound();
  }

  // Get user with organization info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      organizationId: true,
      role: true,
    },
  });

  if (!user || !user.organizationId) {
    return notFound();
  }

  // Get the course with chapters and lessons
  const course = await prisma.course.findUnique({
    where: {
      slug: courseSlug,
    },
    select: {
      id: true,
      title: true,
      fileKey: true,
      duration: true,
      level: true,
      category: true,
      slug: true,
      organizationId: true,
      isHiddenFromClients: true,
      status: true,
      chapter: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              title: true,
              position: true,
              description: true,
              lessonProgress: {
                where: {
                  userId: user.id,
                },
                select: {
                  completed: true,
                  lessonId: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return notFound();
  }

  // Check if course is accessible to this organization
  // Platform courses (organizationId = null) are accessible to all
  // Agency courses must belong to the user's organization
  if (course.organizationId && course.organizationId !== user.organizationId) {
    return notFound();
  }

  // Check if course is hidden from end users
  if (user.role === "user" && course.isHiddenFromClients) {
    return notFound();
  }

  // Check if course is published
  if (course.status !== "Published") {
    // Only admins can view unpublished courses
    if (user.role === "user") {
      return notFound();
    }
  }

  // Return course data, omitting the fields we used for validation
  // We need to destructure to remove these fields from the return value
  return {
    course: {
      id: course.id,
      title: course.title,
      fileKey: course.fileKey,
      duration: course.duration,
      level: course.level,
      category: course.category,
      slug: course.slug,
      chapter: course.chapter,
    },
  };
}

export type CourseSidebarDataForAgencyType = Awaited<
  ReturnType<typeof getCourseSidebarDataForAgency>
>;
