/**
 * Admin Course Data Layer - Secure Course Management Interface
 *
 * Provides type-safe, authenticated access to course data for admin
 * interfaces. Implements selective field loading for optimal performance
 * and maintains data security through role-based access control.
 *
 * Security Architecture:
 * - Server-only execution prevents client-side data exposure
 * - Admin authentication required via requireAdmin() guard
 * - Type-safe database queries prevent SQL injection
 * - Selective field loading minimizes data exposure
 *
 * Performance Features:
 * - Optimized query with selective field loading
 * - Efficient database indexing on createdAt for fast sorting
 * - Minimal data transfer with only required fields
 * - Type inference for compile-time optimization
 *
 * Data Architecture:
 * - Chronological ordering (newest first) for admin workflow efficiency
 * - Complete course metadata for admin dashboard display
 * - Includes pricing, status, and media information
 * - Slug field for URL generation and SEO management
 *
 * TypeScript Integration:
 * - Automatically inferred return types prevent runtime errors
 * - Type-safe field selection with Prisma generated types
 * - Exported type for consistent component interfaces
 * - Compile-time validation of database schema alignment
 *
 * Business Value:
 * - Enables efficient course management workflows
 * - Provides real-time course catalog administration
 * - Supports content publishing and pricing strategies
 * - Maintains audit trail with creation timestamps
 *
 * @returns Array of course objects with admin-relevant fields
 * @throws Redirects non-admin users via requireAdmin() security guard
 * @performance Optimized query with selective field loading and efficient indexing
 */

import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

/**
 * Fetches all courses for admin management interface
 *
 * Retrieves complete course catalog with essential metadata
 * for administrative operations, content management, and
 * business intelligence dashboards.
 */
export async function adminGetCourses() {
  await requireAdmin();

  /**
   * Optimized Course Query - Admin Dashboard Data
   *
   * Selects only fields necessary for admin interface to minimize
   * data transfer and improve rendering performance. Ordered by
   * creation date for intuitive content management workflow.
   */
  const data = await prisma.course.findMany({
    orderBy: {
      createdAt: "desc", // Newest courses first for admin efficiency
    },

    select: {
      id: true, // Primary key for database operations
      title: true, // Course title for identification
      smallDescription: true, // Brief description for admin preview
      duration: true, // Course length for planning
      level: true, // Difficulty level classification
      status: true, // Publication status (draft/published)
      price: true, // Pricing information for business logic
      fileKey: true, // Media storage reference
      slug: true, // URL-friendly identifier for routing
    },
  });

  return data;
}

/**
 * Type Definition - Admin Course Interface
 *
 * Automatically inferred TypeScript type from the function return value.
 * Ensures type safety across admin components and prevents runtime errors
 * by maintaining alignment with database schema and query selection.
 *
 * Usage: Provides consistent typing for admin course cards, lists, and forms.
 */
export type AdminCourseType = Awaited<ReturnType<typeof adminGetCourses>>[0];
