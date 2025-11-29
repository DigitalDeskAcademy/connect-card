"use server";

/**
 * Volunteer Onboarding Server Actions
 *
 * Handles document management, ministry requirements, and background check
 * configuration for the volunteer onboarding system.
 *
 * Security:
 * - All actions require dashboard access (multi-tenant isolation)
 * - Admin permissions required for write operations
 * - Rate limiting via Arcjet
 */

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import {
  DocumentScope,
  VolunteerCategoryType,
  BGCheckProvider,
  BGCheckPayment,
} from "@/lib/generated/prisma";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";
import { env } from "@/lib/env";

// Rate limiting: 10 requests per minute
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const volunteerDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileSize: z.number().min(1, "File size is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  scope: z.nativeEnum(DocumentScope),
  category: z.nativeEnum(VolunteerCategoryType).optional(),
  description: z.string().optional(),
});

const ministryRequirementsSchema = z.object({
  category: z.nativeEnum(VolunteerCategoryType),
  backgroundCheckRequired: z.boolean(),
  backgroundCheckValidMonths: z.number().min(1).max(120).optional(),
  trainingRequired: z.boolean(),
  trainingDescription: z.string().optional(),
  trainingUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const backgroundCheckConfigSchema = z.object({
  provider: z.nativeEnum(BGCheckProvider),
  providerAccountId: z.string().optional(),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  validityMonths: z.number().min(1).max(120).default(24),
  paymentModel: z.nativeEnum(BGCheckPayment).default("CHURCH_PAID"),
  reminderDays: z.array(z.number()).default([30, 7]),
  instructions: z.string().optional(),
  isEnabled: z.boolean().default(false),
});

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

/**
 * Create Volunteer Document Record
 *
 * Records a document that has already been uploaded to S3.
 * Called after successful presigned URL upload.
 */
export async function createVolunteerDocument(
  slug: string,
  data: z.infer<typeof volunteerDocumentSchema>
): Promise<ApiResponse<{ documentId: string }>> {
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to upload documents",
    };
  }

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_create_doc`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait before trying again.",
    };
  }

  const validation = volunteerDocumentSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message || "Invalid document data",
    };
  }

  const {
    name,
    fileName,
    fileUrl,
    fileSize,
    mimeType,
    scope,
    category,
    description,
  } = validation.data;

  // Validate that MINISTRY_SPECIFIC scope has a category
  if (scope === "MINISTRY_SPECIFIC" && !category) {
    return {
      status: "error",
      message: "Ministry category is required for ministry-specific documents",
    };
  }

  try {
    const document = await prisma.volunteerDocument.create({
      data: {
        organizationId: organization.id,
        name,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        scope,
        category: scope === "MINISTRY_SPECIFIC" ? category : null,
        description,
        uploadedBy: session.user.id,
      },
    });

    revalidatePath(`/church/${slug}/admin/settings/volunteer-onboarding`);

    return {
      status: "success",
      message: "Document uploaded successfully",
      data: { documentId: document.id },
    };
  } catch (error) {
    console.error("Failed to create volunteer document:", error);
    return {
      status: "error",
      message: "Failed to save document record",
    };
  }
}

/**
 * Delete Volunteer Document
 *
 * Removes document from S3 and database.
 */
export async function deleteVolunteerDocument(
  slug: string,
  documentId: string
): Promise<ApiResponse<void>> {
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to delete documents",
    };
  }

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_delete_doc`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait before trying again.",
    };
  }

  try {
    // Fetch document to get S3 key
    const document = await prisma.volunteerDocument.findFirst({
      where: {
        id: documentId,
        organizationId: organization.id,
      },
    });

    if (!document) {
      return {
        status: "error",
        message: "Document not found",
      };
    }

    // Extract S3 key from URL
    // URL format: https://bucket.s3.region.amazonaws.com/key or similar
    const url = new URL(document.fileUrl);
    const key = url.pathname.startsWith("/")
      ? url.pathname.slice(1)
      : url.pathname;

    // Delete from S3
    try {
      await S3.send(
        new DeleteObjectCommand({
          Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
          Key: key,
        })
      );
    } catch (s3Error) {
      console.error("Failed to delete from S3:", s3Error);
      // Continue with database deletion even if S3 fails
      // Document may have already been deleted from S3
    }

    // Delete from database
    await prisma.volunteerDocument.delete({
      where: { id: documentId },
    });

    revalidatePath(`/church/${slug}/admin/settings/volunteer-onboarding`);

    return {
      status: "success",
      message: "Document deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete volunteer document:", error);
    return {
      status: "error",
      message: "Failed to delete document",
    };
  }
}

/**
 * Get Volunteer Documents
 *
 * Fetches all documents for an organization.
 */
export async function getVolunteerDocuments(slug: string): Promise<
  ApiResponse<{
    documents: Array<{
      id: string;
      name: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      scope: DocumentScope;
      category: VolunteerCategoryType | null;
      description: string | null;
      uploadedAt: Date;
      deliveryCount: number;
    }>;
  }>
