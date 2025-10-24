"use server";

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";
import { env } from "@/lib/env";

/**
 * S3 Cleanup Utility - Bulk File Deletion Operations
 *
 * Production-ready utilities for cleaning S3 storage when deleting
 * courses, chapters, lessons, or entire organizations.
 *
 * Key Features:
 * - Batch deletion (up to 1000 files per request)
 * - Prefix-based recursive deletion
 * - Detailed error reporting
 * - Safe handling of non-existent files
 * - Backwards compatibility with legacy flat file structure
 */

interface DeleteResult {
  deleted: number;
  errors: number;
  errorDetails?: Array<{ key: string; message: string }>;
  message: string;
}

/**
 * Delete single S3 object by key
 * Use for individual file cleanup (e.g., replacing course thumbnail)
 */
export async function deleteS3Object(key: string): Promise<boolean> {
  if (!key || key.includes("Placeholder") || key.includes("placeholder")) {
    return true; // Don't delete placeholders
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    await S3.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete S3 object: ${key}`, error);
    return false;
  }
}

/**
 * Batch delete up to 1000 S3 objects in single API call
 * More efficient than individual deletes
 */
export async function batchDeleteS3Objects(
  keys: string[]
): Promise<DeleteResult> {
  // Filter out placeholders and empty keys
  const validKeys = keys.filter(
    key => key && !key.includes("Placeholder") && !key.includes("placeholder")
  );

  if (validKeys.length === 0) {
    return {
      deleted: 0,
      errors: 0,
      message: "No files to delete",
    };
  }

  const BATCH_SIZE = 1000;
  const results = {
    deleted: 0,
    errors: 0,
    errorDetails: [] as Array<{ key: string; message: string }>,
  };

  // Process in batches of 1000
  for (let i = 0; i < validKeys.length; i += BATCH_SIZE) {
    const batch = validKeys.slice(i, i + BATCH_SIZE);

    try {
      const command = new DeleteObjectsCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: false,
        },
      });

      const response = await S3.send(command);

      if (response.Deleted) {
        results.deleted += response.Deleted.length;
      }

      if (response.Errors) {
        results.errors += response.Errors.length;
        results.errorDetails.push(
          ...response.Errors.map(e => ({
            key: e.Key || "unknown",
            message: e.Message || "Unknown error",
          }))
        );
      }
    } catch (error) {
      results.errors += batch.length;
      results.errorDetails.push(
        ...batch.map(key => ({
          key,
          message: error instanceof Error ? error.message : "Batch failed",
        }))
      );
    }
  }

  return {
    ...results,
    message: `Deleted ${results.deleted} files, ${results.errors} errors`,
  };
}

/**
 * List all objects with given prefix (recursive directory listing)
 * Handles S3 pagination automatically
 */
export async function listObjectsByPrefix(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await S3.send(command);

      if (response.Contents) {
        keys.push(...response.Contents.map(obj => obj.Key!).filter(Boolean));
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  } catch (error) {
    console.error(`Failed to list objects with prefix: ${prefix}`, error);
    return [];
  }
}

/**
 * Delete all objects with given prefix (recursive directory delete)
 * Use for cleaning entire courses, chapters, or organizations
 */
export async function deleteByPrefix(prefix: string): Promise<DeleteResult> {
  try {
    // List all objects
    const keys = await listObjectsByPrefix(prefix);

    if (keys.length === 0) {
      return {
        deleted: 0,
        errors: 0,
        message: "No files found",
      };
    }

    // Batch delete
    return await batchDeleteS3Objects(keys);
  } catch (error) {
    return {
      deleted: 0,
      errors: 1,
      errorDetails: [
        {
          key: prefix,
          message: error instanceof Error ? error.message : "Delete failed",
        },
      ],
      message: "Failed to delete by prefix",
    };
  }
}

/**
 * Clean up S3 files for deleted course
 * Handles both new hierarchical structure and legacy flat files
 */
export async function cleanupCourseFiles(course: {
  id: string;
  slug: string;
  fileKey: string;
  s3Prefix?: string | null;
  organizationId?: string | null;
  organization?: { slug: string; id: string } | null;
}): Promise<DeleteResult> {
  const results = {
    deleted: 0,
    errors: 0,
    errorDetails: [] as Array<{ key: string; message: string }>,
  };

  // Step 1: Delete new hierarchical structure if exists
  if (course.s3Prefix) {
    const prefixResult = await deleteByPrefix(course.s3Prefix);
    results.deleted += prefixResult.deleted;
    results.errors += prefixResult.errors;
    if (prefixResult.errorDetails) {
      results.errorDetails.push(...prefixResult.errorDetails);
    }
  } else if (course.organization) {
    // Build prefix from course data if s3Prefix not stored - use slug only (no ID appended)
    const orgPrefix = `organizations/${course.organization.slug}`;
    const coursePrefix = `${orgPrefix}/courses/${course.slug}/`;
    const prefixResult = await deleteByPrefix(coursePrefix);
    results.deleted += prefixResult.deleted;
    results.errors += prefixResult.errors;
    if (prefixResult.errorDetails) {
      results.errorDetails.push(...prefixResult.errorDetails);
    }
  } else {
    // Platform course - use slug only (no ID appended)
    const coursePrefix = `platform/courses/${course.slug}/`;
    const prefixResult = await deleteByPrefix(coursePrefix);
    results.deleted += prefixResult.deleted;
    results.errors += prefixResult.errors;
    if (prefixResult.errorDetails) {
      results.errorDetails.push(...prefixResult.errorDetails);
    }
  }

  // Step 2: Delete legacy course thumbnail (backwards compatibility)
  if (course.fileKey && !course.fileKey.includes(course.slug)) {
    // Legacy flat file format
    const deleted = await deleteS3Object(course.fileKey);
    if (deleted) {
      results.deleted++;
    } else {
      results.errors++;
      results.errorDetails.push({
        key: course.fileKey,
        message: "Failed to delete legacy course thumbnail",
      });
    }
  }

  return {
    ...results,
    message: `Course cleanup: ${results.deleted} deleted, ${results.errors} errors`,
  };
}

/**
 * Clean up S3 files for deleted lesson
 * Handles both new hierarchical structure and legacy flat files
 */
export async function cleanupLessonFiles(lesson: {
  id: string;
  slug: string;
  videoKey?: string | null;
  thumbnailKey?: string | null;
  s3Prefix?: string | null;
  Chapter?: {
    slug: string;
    id: string;
    Course: {
      slug: string;
      id: string;
      organizationId: string | null;
      organization: { slug: string; id: string } | null;
    };
  };
}): Promise<DeleteResult> {
  const results = {
    deleted: 0,
    errors: 0,
    errorDetails: [] as Array<{ key: string; message: string }>,
  };

  // Step 1: Delete new hierarchical structure if exists
  if (lesson.s3Prefix) {
    const prefixResult = await deleteByPrefix(lesson.s3Prefix);
    results.deleted += prefixResult.deleted;
    results.errors += prefixResult.errors;
    if (prefixResult.errorDetails) {
      results.errorDetails.push(...prefixResult.errorDetails);
    }
  } else if (lesson.Chapter) {
    // Build prefix from lesson data if s3Prefix not stored
    const course = lesson.Chapter.Course;
    const orgPrefix = course.organization
      ? `organizations/${course.organization.slug}-${course.organization.id}`
      : "platform";
    const lessonPrefix = `${orgPrefix}/courses/${course.slug}-${course.id}/chapters/${lesson.Chapter.slug}-${lesson.Chapter.id}/lessons/${lesson.slug}-${lesson.id}`;
    const prefixResult = await deleteByPrefix(lessonPrefix);
    results.deleted += prefixResult.deleted;
    results.errors += prefixResult.errors;
    if (prefixResult.errorDetails) {
      results.errorDetails.push(...prefixResult.errorDetails);
    }
  }

  // Step 2: Delete legacy individual files (backwards compatibility)
  const legacyKeys = [lesson.videoKey, lesson.thumbnailKey].filter(
    key => key && !key.includes(lesson.slug) // Legacy flat file
  );

  for (const key of legacyKeys) {
    if (key) {
      const deleted = await deleteS3Object(key);
      if (deleted) {
        results.deleted++;
      } else {
        results.errors++;
        results.errorDetails.push({
          key,
          message: "Failed to delete legacy lesson file",
        });
      }
    }
  }

  return {
    ...results,
    message: `Lesson cleanup: ${results.deleted} deleted, ${results.errors} errors`,
  };
}

/**
 * Clean up ALL S3 files for an organization
 * DANGEROUS: Only call when deleting entire organization
 */
export async function cleanupOrganizationFiles(organization: {
  id: string;
  slug: string;
}): Promise<DeleteResult> {
  const prefix = `organizations/${organization.slug}-${organization.id}/`;
  return await deleteByPrefix(prefix);
}
