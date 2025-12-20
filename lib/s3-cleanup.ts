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
 * Clean up ALL S3 files for an organization
 * DANGEROUS: Only call when deleting entire organization
 *
 * Path pattern: organizations/{slug}/ (matches upload pattern)
 */
export async function cleanupOrganizationFiles(organization: {
  id: string;
  slug: string;
}): Promise<DeleteResult> {
  // Use slug only to match upload path pattern
  const prefix = `organizations/${organization.slug}/`;
  return await deleteByPrefix(prefix);
}

/**
 * Clean up expired export files
 *
 * Finds all DataExport records past their expiresAt date,
 * deletes the S3 files, and removes the database records.
 *
 * Intended to be called from a cron job (e.g., daily at 2 AM).
 *
 * @returns Summary of cleanup operation
 */
export async function cleanupExpiredExports(): Promise<{
  processed: number;
  deleted: number;
  errors: number;
  errorDetails: Array<{ id: string; error: string }>;
}> {
  // Import prisma here to avoid circular dependencies
  const { prisma } = await import("@/lib/db");

  const results = {
    processed: 0,
    deleted: 0,
    errors: 0,
    errorDetails: [] as Array<{ id: string; error: string }>,
  };

  try {
    // Find all expired exports
    const expiredExports = await prisma.dataExport.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        fileKey: true,
        organizationId: true,
      },
    });

    results.processed = expiredExports.length;

    if (expiredExports.length === 0) {
      return results;
    }

    // Process each expired export
    for (const exp of expiredExports) {
      try {
        // Delete S3 file
        const s3Deleted = await deleteS3Object(exp.fileKey);

        if (!s3Deleted) {
          // Log but continue - file may already be deleted
          console.warn(`S3 file not found or already deleted: ${exp.fileKey}`);
        }

        // Delete database record
        await prisma.dataExport.delete({
          where: { id: exp.id },
        });

        results.deleted++;
      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          id: exp.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(
      `[Export Cleanup] Processed: ${results.processed}, Deleted: ${results.deleted}, Errors: ${results.errors}`
    );

    return results;
  } catch (error) {
    console.error("Failed to cleanup expired exports:", error);
    return {
      ...results,
      errors: 1,
      errorDetails: [
        {
          id: "query",
          error: error instanceof Error ? error.message : "Query failed",
        },
      ],
    };
  }
}
