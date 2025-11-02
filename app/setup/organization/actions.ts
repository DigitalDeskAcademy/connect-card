"use server";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { organizationSetupSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

/**
 * Configure Arcjet rate limiting for organization creation
 * Limits: 5 attempts per minute per user
 * Prevents abuse and accidental duplicate submissions
 */
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

/**
 * Generate a URL-safe slug from agency name
 * Security: Sanitizes input to prevent path traversal and injection attacks
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Only alphanumeric and hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
}

/**
 * Server action to create an organization for a new agency
 *
 * This function:
 * 1. Validates the user is authenticated
 * 2. Enforces rate limiting to prevent abuse
 * 3. Validates form data against organization schema
 * 4. Generates a unique slug for the organization
 * 5. Creates organization with trial status
 * 6. Updates user with organizationId and AGENCY_OWNER role
 *
 * @param data - Organization setup form data
 * @returns ApiResponse with success/error status and message
 */
export async function createOrganization(data: {
  name: string;
  agencyName: string;
  website?: string;
  industry: string;
  userId: string;
}): Promise<ApiResponse & { organizationSlug?: string }> {
  // Verify user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.id !== data.userId) {
    return {
      status: "error",
      message: "Unauthorized",
    };
  }

  // Check if user already has an organization (MVP: one admin per org)
  // TODO: Future feature - team invitations for multiple admins
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (existingUser?.organizationId) {
    return {
      status: "error",
      message: "User already belongs to an organization",
    };
  }

  // Set up rate limiting protection
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  // Check if request was denied by rate limiting
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      // Bot detection triggered
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // Validate form data against Zod schema
  const validation = organizationSetupSchema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data",
    };
  }

  try {
    // Generate base slug from agency name
    const baseSlug = generateSlug(validation.data.agencyName);

    // Ensure slug is unique by checking database
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 100) {
        return {
          status: "error",
          message: "Failed to create organization",
        };
      }
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create organization and member in transaction
    let organizationId: string = "";

    // Use transaction to ensure data consistency
    await prisma.$transaction(async tx => {
      // Create the organization
      const organization = await tx.organization.create({
        data: {
          name: validation.data.agencyName,
          slug,
          type: "CHURCH",
          subscriptionStatus: "TRIAL",
          trialEndsAt,
          website: validation.data.website || null,
        },
      });

      // Store organization ID for use after transaction
      organizationId = organization.id;

      // Update user with organization and role
      await tx.user.update({
        where: { id: data.userId },
        data: {
          organizationId: organization.id,
          role: "church_owner",
          name: validation.data.name, // Update the user's actual name
        },
      });

      // Create Member record for Better Auth organization plugin
      // This is required for the organization access control to work
      await tx.member.create({
        data: {
          userId: data.userId,
          organizationId: organization.id,
          role: "owner", // Better Auth uses "owner" for organization owners
          createdAt: new Date(),
        },
      });
    });

    // Set the organization as active in the Better Auth session
    // This is crucial for immediate access without requiring logout/login
    try {
      await auth.api.setActiveOrganization({
        headers: await headers(),
        body: {
          organizationId: organizationId,
        },
      });
    } catch {
      // Silent fail - user can still access after refresh
      // The auth callback will set it on next navigation if needed
    }

    // Revalidate paths for immediate UI updates
    revalidatePath("/");
    revalidatePath(`/church/${slug}/admin`);

    return {
      status: "success",
      message: "Organization created successfully",
      organizationSlug: slug, // Need this for redirect in the form component
    };
  } catch {
    // Generic error handling matching your pattern
    return {
      status: "error",
      message: "Failed to create organization",
    };
  }
}
