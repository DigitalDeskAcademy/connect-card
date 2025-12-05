/**
 * S3 View API - Generate Signed URLs for Viewing Images
 *
 * Generates presigned GET URLs for viewing S3 objects.
 * Used for viewing connect card images and other uploaded files.
 *
 * Security:
 * - Requires authentication
 * - Organization isolation via key prefix validation
 * - Rate limited to prevent abuse
 */

import { env } from "@/lib/env";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 100, // Allow viewing many images quickly
  })
);

/**
 * GET /api/s3/view?key={imageKey}
 *
 * Returns a signed URL for viewing the specified S3 object.
 * Validates that the user has access to the organization's files.
 */
export async function GET(request: NextRequest) {
  // 1. Authentication check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // 2. Rate limiting
  const decision = await aj.protect(request, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Rate limited - please slow down" },
      { status: 429 }
    );
  }

  // 3. Get the image key from query params
  const { searchParams } = new URL(request.url);
  const imageKey = searchParams.get("key");

  if (!imageKey) {
    return NextResponse.json(
      { error: "Image key is required" },
      { status: 400 }
    );
  }

  // 4. Get user's organization for access validation
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      organization: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!user?.organization) {
    return NextResponse.json(
      { error: "User not associated with an organization" },
      { status: 403 }
    );
  }

  // 5. Validate access - user can only view their organization's files
  // Check if the key belongs to their organization or is a general upload
  const orgPrefix = `organizations/${user.organization.slug}/`;
  const isOrgFile = imageKey.startsWith(orgPrefix);
  const isGeneralUpload = imageKey.startsWith("uploads/general/");

  // For now, allow access to org files and general uploads (legacy)
  // TODO: Migrate all files to org-scoped paths and remove general access
  if (!isOrgFile && !isGeneralUpload) {
    // Also check if it's a connect card from the database
    const card = await prisma.connectCard.findFirst({
      where: {
        organizationId: user.organization.id,
        OR: [{ imageKey }, { backImageKey: imageKey }],
      },
      select: { id: true },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Access denied - file not found in your organization" },
        { status: 403 }
      );
    }
  }

  try {
    // 6. Generate signed URL
    const command = new GetObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: imageKey,
    });

    const signedUrl = await getSignedUrl(S3, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      url: signedUrl,
      key: imageKey,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("[S3 View] Failed to generate signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate image URL" },
      { status: 500 }
    );
  }
}
