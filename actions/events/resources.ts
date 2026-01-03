"use server";

import arcjet, { fixedWindow } from "@arcjet/next";
import { revalidatePath } from "next/cache";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import type { ResourceStatus } from "@/lib/generated/prisma";
import { z } from "zod";

// =============================================================================
// Rate Limiting Configuration
// =============================================================================

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["fingerprint"],
  rules: [
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 30, // Allow 30 resource operations per minute
    }),
  ],
});

// =============================================================================
// Types
// =============================================================================

type ApiResponse<T = void> =
  | { status: "success"; message: string; data?: T }
  | { status: "error"; message: string };

// =============================================================================
// Validation Schemas
// =============================================================================

const addResourceSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Resource name is required").max(100),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  notes: z.string().max(500).optional(),
  isCommon: z.boolean().default(false),
});

const updateResourceStatusSchema = z.object({
  resourceId: z.string().cuid(),
  status: z.enum(["NEEDED", "CONFIRMED", "READY"]),
});

const updateResourceSchema = z.object({
  resourceId: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  quantity: z.number().int().min(1).optional(),
  notes: z.string().max(500).nullable().optional(),
});

const deleteResourceSchema = z.object({
  resourceId: z.string().cuid(),
});

const addCommonResourcesSchema = z.object({
  eventId: z.string().cuid(),
  resources: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().int().min(1),
    })
  ),
});

// =============================================================================
// ADD RESOURCE
// =============================================================================

/**
 * Add a new resource to an event.
 *
 * @param slug - Church slug for multi-tenant routing
 * @param formData - Resource data (name, quantity, notes, isCommon)
 */
