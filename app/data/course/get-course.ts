/**
 * Individual Course Data Access Layer
 *
 * Provides detailed course information for course detail pages, including
 * complete course structure with chapters and lessons. Implements efficient
 * nested queries and proper 404 handling for non-existent courses.
 *
 * Data Access Pattern:
 * - Public API (no authentication required for course details)
 * - Nested relational queries with selective field optimization
 * - Slug-based lookup for SEO-friendly URLs
 * - Hierarchical data structure (course → chapters → lessons)
 *
 * Performance Optimizations:
 * - Single database query with JOIN operations
 * - SELECT only essential fields to minimize data transfer
 * - Ordered results prevent frontend sorting overhead
 * - Prisma's efficient query planning for nested relations
 *
 * Business Logic:
 * - Returns complete course structure for enrollment decisions
 * - Includes pricing information for purchase flow integration
 * - Maintains course hierarchy (chapters ordered by position)
 * - Lessons within chapters also position-ordered
 *
 * URL Structure:
 * - Accessed via `/courses/[slug]` dynamic route
 * - Slug-based lookup enables SEO-friendly URLs
 * - 404 handling for invalid/deleted courses
 *
 * Usage Context:
 * - Course detail pages
 * - Enrollment flow initialization
 * - Course structure preview
 * - SEO and social media sharing
 *
 * Security Considerations:
 * - Public course data only (no sensitive admin fields)
 * - No lesson content exposed (prevents piracy)
 * - Price information visible for transparent purchasing
 * - Course structure helps user make informed decisions
 */

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

/**
 * Fetches detailed course information by slug for course detail pages
 *
 * Retrieves complete course structure including metadata, chapters, and lessons
 * in a hierarchical format. Optimized for course detail page rendering with
 * proper ordering and selective field queries.
 *
 * Query Structure:
 * - Main course data (metadata, pricing, description)
 * - Nested chapters with position-based ordering
 * - Lessons within each chapter (also position-ordered)
 * - Efficient JOIN operations minimize database round trips
 *
 * @param slug - URL-friendly course identifier (unique)
 * @returns Promise<CourseWithStructure> Complete course with nested structure
 * @throws notFound() - Triggers Next.js 404 page for invalid slugs
 *
 * Returned Structure:
 * ```typescript
 * {
 *   id: string;              // Database primary key
 *   title: string;           // Course display name
 *   description: string;     // Full course description for detail page
 *   fileKey: string;         // S3 key for course thumbnail
 *   price: number;           // Price in cents (0 for free courses)
 *   duration: string;        // Estimated completion time
 *   level: string;           // Difficulty level
 *   category: string;        // Course category
 *   smallDescription: string; // Brief summary
 *   chapter: [{              // Ordered array of chapters
 *     id: string;
 *     title: string;
 *     lessons: [{             // Ordered lessons within chapter
 *       id: string;
 *       title: string;
 *     }]
 *   }]
 * }
 * ```
 *
 * Performance Notes:
 * - Single query loads all data (no N+1 query problems)
 * - Results suitable for caching (relatively static content)
 * - Query time typically <100ms with proper database indexing
 * - Consider caching course structure data for popular courses
 *
 * Error Handling:
 * - Automatic 404 response for non-existent slugs
 * - Next.js notFound() provides proper HTTP status and SEO handling
 * - Database errors bubble up to error boundary
 */
export async function getIndividualCourse(slug: string) {
  // Execute single query with nested relations for complete course structure
  // Uses unique slug constraint for efficient lookup
  const course = await prisma.course.findUnique({
    where: {
      slug: slug, // Unique slug enables SEO-friendly URLs
    },
    select: {
      // Core course information for detail page display
      id: true, // Database primary key for internal operations
      title: true, // Course display name
      description: true, // Full course description (HTML content)
      fileKey: true, // S3 key for thumbnail image display
      price: true, // Price in cents for payment integration
      duration: true, // Estimated completion time
      level: true, // Difficulty level for user filtering
      category: true, // Course category for organization
      smallDescription: true, // Brief summary for sharing/SEO

      // Nested chapter structure with ordered lessons
      chapter: {
        select: {
          id: true, // Chapter database ID
          title: true, // Chapter display name

          // Lessons within each chapter (also ordered)
          lessons: {
            select: {
              id: true, // Lesson database ID
              title: true, // Lesson display name
            },
            orderBy: {
              // Lessons ordered by position within chapter
              position: "asc", // Maintains instructional sequence
            },
          },
        },
        orderBy: {
          // Chapters ordered by position within course
          position: "asc", // Maintains course flow and progression
        },
      },
    },
  });

  // Handle non-existent courses with proper 404 response
  // Next.js notFound() provides SEO-friendly 404 handling
  if (!course) {
    return notFound();
  }

  return course;
}
