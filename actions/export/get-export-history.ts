"use server";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import { DataExportFormat } from "@/lib/generated/prisma";

export interface ExportHistoryItem {
  id: string;
  format: DataExportFormat;
  recordCount: number;
  fileName: string;
  fileKey: string;
  exportedAt: Date;
  fileSizeBytes: number | null;
}

/**
 * Get Export History
 *
 * Fetches recent exports for the organization with pagination.
 *
 * Security:
 * - Requires dashboard access (church_owner or church_admin)
 * - Multi-tenant data isolation via organizationId
 *
 * @param slug - Organization slug for multi-tenant context
 * @param limit - Maximum number of records to return (default 10)
 * @param offset - Number of records to skip for pagination (default 0)
 * @returns List of recent exports
 */
export async function getExportHistory(
  slug: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  success: boolean;
  data?: {
    exports: ExportHistoryItem[];
    totalCount: number;
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
        error: "You do not have permission to view export history",
      };
    }

    // 3. Get total count
    const totalCount = await prisma.dataExport.count({
      where: { organizationId: organization.id },
    });

    // 4. Fetch exports with pagination
    const exports = await prisma.dataExport.findMany({
      where: { organizationId: organization.id },
      orderBy: { exportedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        format: true,
        recordCount: true,
        fileName: true,
        fileKey: true,
        exportedAt: true,
        fileSizeBytes: true,
      },
    });

    return {
      success: true,
      data: {
        exports,
        totalCount,
      },
    };
  } catch (error) {
    console.error("Export history error:", error);
    return {
      success: false,
      error: "Failed to fetch export history",
    };
  }
}
