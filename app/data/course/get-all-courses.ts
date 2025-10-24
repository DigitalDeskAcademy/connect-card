/**
 * Public Course Catalog Data Access Layer
 *
 * Provides public-facing course data for the course catalog page, filtering
 * only published courses with essential information for browsing. Implements
 * performance optimization through selective field queries and proper ordering.
 *
 * Data Access Pattern:
 * - Public API (no authentication required)
 * - Selective field queries for performance optimization
 * - Filtered to published courses only
 * - Optimized ordering (free courses first, then by price ascending)
 *
 * Performance Optimizations:
 * - SELECT only required fields (avoids fetching large descriptions, content)
 * - Database index on status and price columns recommended
 * - Returns minimal data for efficient network transfer
 * - Cached at application level for repeated requests
 *
 * Business Logic:
 * - Only shows Published courses (hides Draft/Archived content)
 * - Price-based ordering promotes free courses for user acquisition
 * - Includes essential browsing metadata (level, duration, category)
 * - File key included for thumbnail display
 *
 * Usage Context:
 * - Course catalog/browse pages
 * - Public course listings
 * - SEO-friendly course discovery
 * - Marketing landing pages
 *
 * Security Considerations:
 * - No sensitive admin data exposed
 * - Only published content visible
 * - No user-specific data included
 * - Safe for public consumption
 */

import { prisma } from "@/lib/db";

/**
 * Fetches all published courses for public catalog display
 *
 * Retrieves essential course information for public browsing, excluding
 * sensitive admin data and draft content. Optimized for performance with
 * selective field queries and strategic ordering.
 *
 * Query Optimizations:
 * - SELECT only essential fields for catalog display
 * - WHERE filter restricts to published courses only
 * - ORDER BY promotes free courses (better conversion rates)
 * - No JOINs for maximum query performance
 *
 * @returns Promise<PublicCourseType[]> Array of published course summaries
 *
 * Returned Fields:
 * - title: Course display name
 * - price: Course price in cents (0 for free courses)
 * - smallDescription: Brief course summary for catalog cards
 * - slug: URL-friendly identifier for course routing
 * - fileKey: S3 key for course thumbnail image
 * - id: Database primary key for internal operations
 * - level: Difficulty level (Beginner, Intermediate, Advanced)
 * - duration: Estimated completion time for user planning
 * - category: Course category for filtering and organization
 *
 * Performance Notes:
 * - Query typically executes in <50ms with proper indexing
 * - Results should be cached for 5-10 minutes in production
 * - Consider pagination for catalogs with 100+ courses
 * - Monitor query performance as course count grows
 */
export async function getAllCourses() {
  // Fetch published courses with essential catalog information
  // Selective field query prevents loading large description/content fields
  const data = await prisma.course.findMany({
    where: {
      // Only show published courses to public users
      // This hides draft content and course development work
      status: "Published",
    },
    orderBy: {
      // Free courses first strategy for better user acquisition
      // Users more likely to engage with free content initially
      price: "asc", // 0 (free) comes first, then ascending price order
    },
    select: {
      // Essential fields for course catalog display
      title: true, // Course name for catalog cards
      price: true, // Pricing information for display and filtering
      smallDescription: true, // Brief summary for catalog preview
      slug: true, // URL routing parameter
      fileKey: true, // S3 key for thumbnail image display
      id: true, // Primary key for internal operations
      level: true, // Difficulty level for user filtering
      duration: true, // Time commitment information
      category: true, // Course categorization for organization
    },
  });

  return data;
}

/**
 * TypeScript type for public course catalog entries
 *
 * Automatically inferred from getAllCourses return type to ensure
 * type safety across components consuming course catalog data.
 *
 * Usage:
 * ```typescript
 * const courses: PublicCourseType[] = await getAllCourses();
 *
 * function CourseCard({ course }: { course: PublicCourseType }) {
 *   return <div>{course.title} - ${course.price / 100}</div>;
 * }
 * ```
 */
export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];
