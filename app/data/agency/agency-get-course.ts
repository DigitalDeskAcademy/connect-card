/**
 * Agency Course Data Fetcher
 *
 * Retrieves course data with proper multi-tenant security.
 * Ensures agencies can only access their own custom courses
 * while preventing cross-tenant data access.
 *
 * Security:
 * - Requires agency admin authentication
 * - Validates course belongs to the organization
 * - Returns 404 for unauthorized access attempts
 */

import { prisma } from "@/lib/db";
import "server-only";
import { requireAgencyAdmin } from "./require-agency-admin";
import { notFound } from "next/navigation";

/**
 * Get a single course with full details for agency editing
 *
 * @param slug - Agency slug for authentication
 * @param courseId - Course ID to retrieve
 * @returns Course data with chapters and lessons
 * @throws 404 if course not found or unauthorized
 */
export async function agencyGetCourse(slug: string, courseId: string) {
  // Ensure only authenticated agency admins can access
  const { organization } = await requireAgencyAdmin(slug);

  // Fetch course with organization scoping for security
  const data = await prisma.course.findFirst({
    where: {
      id: courseId,
      // CRITICAL: Only allow access to agency's own courses
      organizationId: organization.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      fileKey: true,
      price: true,
      duration: true,
      level: true,
      status: true,
      slug: true,
      smallDescription: true,
      category: true,
      isHiddenFromClients: true,
      chapter: {
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailKey: true,
              position: true,
              videoKey: true,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  // Return 404 if course doesn't exist or doesn't belong to this agency
  if (!data) {
    return notFound();
  }

  return data;
}

// Export type for type safety in components
export type AgencyCourseSingularType = Awaited<
  ReturnType<typeof agencyGetCourse>
>;
