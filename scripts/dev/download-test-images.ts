/**
 * Download connect card images from S3 for local testing
 *
 * Downloads matched front/back pairs using database records.
 *
 * Usage:
 *   npx tsx scripts/dev/download-test-images.ts [org-slug] [count]
 *
 * Examples:
 *   npx tsx scripts/dev/download-test-images.ts newlife 5
 *   npx tsx scripts/dev/download-test-images.ts              # defaults: newlife, 5
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "../../lib/generated/prisma";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function downloadFromS3(
  key: string,
  outputPath: string
): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    const data = await s3.send(command);

    if (data.Body) {
      const bodyContents = await data.Body.transformToByteArray();
      fs.writeFileSync(outputPath, Buffer.from(bodyContents));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function downloadTestImages(orgSlug: string, count: number) {
  const outputDir = path.join(process.cwd(), "test-images");

  console.log("=== DOWNLOAD TEST IMAGES (WITH PAIRS) ===");
  console.log("Organization:", orgSlug);
  console.log("Count:", count);
  console.log("Output:", outputDir);
  console.log("");

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Get organization
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!org) {
      console.log(`Organization "${orgSlug}" not found`);
      return;
    }

    // Fetch cards with both front and back images
    const cards = await prisma.connectCard.findMany({
      where: {
        organizationId: org.id,
        imageKey: { not: "" },
      },
      select: {
        id: true,
        imageKey: true,
        backImageKey: true,
        name: true,
        scannedAt: true,
      },
      orderBy: { scannedAt: "desc" },
      take: count,
    });

    console.log(`Found ${cards.length} cards in database\n`);

    if (cards.length === 0) {
      console.log("No cards found for this organization");
      return;
    }

    // Download each card's images
    let downloadedPairs = 0;

    for (const card of cards) {
      const cardName = card.name || card.id.slice(0, 8);
      const dateStr = card.scannedAt.toISOString().split("T")[0];
      const baseFileName = `${dateStr}_${cardName.replace(/[^a-zA-Z0-9]/g, "-")}`;

      // Download front
      const frontExt = card.imageKey.split(".").pop() || "jpg";
      const frontPath = path.join(
        outputDir,
        `${baseFileName}_front.${frontExt}`
      );

      const frontOk = await downloadFromS3(card.imageKey, frontPath);
      if (frontOk) {
        const size = Math.round(fs.statSync(frontPath).size / 1024);
        console.log(`✓ ${baseFileName}_front.${frontExt} (${size}KB)`);
      } else {
        console.log(`✗ ${baseFileName}_front - download failed`);
        continue;
      }

      // Download back if exists
      if (card.backImageKey) {
        const backExt = card.backImageKey.split(".").pop() || "jpg";
        const backPath = path.join(
          outputDir,
          `${baseFileName}_back.${backExt}`
        );

        const backOk = await downloadFromS3(card.backImageKey, backPath);
        if (backOk) {
          const size = Math.round(fs.statSync(backPath).size / 1024);
          console.log(`✓ ${baseFileName}_back.${backExt} (${size}KB)`);
        } else {
          console.log(`  (no back image)`);
        }
      } else {
        console.log(`  (single-sided)`);
      }

      downloadedPairs++;
      console.log("");
    }

    console.log(`=== DONE ===`);
    console.log(`Downloaded ${downloadedPairs} card(s) to ${outputDir}`);
    console.log(
      `\nFiles are named: {date}_{name}_front.{ext} and {date}_{name}_back.{ext}`
    );
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse args
const orgSlug = process.argv[2] || "newlife";
const count = parseInt(process.argv[3] || "5", 10);

downloadTestImages(orgSlug, count);
