"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import { DataExportFormat, Prisma } from "@/lib/generated/prisma";
import {
  ExportFilters,
  generateCSV,
  generateExportFilename,
  getCSVByteSize,
  ExportableConnectCard,
} from "@/lib/export";
import { S3 } from "@/lib/S3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

/**
 * Rate limiter for exports
 * 10 exports per hour per user to prevent abuse
 */
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1h",
    max: 10,
  })
);

/**
 * Deduplicate cards by email, keeping the most recent card per email.
 * Cards without email are kept as-is (cannot dedupe without identifier).
 */
function deduplicateByEmail(
  cards: ExportableConnectCard[]
): ExportableConnectCard[] {
  const emailMap = new Map<string, ExportableConnectCard>();
  const noEmailCards: ExportableConnectCard[] = [];

  for (const card of cards) {
    const email = card.email?.toLowerCase().trim();

    if (!email) {
      // Keep cards without email (can't dedupe)
      noEmailCards.push(card);
      continue;
    }

    const existing = emailMap.get(email);
    if (!existing) {
      emailMap.set(email, card);
    }
    // If existing, skip this one (first encountered is most recent due to sort order)
  }

  // Return deduped cards (email-based) + cards without email
  return [...emailMap.values(), ...noEmailCards];
}

/**
 * Create Export
 *
 * Generates a CSV export of connect cards, uploads to S3, and tracks in database.
 * Deduplicates by email (keeping most recent) before export.
 * Marks exported records with timestamp for "not yet exported" filtering.
 *
 * Security:
 * - Requires dashboard access (church_owner or church_admin)
 * - Multi-tenant data isolation via organizationId
 * - Rate limited to 10 exports per hour per user
 *
 * @param slug - Organization slug for multi-tenant context
 * @param format - Export format (PLANNING_CENTER_CSV, BREEZE_CSV, GENERIC_CSV)
 * @param filters - Filter options (location, date range, onlyNew)
 * @returns Export record with download URL
 */
export async function createExport(
  slug: string,
  format: DataExportFormat,
  filters: ExportFilters = {}
): Promise<{
  success: boolean;
  data?: {
    exportId: string;
    fileName: string;
    recordCount: number;
    uniqueCount: number;
    duplicatesSkipped: number;
    fileKey: string;
  };
  error?: string;
}> {
  try {
    // 1. Authentication and authorization
    const { organization, session } = await requireDashboardAccess(slug);

    // 2. Check user has export permission (owner or admin only)
    const allowedRoles = ["church_owner", "church_admin"];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return {
        success: false,
        error: "You do not have permission to export data",
      };
    }

    // 3. Rate limiting
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: `${session.user.id}_${organization.id}_export`,
    });

    if (decision.isDenied()) {
      return {
        success: false,
        error: "Export rate limit exceeded. Please try again later.",
      };
    }

    // 4. Build filter conditions
    const where: Prisma.ConnectCardWhereInput = {
      organizationId: organization.id,
      // Only export verified cards (REVIEWED or PROCESSED status)
      // EXTRACTED cards have not been human reviewed and may contain errors/duplicates
      status: {
        in: ["REVIEWED", "PROCESSED"],
      },
    };

    // Location filter
    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.scannedAt = {};
      if (filters.dateFrom) {
        where.scannedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.scannedAt.lte = filters.dateTo;
      }
    }

    // Only new (not yet exported) filter
    if (filters.onlyNew) {
      where.lastExportedAt = null;
    }

    // 5. Fetch all matching records (sorted by most recent first)
    const allCards = await prisma.connectCard.findMany({
      where,
      include: {
        location: {
          select: { name: true },
        },
      },
      orderBy: { scannedAt: "desc" },
    });

    if (allCards.length === 0) {
      return {
        success: false,
        error: "No records match your filter criteria",
      };
    }

    // 6. Deduplicate by email (keep most recent per email)
    const uniqueCards = deduplicateByEmail(allCards);
    const duplicatesSkipped = allCards.length - uniqueCards.length;

    // 7. Generate CSV content (from unique cards only)
    const csvContent = generateCSV(uniqueCards, format);
    const fileName = generateExportFilename(format);
    const fileSizeBytes = getCSVByteSize(csvContent);

    // 8. Upload to S3
    const fileKey = `exports/${organization.slug}/${fileName}`;
    const csvBuffer = Buffer.from(csvContent, "utf-8");

    await S3.send(
      new PutObjectCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Key: fileKey,
        Body: csvBuffer,
        ContentType: "text/csv",
        ContentLength: fileSizeBytes,
        // Set cache control for reasonable retention
        CacheControl: "max-age=2592000", // 30 days
      })
    );

    // 9. Create export record in database
    const exportRecord = await prisma.dataExport.create({
      data: {
        organizationId: organization.id,
        format,
        filters: filters as Prisma.InputJsonValue,
        recordCount: uniqueCards.length, // Count unique cards, not total
        fileName,
        fileKey,
        fileSizeBytes,
        exportedBy: session.user.id,
      },
    });

    // 10. Update lastExportedAt on ALL exported cards (including duplicates)
    // This ensures duplicates won't appear in future "not yet exported" queries
    const allCardIds = allCards.map(card => card.id);
    const formatName = format.toLowerCase().replace("_csv", "");

    await prisma.connectCard.updateMany({
      where: {
        id: { in: allCardIds },
        organizationId: organization.id, // Multi-tenant security
      },
      data: {
        lastExportedAt: new Date(),
        lastExportedBy: session.user.id,
        lastExportFormat: formatName,
      },
    });

    return {
      success: true,
      data: {
        exportId: exportRecord.id,
        fileName,
        recordCount: allCards.length,
        uniqueCount: uniqueCards.length,
        duplicatesSkipped,
        fileKey,
      },
    };
  } catch (error) {
    console.error("Export creation error:", error);
    return {
      success: false,
      error: "Failed to create export",
    };
  }
}