export async function addResource(
  slug: string,
  formData: unknown
): Promise<ApiResponse<{ resourceId: string }>> {
  const { organization, session } = await requireDashboardAccess(slug);

  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_add_resource`,
  });
  if (decision.isDenied()) {
    return { status: "error", message: "Too many requests. Please wait." };
  }

  const validation = addResourceSchema.safeParse(formData);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  const data = validation.data;

  try {
    // Verify event belongs to this organization
    const event = await prisma.volunteerEvent.findFirst({
      where: {
        id: data.eventId,
        organizationId: organization.id,
      },
    });

    if (!event) {
      return { status: "error", message: "Event not found" };
    }

    // Get max sort order
    const lastResource = await prisma.eventResource.findFirst({
      where: { eventId: data.eventId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const resource = await prisma.eventResource.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        quantity: data.quantity,
        notes: data.notes ?? null,
        isCommon: data.isCommon,
        status: "NEEDED",
        sortOrder: (lastResource?.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath(`/church/${slug}/admin/volunteer/events/${data.eventId}`);

    return {
      status: "success",
      message: "Resource added",
      data: { resourceId: resource.id },
    };
  } catch (error) {
    console.error("[addResource] Error:", error);
    return { status: "error", message: "Failed to add resource" };
  }
}

// =============================================================================
// ADD COMMON RESOURCES (BULK)
// =============================================================================

/**
 * Add multiple common resources to an event at once.
 */
export async function addCommonResources(
  slug: string,
  formData: unknown
): Promise<ApiResponse<{ count: number }>> {
  const { organization, session } = await requireDashboardAccess(slug);

  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_add_common_resources`,
  });
  if (decision.isDenied()) {
    return { status: "error", message: "Too many requests. Please wait." };
  }

  const validation = addCommonResourcesSchema.safeParse(formData);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  const data = validation.data;

  try {
    const event = await prisma.volunteerEvent.findFirst({
      where: {
        id: data.eventId,
        organizationId: organization.id,
      },
    });

    if (!event) {
      return { status: "error", message: "Event not found" };
    }

    // Get max sort order
    const lastResource = await prisma.eventResource.findFirst({
      where: { eventId: data.eventId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    let sortOrder = (lastResource?.sortOrder ?? 0) + 1;

    // Create all resources
    const createData = data.resources.map(r => ({
      eventId: data.eventId,
      name: r.name,
      quantity: r.quantity,
      isCommon: true,
      status: "NEEDED" as ResourceStatus,
      sortOrder: sortOrder++,
    }));

    await prisma.eventResource.createMany({ data: createData });

    revalidatePath(`/church/${slug}/admin/volunteer/events/${data.eventId}`);

    return {
      status: "success",
      message: `Added ${data.resources.length} resources`,
      data: { count: data.resources.length },
    };
  } catch (error) {
    console.error("[addCommonResources] Error:", error);
    return { status: "error", message: "Failed to add resources" };
  }
}

// =============================================================================
// UPDATE RESOURCE STATUS
// =============================================================================

/**
 * Update a resource's status (NEEDED → CONFIRMED → READY).
 */
export async function updateResourceStatus(
  slug: string,
  formData: unknown
): Promise<ApiResponse> {
  const { organization, session } = await requireDashboardAccess(slug);

  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_update_resource_status`,
  });
  if (decision.isDenied()) {
    return { status: "error", message: "Too many requests. Please wait." };
  }

  const validation = updateResourceStatusSchema.safeParse(formData);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  const data = validation.data;

  try {
    // Verify resource belongs to this organization's event
    const resource = await prisma.eventResource.findFirst({
      where: {
        id: data.resourceId,
        event: { organizationId: organization.id },
      },
      include: { event: { select: { id: true } } },
    });

    if (!resource) {
      return { status: "error", message: "Resource not found" };
    }

    await prisma.eventResource.update({
      where: { id: data.resourceId },
      data: {
        status: data.status,
        statusUpdatedAt: new Date(),
      },
    });

    revalidatePath(
      `/church/${slug}/admin/volunteer/events/${resource.event.id}`
    );

    return { status: "success", message: `Status updated to ${data.status}` };
  } catch (error) {
    console.error("[updateResourceStatus] Error:", error);
    return { status: "error", message: "Failed to update status" };
  }
}

// =============================================================================
// UPDATE RESOURCE
// =============================================================================

/**
 * Update a resource's details (name, quantity, notes).
 */
export async function updateResource(
  slug: string,
  formData: unknown
): Promise<ApiResponse> {
  const { organization, session } = await requireDashboardAccess(slug);

  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_update_resource`,
  });
  if (decision.isDenied()) {
    return { status: "error", message: "Too many requests. Please wait." };
  }

  const validation = updateResourceSchema.safeParse(formData);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  const data = validation.data;

  try {
    const resource = await prisma.eventResource.findFirst({
      where: {
        id: data.resourceId,
        event: { organizationId: organization.id },
      },
      include: { event: { select: { id: true } } },
    });

    if (!resource) {
      return { status: "error", message: "Resource not found" };
    }

    await prisma.eventResource.update({
      where: { id: data.resourceId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.quantity && { quantity: data.quantity }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    revalidatePath(
      `/church/${slug}/admin/volunteer/events/${resource.event.id}`
    );

    return { status: "success", message: "Resource updated" };
  } catch (error) {
    console.error("[updateResource] Error:", error);
    return { status: "error", message: "Failed to update resource" };
  }
}

// =============================================================================
// DELETE RESOURCE
// =============================================================================

/**
 * Delete a resource from an event.
 */
export async function deleteResource(
  slug: string,
  formData: unknown
): Promise<ApiResponse> {
  const { organization, session } = await requireDashboardAccess(slug);

  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_delete_resource`,
  });
  if (decision.isDenied()) {
    return { status: "error", message: "Too many requests. Please wait." };
  }

  const validation = deleteResourceSchema.safeParse(formData);
  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.errors[0]?.message ?? "Invalid data",
    };
  }

  try {
    const resource = await prisma.eventResource.findFirst({
      where: {
        id: validation.data.resourceId,
        event: { organizationId: organization.id },
      },
      include: { event: { select: { id: true } } },
    });

    if (!resource) {
      return { status: "error", message: "Resource not found" };
    }

    await prisma.eventResource.delete({
      where: { id: validation.data.resourceId },
    });

    revalidatePath(
      `/church/${slug}/admin/volunteer/events/${resource.event.id}`
    );

    return { status: "success", message: "Resource deleted" };
  } catch (error) {
    console.error("[deleteResource] Error:", error);
    return { status: "error", message: "Failed to delete resource" };
  }
}