> {
  const { organization } = await requireDashboardAccess(slug);

  try {
    const documents = await prisma.volunteerDocument.findMany({
      where: { organizationId: organization.id },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }],
    });

    return {
      status: "success",
      message: "Documents retrieved",
      data: {
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          scope: doc.scope,
          category: doc.category,
          description: doc.description,
          uploadedAt: doc.uploadedAt,
          deliveryCount: doc._count.deliveries,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to fetch volunteer documents:", error);
    return {
      status: "error",
      message: "Failed to fetch documents",
    };
  }
}

// ============================================================================
// MINISTRY REQUIREMENTS
// ============================================================================

/**
 * Upsert Ministry Requirements
 *
 * Creates or updates requirements for a ministry category.
 */
export async function upsertMinistryRequirements(
  slug: string,
  data: z.infer<typeof ministryRequirementsSchema>
): Promise<ApiResponse<{ requirementsId: string }>> {
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage ministry requirements",
    };
  }

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_upsert_requirements`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait before trying again.",
    };
  }

  const validation = ministryRequirementsSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message:
        validation.error.errors[0]?.message || "Invalid requirements data",
    };
  }

  const {
    category,
    backgroundCheckRequired,
    backgroundCheckValidMonths,
    trainingRequired,
    trainingDescription,
    trainingUrl,
    isActive,
    sortOrder,
  } = validation.data;

  try {
    const requirements = await prisma.ministryRequirements.upsert({
      where: {
        organizationId_category: {
          organizationId: organization.id,
          category,
        },
      },
      create: {
        organizationId: organization.id,
        category,
        backgroundCheckRequired,
        backgroundCheckValidMonths,
        trainingRequired,
        trainingDescription,
        trainingUrl: trainingUrl || null,
        isActive,
        sortOrder,
      },
      update: {
        backgroundCheckRequired,
        backgroundCheckValidMonths,
        trainingRequired,
        trainingDescription,
        trainingUrl: trainingUrl || null,
        isActive,
        sortOrder,
      },
    });

    revalidatePath(`/church/${slug}/admin/settings/volunteer-onboarding`);

    return {
      status: "success",
      message: "Ministry requirements saved",
      data: { requirementsId: requirements.id },
    };
  } catch (error) {
    console.error("Failed to save ministry requirements:", error);
    return {
      status: "error",
      message: "Failed to save requirements",
    };
  }
}

/**
 * Get Ministry Requirements
 *
 * Fetches all ministry requirements for an organization.
 */
export async function getMinistryRequirements(slug: string): Promise<
  ApiResponse<{
    requirements: Array<{
      id: string;
      category: VolunteerCategoryType;
      backgroundCheckRequired: boolean;
      backgroundCheckValidMonths: number | null;
      trainingRequired: boolean;
      trainingDescription: string | null;
      trainingUrl: string | null;
      isActive: boolean;
      sortOrder: number;
    }>;
  }>
> {
  const { organization } = await requireDashboardAccess(slug);

  try {
    const requirements = await prisma.ministryRequirements.findMany({
      where: { organizationId: organization.id },
      orderBy: { sortOrder: "asc" },
    });

    return {
      status: "success",
      message: "Requirements retrieved",
      data: {
        requirements: requirements.map(req => ({
          id: req.id,
          category: req.category,
          backgroundCheckRequired: req.backgroundCheckRequired,
          backgroundCheckValidMonths: req.backgroundCheckValidMonths,
          trainingRequired: req.trainingRequired,
          trainingDescription: req.trainingDescription,
          trainingUrl: req.trainingUrl,
          isActive: req.isActive,
          sortOrder: req.sortOrder,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to fetch ministry requirements:", error);
    return {
      status: "error",
      message: "Failed to fetch requirements",
    };
  }
}

// ============================================================================
// BACKGROUND CHECK CONFIGURATION
// ============================================================================

/**
 * Upsert Background Check Config
 *
 * Creates or updates the organization's background check configuration.
 */
export async function upsertBackgroundCheckConfig(
  slug: string,
  data: z.infer<typeof backgroundCheckConfigSchema>
): Promise<ApiResponse<{ configId: string }>> {
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  if (!dataScope.filters.canManageUsers) {
    return {
      status: "error",
      message: "You don't have permission to manage background check settings",
    };
  }

  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_upsert_bg_config`,
  });

  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait before trying again.",
    };
  }

  const validation = backgroundCheckConfigSchema.safeParse(data);
  if (!validation.success) {
    return {
      status: "error",
      message:
        validation.error.errors[0]?.message || "Invalid configuration data",
    };
  }

  const {
    provider,
    providerAccountId,
    applicationUrl,
    validityMonths,
    paymentModel,
    reminderDays,
    instructions,
    isEnabled,
  } = validation.data;

  try {
    const config = await prisma.backgroundCheckConfig.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        provider,
        providerAccountId,
        applicationUrl: applicationUrl || null,
        validityMonths,
        paymentModel,
        reminderDays,
        instructions,
        isEnabled,
      },
      update: {
        provider,
        providerAccountId,
        applicationUrl: applicationUrl || null,
        validityMonths,
        paymentModel,
        reminderDays,
        instructions,
        isEnabled,
      },
    });

    revalidatePath(`/church/${slug}/admin/settings/volunteer-onboarding`);

    return {
      status: "success",
      message: "Background check configuration saved",
      data: { configId: config.id },
    };
  } catch (error) {
    console.error("Failed to save background check config:", error);
    return {
      status: "error",
      message: "Failed to save configuration",
    };
  }
}

