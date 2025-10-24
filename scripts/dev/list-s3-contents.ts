/**
 * S3 BUCKET INSPECTION SCRIPT - DEVELOPMENT ONLY
 *
 * ⚠️  WARNING: DELETE THIS SCRIPT BEFORE PRODUCTION LAUNCH
 *
 * This script provides visibility into S3 bucket contents during development.
 * It should NOT be deployed to production as it:
 * - Can list all files across all organizations
 * - May reveal sensitive file structures
 * - Is only needed for development debugging
 *
 * Usage:
 *   pnpm tsx scripts/list-s3-contents.ts
 *   pnpm tsx scripts/list-s3-contents.ts --prefix="organizations/digital-desk"
 *   pnpm tsx scripts/list-s3-contents.ts --verbose
 *
 * TODO: Remove this file before merging to production
 */

import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config({ path: ".env" });

// Create standalone S3 client (can't use @/lib/S3Client due to "server-only" import)
const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES!;

interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
}

interface DirectoryStats {
  fileCount: number;
  totalSize: number;
  subdirectories: Map<string, DirectoryStats>;
  files: S3Object[];
}

async function listAllObjects(prefix: string = ""): Promise<S3Object[]> {
  const objects: S3Object[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await S3.send(command);

      if (response.Contents) {
        objects.push(
          ...response.Contents.filter(obj => obj.Key).map(obj => ({
            key: obj.Key!,
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
          }))
        );
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  } catch (error) {
    console.error("Failed to list S3 objects:", error);
    return [];
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function buildDirectoryTree(objects: S3Object[]): DirectoryStats {
  const root: DirectoryStats = {
    fileCount: 0,
    totalSize: 0,
    subdirectories: new Map(),
    files: [],
  };

  for (const obj of objects) {
    const parts = obj.key.split("/");
    let current = root;

    // Navigate through directory structure
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      if (!current.subdirectories.has(dirName)) {
        current.subdirectories.set(dirName, {
          fileCount: 0,
          totalSize: 0,
          subdirectories: new Map(),
          files: [],
        });
      }
      current = current.subdirectories.get(dirName)!;
    }

    // Add file to current directory
    current.files.push(obj);
    current.fileCount++;
    current.totalSize += obj.size;

    // Update parent totals
    let parent = root;
    for (let i = 0; i < parts.length - 1; i++) {
      parent.fileCount++;
      parent.totalSize += obj.size;
      parent = parent.subdirectories.get(parts[i])!;
    }
  }

  return root;
}

function printDirectoryTree(
  stats: DirectoryStats,
  indent: string = "",
  name: string = "root",
  verbose: boolean = false
): void {
  const hasSubdirs = stats.subdirectories.size > 0;
  const hasFiles = stats.files.length > 0;

  if (name !== "root") {
    console.log(
      `${indent}📁 ${name}/ (${stats.fileCount} files, ${formatBytes(stats.totalSize)})`
    );
  }

  // Print subdirectories
  const subdirEntries = Array.from(stats.subdirectories.entries());
  subdirEntries.forEach(([dirName, dirStats], index) => {
    const isLast = index === subdirEntries.length - 1 && !hasFiles;
    const newIndent = indent + (isLast ? "    " : "│   ");
    const prefix = indent + (isLast ? "└── " : "├── ");

    console.log(
      `${prefix}${dirName}/ (${dirStats.fileCount} files, ${formatBytes(dirStats.totalSize)})`
    );
    printDirectoryTree(dirStats, newIndent, "", verbose);
  });

  // Print files if verbose mode
  if (verbose && hasFiles) {
    stats.files.forEach((file, index) => {
      const isLast = index === stats.files.length - 1;
      const prefix = indent + (isLast ? "└── " : "├── ");
      const fileName = file.key.split("/").pop();
      console.log(`${prefix}📄 ${fileName} (${formatBytes(file.size)})`);
    });
  }
}

function identifyLegacyFiles(objects: S3Object[]): S3Object[] {
  // Legacy files are those not in a hierarchical structure
  // (i.e., files in the root or files not following our naming convention)
  return objects.filter(obj => {
    const parts = obj.key.split("/");

    // Files in root
    if (parts.length === 1) return true;

    // Files not starting with "platform/" or "organizations/"
    if (
      !obj.key.startsWith("platform/") &&
      !obj.key.startsWith("organizations/")
    ) {
      return true;
    }

    return false;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const prefixArg = args.find(arg => arg.startsWith("--prefix="));
  const verbose = args.includes("--verbose");
  const prefix = prefixArg ? prefixArg.split("=")[1] : "";

  console.log("\n🗂️  S3 BUCKET CONTENTS");
  console.log("=====================================\n");

  if (prefix) {
    console.log(`📍 Filtering by prefix: "${prefix}"\n`);
  }

  console.log("⏳ Fetching bucket contents...\n");

  const objects = await listAllObjects(prefix);

  if (objects.length === 0) {
    console.log("📭 Bucket is empty (or prefix has no matches)\n");
    return;
  }

  // Calculate totals
  const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0);

  // Count organizations
  const orgs = new Set(
    objects
      .filter(obj => obj.key.startsWith("organizations/"))
      .map(obj => obj.key.split("/")[1])
  );

  // Count platform courses
  const platformCourses = new Set(
    objects
      .filter(obj => obj.key.startsWith("platform/courses/"))
      .map(obj => obj.key.split("/")[2])
  );

  console.log("📊 Summary:");
  console.log(`   Total files: ${objects.length}`);
  console.log(`   Total size: ${formatBytes(totalSize)}`);
  console.log(`   Organizations: ${orgs.size}`);
  console.log(`   Platform courses: ${platformCourses.size}`);
  console.log();

  // Build and print directory tree
  console.log("📁 Directory Structure:");
  console.log();
  const tree = buildDirectoryTree(objects);
  printDirectoryTree(tree, "", "root", verbose);

  // Identify legacy files
  if (!prefix) {
    const legacyFiles = identifyLegacyFiles(objects);
    if (legacyFiles.length > 0) {
      console.log("\n⚠️  Legacy Flat Files (not in hierarchy):");
      legacyFiles.forEach(file => {
        console.log(`   - ${file.key} (${formatBytes(file.size)})`);
      });
      console.log(
        `\n   ${legacyFiles.length} orphaned files - consider cleanup\n`
      );
    }
  }

  if (!verbose && objects.length > 20) {
    console.log("\n💡 Tip: Use --verbose to see individual file names\n");
  }
}

main()
  .then(() => {
    console.log("✅ Inspection complete\n");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Inspection failed:", error);
    process.exit(1);
  });
