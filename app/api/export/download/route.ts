/**
 * Export Download API - Secure CSV File Downloads
 *
 * Streams CSV export files from S3 to the client with proper authentication
 * and multi-tenant security checks.
 *
 * API Design:
 * - GET /api/export/download?id={exportId}
 * - Authorization: church_owner or church_admin role required
 * - Response: CSV file stream with Content-Disposition header
 *
 * Security Features:
 * - Session-based authentication
 * - Multi-tenant isolation (verifies export belongs to user's organization)
 * - Role-based access control
 * - Tracks download timestamp for audit trail
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { S3 } from "@/lib/S3Client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // 1. Authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Check user has export permission
    const allowedRoles = ["church_owner", "church_admin"];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // 3. Get export ID from query params
    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get("id");

    if (!exportId) {
      return NextResponse.json(
        { error: "Export ID is required" },
        { status: 400 }
      );
    }

    // 4. Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with an organization" },
        { status: 403 }
      );
    }

    // 5. Fetch export record
    const exportRecord = await prisma.dataExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }

    // 6. Multi-tenant security: Verify user belongs to this organization
    if (user.organizationId !== exportRecord.organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 7. Fetch file from S3
    const command = new GetObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: exportRecord.fileKey,
    });

    const s3Response = await S3.send(command);

    if (!s3Response.Body) {
      return NextResponse.json(
        { error: "Export file not found in storage" },
        { status: 404 }
      );
    }

    // 8. Update download timestamp for audit trail
    await prisma.dataExport.update({
      where: { id: exportId },
      data: { downloadedAt: new Date() },
    });

    // 9. Stream the file to client
    const stream = s3Response.Body.transformToWebStream();

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${exportRecord.fileName}"`,
        "Content-Length": exportRecord.fileSizeBytes?.toString() || "",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Export download error:", error);
    return NextResponse.json(
      { error: "Failed to download export" },
      { status: 500 }
    );
  }
}
