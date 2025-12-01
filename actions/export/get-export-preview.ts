"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import { DataExportFormat, Prisma } from "@/lib/generated/prisma";
import {
  ExportFilters,
  ExportWarning,
  getFormatHeaders,
  getPreviewRows,
  ExportableConnectCard,
} from "@/lib/export";

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
    } else {
      // Keep the most recent card (cards are already sorted by scannedAt desc)
      // So the first one we encounter is the most recent
      // Already have the most recent, skip this one
    }
  }

  // Return deduped cards (email-based) + cards without email
  return [...emailMap.values(), ...noEmailCards];
}

/**
 * Get Export Preview
 *
 * Fetches all records that will be exported based on filters.
 * Deduplicates by email (keeping most recent) and returns all unique records.
 *
 * Security:
 * - Requires dashboard access (church_owner or church_admin)
 * - Multi-tenant data isolation via organizationId
 *
 * @param slug - Organization slug for multi-tenant context
 * @param format - Export format for column preview
 * @param filters - Filter options (location, date range, onlyNew)
 * @returns ExportPreview with unique count, all records, and warnings
 */
export async function getExportPreview(
  slug: string,
  format: DataExportFormat,
  filters: ExportFilters = {}
): Promise<{
  success: boolean;
  data?: {
    totalCount: number;
    uniqueCount: number;
    duplicatesSkipped: number;
    headers: string[];
    sampleRows: string[][];
    warnings: ExportWarning[];
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

    // 3. Build filter conditions
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

    // 4. Fetch ALL matching records (sorted by most recent first)
    const allRecords = await prisma.connectCard.findMany({
      where,
      include: {
        location: {
          select: { name: true },
        },
      },
      orderBy: { scannedAt: "desc" },
    });

    const totalCount = allRecords.length;

    // 5. Deduplicate by email (keep most recent per email)
    const uniqueRecords = deduplicateByEmail(allRecords);
    const uniqueCount = uniqueRecords.length;
    const duplicatesSkipped = totalCount - uniqueCount;

    // 6. Generate info messages
    const warnings: ExportWarning[] = [];

    // Notify about duplicates skipped
    if (duplicatesSkipped > 0) {
      warnings.push({
        type: "duplicates_skipped",
        count: duplicatesSkipped,
        message: `${duplicatesSkipped} duplicate${duplicatesSkipped === 1 ? "" : "s"} skipped (same email, kept most recent)`,
      });
    }

    // 7. Generate preview data (all unique records, no limit)
    const headers = getFormatHeaders(format);
    const sampleRows = getPreviewRows(
      uniqueRecords,
      format,
      uniqueRecords.length
    );

    return {
      success: true,
      data: {
        totalCount,
        uniqueCount,
        duplicatesSkipped,
        headers,
        sampleRows,
        warnings,
      },
    };
  } catch (error) {
    console.error("Export preview error:", error);
    return {
      success: false,
      error: "Failed to generate export preview",
    };
  }
}
