"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { requireChurchAdmin } from "@/app/data/church/require-church-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { cleanupCourseFiles } from "@/lib/s3-cleanup";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 3, // More restrictive for delete operations
  })
);

/**
 * Organization Context Type
 *
 * Discriminated union for platform vs agency course deletion.
 * Ensures type-safe context passing without callback injection.
 */
export type OrganizationContext =
  | { type: "platform" }
  | { type: "agency"; slug: string };

/**
 * Delete Course Parameters
 */
interface DeleteCourseParams {
  courseId: string;
  context: OrganizationContext;
}

/**
 * Delete Course (Unified Action)
 *
 * Handles course deletion for both platform and agency contexts.
 * Follows ADR-001: Direct server action imports with context parameters.
 *
 * Security:
 * - Platform: Requires platform_admin role
 * - Agency: Requires agency_admin role + organization ownership validation
 * - Rate limiting via Arcjet (3 deletions per minute)
 * - S3 file cleanup with error handling
 *
 * @param params - Course ID and organization context
 * @returns ApiResponse with success/error status
 */
export async function deleteCourse(
  params: DeleteCourseParams
): Promise<ApiResponse> {
  const { courseId, context } = params;

  try {
    if (context.type === "agency") {
      // Agency Context: Multi-tenant deletion with organization validation
      const { session, organization } = await requireChurchAdmin(context.slug);

      // Rate limiting
      const req = await request();
      await aj.protect(req, {
        fingerprint: `${session.user.id}_${organization.id}_delete`,
      });

      // Step 1: Get course data with organization validation
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          organizationId: organization.id, // Multi-tenant security
        },
        select: {
          id: true,
          slug: true,
          fileKey: true,
          s3Prefix: true,
          organizationId: true,
          organization: {
            select: { slug: true, id: true },
          },
        },
      });

      if (!course) {
        return {
          status: "error",
          message: "Course not found or access denied",
        };
      }

      // Step 2: Clean up S3 files
      const s3Result = await cleanupCourseFiles(course);

      if (s3Result.errors > 0) {
        console.warn(
          `S3 cleanup had ${s3Result.errors} errors:`,
          s3Result.errorDetails
        );
      }

      // Step 3: Delete course (cascades to chapters/lessons)
      await prisma.course.delete({
        where: {
          id: courseId,
          organizationId: organization.id,
        },
      });

      revalidatePath(`/agency/${context.slug}/admin/courses`);

      return {
        status: "success",
        message: `Course deleted (${s3Result.deleted} files cleaned up)`,
      };
    } else {
      // Platform Context: Admin deletion
      const user = await requireAdmin();

      // Step 1: Get course data
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          slug: true,
          fileKey: true,
          s3Prefix: true,
          organizationId: true,
          organization: {
            select: { slug: true, id: true },
          },
        },
      });

      if (!course) {
        return {
          status: "error",
          message: "Course not found",
        };
      }

      // Step 2: Clean up S3 files
      const s3Result = await cleanupCourseFiles(course);

      if (s3Result.errors > 0) {
        console.warn(
          `S3 cleanup had ${s3Result.errors} errors:`,
          s3Result.errorDetails
        );
      }

      // Step 3: Delete course
      const whereClause =
        user.user.role === "platform_admin"
          ? { id: courseId }
          : { id: courseId, userId: user.user.id };

      await prisma.course.delete({
        where: whereClause,
      });

      revalidatePath("/platform/admin/courses");

      return {
        status: "success",
        message: `Course deleted (${s3Result.deleted} files cleaned up)`,
      };
    }
  } catch (error) {
    console.error("Failed to delete course:", error);
    return {
      status: "error",
      message: "Failed to delete course",
    };
  }
}