/**
 * Get Background Check Config
 *
 * Fetches the organization's background check configuration.
 */
export async function getBackgroundCheckConfig(slug: string): Promise<
  ApiResponse<{
    config: {
      id: string;
      provider: BGCheckProvider;
      providerAccountId: string | null;
      applicationUrl: string | null;
      validityMonths: number;
      paymentModel: BGCheckPayment;
      reminderDays: number[];
      instructions: string | null;
      isEnabled: boolean;
    } | null;
  }>
> {
  const { organization } = await requireDashboardAccess(slug);

  try {
    const config = await prisma.backgroundCheckConfig.findUnique({
      where: { organizationId: organization.id },
    });

    return {
      status: "success",
      message: config ? "Configuration retrieved" : "No configuration found",
      data: {
        config: config
          ? {
              id: config.id,
              provider: config.provider,
              providerAccountId: config.providerAccountId,
              applicationUrl: config.applicationUrl,
              validityMonths: config.validityMonths,
              paymentModel: config.paymentModel,
              reminderDays: config.reminderDays,
              instructions: config.instructions,
              isEnabled: config.isEnabled,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch background check config:", error);
    return {
      status: "error",
      message: "Failed to fetch configuration",
    };
  }
}

// ============================================================================
// COMBINED SETTINGS FETCH
// ============================================================================

/**
 * Get All Onboarding Settings
 *
 * Fetches all volunteer onboarding settings in one request.
 * Used by the settings page to populate all sections.
 */
export async function getOnboardingSettings(slug: string): Promise<
  ApiResponse<{
    documents: Array<{
      id: string;
      name: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      scope: DocumentScope;
      category: VolunteerCategoryType | null;
      description: string | null;
      uploadedAt: Date;
      deliveryCount: number;
    }>;
    requirements: Array<{
      id: string;
      category: VolunteerCategoryType;
      backgroundCheckRequired: boolean;
      backgroundCheckValidMonths: number | null;
      trainingRequired: boolean;
      trainingDescription: string | null;
      trainingUrl: string | null;
      isActive: boolean;
      sortOrder: number;
    }>;
    backgroundCheckConfig: {
      id: string;
      provider: BGCheckProvider;
      providerAccountId: string | null;
      applicationUrl: string | null;
      validityMonths: number;
      paymentModel: BGCheckPayment;
      reminderDays: number[];
      instructions: string | null;
      isEnabled: boolean;
    } | null;
  }>
> {
  const { organization } = await requireDashboardAccess(slug);

  try {
    // Fetch all settings in parallel
    const [documents, requirements, bgConfig] = await Promise.all([
      prisma.volunteerDocument.findMany({
        where: { organizationId: organization.id },
        include: {
          _count: {
            select: { deliveries: true },
          },
        },
        orderBy: [{ scope: "asc" }, { category: "asc" }, { name: "asc" }],
      }),
      prisma.ministryRequirements.findMany({
        where: { organizationId: organization.id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.backgroundCheckConfig.findUnique({
        where: { organizationId: organization.id },
      }),
    ]);

    return {
      status: "success",
      message: "Settings retrieved",
      data: {
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          scope: doc.scope,
          category: doc.category,
          description: doc.description,
          uploadedAt: doc.uploadedAt,
          deliveryCount: doc._count.deliveries,
        })),
        requirements: requirements.map(req => ({
          id: req.id,
          category: req.category,
          backgroundCheckRequired: req.backgroundCheckRequired,
          backgroundCheckValidMonths: req.backgroundCheckValidMonths,
          trainingRequired: req.trainingRequired,
          trainingDescription: req.trainingDescription,
          trainingUrl: req.trainingUrl,
          isActive: req.isActive,
          sortOrder: req.sortOrder,
        })),
        backgroundCheckConfig: bgConfig
          ? {
              id: bgConfig.id,
              provider: bgConfig.provider,
              providerAccountId: bgConfig.providerAccountId,
              applicationUrl: bgConfig.applicationUrl,
              validityMonths: bgConfig.validityMonths,
              paymentModel: bgConfig.paymentModel,
              reminderDays: bgConfig.reminderDays,
              instructions: bgConfig.instructions,
              isEnabled: bgConfig.isEnabled,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch onboarding settings:", error);
    return {
      status: "error",
      message: "Failed to fetch settings",
    };
  }
}
