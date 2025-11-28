/**
 * Volunteer Document Upload API - Presigned URL Generation
 *
 * Generates presigned URLs for volunteer document uploads (PDFs, etc.)
 * Uses organization-scoped paths for multi-tenant isolation.
 *
 * Path structure:
 *   organizations/{org-slug}/volunteer-documents/{scope}/{filename}
 *
 * Security:
 * - Requires dashboard access (admin role)
 * - Rate limited: 5 requests per minute per user
 * - 6-minute URL expiration
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";

// Rate limiting: 5 uploads per minute
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

// Request validation schema
const uploadRequestSchema = z.object({
  fileName: z.string().min(1, "Filename is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z
    .number()
    .min(1, "Size is required")
    .max(10 * 1024 * 1024, "File too large (max 10MB)"),
  organizationSlug: z.string().min(1, "Organization slug is required"),
  scope: z.enum(["global", "ministry"]),
  category: z.string().optional(),
});

/**
 * Generate secure random ID for file uniqueness
 */
const generateSecureId = (length: number = 8): string => {
  return randomBytes(Math.ceil((length * 3) / 4))
    .toString("base64url")
    .substring(0, length);
};

/**
 * Validate origin for CORS
 */
function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const allowedPatterns = [
    /^http:\/\/localhost:\d+$/,
    /^https:\/\/.*\.vercel\.app$/,
  ];

  const productionDomains = env.S3_UPLOAD_ALLOWED_DOMAINS?.split(",") || [];
  productionDomains.forEach(domain => {
    const trimmedDomain = domain.trim();
    if (trimmedDomain) {
      const escapedDomain = trimmedDomain.replace(/\./g, "\\.");
      allowedPatterns.push(new RegExp(`^https://${escapedDomain}$`));
    }
  });

  return allowedPatterns.some(pattern => pattern.test(origin));
}

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const isAllowed = validateOrigin(origin);

  if (!isAllowed) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "3600",
    },
  });
}

/**
 * POST - Generate presigned URL for volunteer document upload
 */
export async function POST(request: Request) {
  // Validate origin
  const origin = request.headers.get("origin");
  if (!validateOrigin(origin)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { fileName, contentType, size, organizationSlug, scope, category } =
      validation.data;

    // Authenticate and authorize via dashboard access
    // This also validates the organization slug
    let session, organization;
    try {
      const access = await requireDashboardAccess(organizationSlug);
      session = access.session;
      organization = access.organization;

      // Check admin permissions
      if (!access.dataScope.filters.canManageUsers) {
        return NextResponse.json(
          { error: "You don't have permission to upload documents" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limiting
    const decision = await aj.protect(request, {
      fingerprint: `${session.user.id}_${organization.id}_volunteer_doc_upload`,
    });

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many upload requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    // Validate file type (PDFs and common document types)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PDF, Word documents, JPEG, PNG",
        },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "pdf";
    const timestamp = Date.now();
    const secureId = generateSecureId(8);
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 50);

    let uniqueKey: string;
    if (scope === "ministry" && category) {
      // Ministry-specific document
      const categorySlug = category.toLowerCase().replace(/_/g, "-");
      uniqueKey = `organizations/${organizationSlug}/volunteer-documents/ministry/${categorySlug}/${sanitizedFileName}-${timestamp}-${secureId}.${fileExtension}`;
    } else {
      // Global document
      uniqueKey = `organizations/${organizationSlug}/volunteer-documents/global/${sanitizedFileName}-${timestamp}-${secureId}.${fileExtension}`;
    }

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: contentType,
      ContentLength: size,
      Key: uniqueKey,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // 6 minutes
    });

    // Construct the final file URL
    const fileUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${uniqueKey}`;

    return NextResponse.json(
      {
        presignedUrl,
        key: uniqueKey,
        fileUrl,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": origin!,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
