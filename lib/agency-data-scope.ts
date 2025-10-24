/**
 * Agency Data Scoping Utilities
 *
 * Provides auto-scoped data access functions for agency contexts.
 * All queries are automatically filtered by organizationId to prevent
 * cross-tenant data leakage.
 *
 * Security: Every function requires an organizationId parameter
 * to ensure data isolation between agencies.
 */

import { prisma } from "@/lib/db";
import type {
  Course,
  User,
  Enrollment,
  Prisma,
  UserRole,
} from "@/lib/generated/prisma";

/**
 * Create a scoped data access layer for an organization
 *
 * @param organizationId - The organization to scope queries to
 * @returns Object with scoped data access functions
 */
export function createAgencyDataScope(organizationId: string) {
  return {
    /**
     * Get all courses available to the agency
     * Includes both platform core courses and agency custom courses
     * For admins, shows all courses. For users, filters hidden courses.
     */
    getCourses: async (includeHidden = true): Promise<Course[]> => {
      const courses = await prisma.course.findMany({
        where: {
          OR: [
            // Platform core courses (visible to all agencies)
            {
              organizationId: null,
              status: "Published",
            },
            // Agency's custom courses
            {
              organizationId,
              ...(includeHidden ? {} : { isHiddenFromClients: false }),
            },
          ],
        },
        orderBy: [
          { organizationId: "asc" }, // Core courses first
          { createdAt: "desc" },
        ],
      });
      return courses;
    },

    /**
     * Get courses visible to end users (excludes hidden courses)
     */
    getVisibleCourses: async (): Promise<Course[]> => {
      const courses = await prisma.course.findMany({
        where: {
          OR: [
            // Platform core courses (always visible)
            {
              organizationId: null,
              status: "Published",
            },
            // Agency's custom courses (only non-hidden)
            {
              organizationId,
              isHiddenFromClients: false,
            },
          ],
        },
        orderBy: [
          { organizationId: "asc" }, // Core courses first
          { createdAt: "desc" },
        ],
      });
      return courses;
    },

    /**
     * Get only the agency's custom courses
     */
    getCustomCourses: async (): Promise<Course[]> => {
      return prisma.course.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      });
    },

    /**
     * Get all users in the organization
     */
    getUsers: async (): Promise<User[]> => {
      return prisma.user.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      });
    },

    /**
     * Get users by role
     */
    getUsersByRole: async (role: UserRole): Promise<User[]> => {
      return prisma.user.findMany({
        where: {
          organizationId,
          role,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    /**
     * Get organization statistics
     */
    getStats: async () => {
      const [
        userCount,
        customCourseCount,
        activeEnrollments,
        completedLessons,
      ] = await Promise.all([
        // Total users in organization
        prisma.user.count({
          where: { organizationId },
        }),

        // Custom courses created by agency
        prisma.course.count({
          where: { organizationId },
        }),

        // Active enrollments for organization's users
        prisma.enrollment.count({
          where: {
            User: { organizationId },
            status: "Active",
          },
        }),

        // Completed lessons by organization's users
        prisma.lessonProgress.count({
          where: {
            User: { organizationId },
            completed: true,
          },
        }),
      ]);

      return {
        userCount,
        customCourseCount,
        activeEnrollments,
        completedLessons,
      };
    },

    /**
     * Get enrollments for the organization
     */
    getEnrollments: async (): Promise<Enrollment[]> => {
      return prisma.enrollment.findMany({
        where: {
          User: { organizationId },
        },
        include: {
          Course: true,
          User: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    /**
     * Create a custom course for the agency
     */
    createCourse: async (
      courseData: Omit<
        Prisma.CourseUncheckedCreateInput,
        "organizationId" | "stripePriceId" | "userId"
      > & { userId: string }
    ) => {
      return prisma.course.create({
        data: {
          ...courseData,
          organizationId, // Always set the organizationId
          stripePriceId:
            courseData.price > 0 ? `agency_course_${Date.now()}` : null, // Null for free courses
          isFree: courseData.price === 0, // Mark as free if price is 0
        },
      });
    },

    /**
     * Check if a user belongs to the organization
     */
    validateUserMembership: async (userId: string): Promise<boolean> => {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });
      return !!user;
    },

    /**
     * Get analytics data for the organization
     */
    getAnalytics: async (startDate?: Date, endDate?: Date) => {
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {};

      const [newUsers, newEnrollments, lessonsCompleted] = await Promise.all([
        // New users in date range
        prisma.user.count({
          where: {
            organizationId,
            ...dateFilter,
          },
        }),

        // New enrollments in date range
        prisma.enrollment.count({
          where: {
            User: { organizationId },
            ...dateFilter,
          },
        }),

        // Lessons completed in date range
        prisma.lessonProgress.count({
          where: {
            User: { organizationId },
            completed: true,
            ...dateFilter,
          },
        }),
      ]);

      return {
        newUsers,
        newEnrollments,
        lessonsCompleted,
      };
    },
  };
}

/**
 * Helper to check if a course belongs to an organization
 */
export async function coursebelongsToOrganization(
  courseId: string,
  organizationId: string
): Promise<boolean> {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      organizationId,
    },
  });
  return !!course;
}

/**
 * Helper to get organization course access
 * Returns courses the organization can access (core + custom)
 */
export async function getOrganizationCourseAccess(organizationId: string) {
  const scope = createAgencyDataScope(organizationId);
  return scope.getCourses();
}
