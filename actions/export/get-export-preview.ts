"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import { DataExportFormat, Prisma } from "@/lib/generated/prisma";
import {
  ExportFilters,
  ExportPreview,
  ExportWarning,
  getFormatHeaders,
  getPreviewRows,
} from "@/lib/export";

/**
 * Get Export Preview
 *
 * Fetches a preview of records that will be exported based on filters.
 * Returns sample records and validation warnings for UI display.
 *
 * Security:
 * - Requires dashboard access (church_owner or church_admin)
 * - Multi-tenant data isolation via organizationId
 *
 * @param slug - Organization slug for multi-tenant context
 * @param format - Export format for column preview
 * @param filters - Filter options (location, date range, onlyNew)
 * @returns ExportPreview with total count, sample records, and warnings
 */
export async function getExportPreview(
  slug: string,
  format: DataExportFormat,
  filters: ExportFilters = {}
): Promise<{
  success: boolean;
  data?: {
    totalCount: number;
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
      // Only export processed cards (EXTRACTED, REVIEWED, or PROCESSED status)
      status: {
        in: ["EXTRACTED", "REVIEWED", "PROCESSED"],
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

    // 4. Get total count
    const totalCount = await prisma.connectCard.count({ where });

    // 5. Get sample records for preview (first 5)
    const sampleRecords = await prisma.connectCard.findMany({
      where,
      include: {
        location: {
          select: { name: true },
        },
      },
      orderBy: { scannedAt: "desc" },
      take: 5,
    });

    // 6. Generate validation warnings
    const warnings: ExportWarning[] = [];

    // Count records with missing emails
    const missingEmailCount = await prisma.connectCard.count({
      where: {
        ...where,
        OR: [{ email: null }, { email: "" }],
      },
    });
    if (missingEmailCount > 0) {
      warnings.push({
        type: "missing_email",
        count: missingEmailCount,
        message: `${missingEmailCount} record${missingEmailCount === 1 ? "" : "s"} missing email address`,
      });
    }

    // Count records with missing phone
    const missingPhoneCount = await prisma.connectCard.count({
      where: {
        ...where,
        OR: [{ phone: null }, { phone: "" }],
      },
    });
    if (missingPhoneCount > 0) {
      warnings.push({
        type: "missing_phone",
        count: missingPhoneCount,
        message: `${missingPhoneCount} record${missingPhoneCount === 1 ? "" : "s"} missing phone number`,
      });
    }

    // Count records with missing name
    const missingNameCount = await prisma.connectCard.count({
      where: {
        ...where,
        OR: [{ name: null }, { name: "" }],
      },
    });
    if (missingNameCount > 0) {
      warnings.push({
        type: "missing_name",
        count: missingNameCount,
        message: `${missingNameCount} record${missingNameCount === 1 ? "" : "s"} missing name`,
      });
    }

    // 7. Generate preview data
    const headers = getFormatHeaders(format);
    const sampleRows = getPreviewRows(sampleRecords, format, 5);

    return {
      success: true,
      data: {
        totalCount,
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
