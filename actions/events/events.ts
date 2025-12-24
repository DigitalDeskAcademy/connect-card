"use server";

import arcjet, { fixedWindow } from "@arcjet/next";
import { revalidatePath } from "next/cache";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import type { EventStatus } from "@/lib/generated/prisma";
import {
  cancelEventSchema,
  deleteEventSchema,
  eventSchema,
  publishEventSchema,
  updateEventSchema,
} from "@/lib/zodSchemas";

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
      max: 20, // Allow 20 event operations per minute
    }),
  ],
});

// =============================================================================
// Types
// =============================================================================

export type ApiResponse<T = void> =
  | { status: "success"; message: string; data?: T }
  | { status: "error"; message: string };

// =============================================================================
// CREATE EVENT
// =============================================================================

/**
 * Create a new volunteer event with sessions.
 *
 * Creates the event in DRAFT status by default. The event must have at least
 * one session. All sessions are created atomically with the event.
 *
 * @param slug - Church slug for multi-tenant routing
 * @param formData - Event data matching eventSchema (name, description, sessions, etc.)
 * @returns ApiResponse with the created event ID on success
 */
export async function createEvent(
  slug: string,
  formData: unknown
): Promise<ApiResponse<{ eventId: string }>> {
  // 1. Auth - verify user has access to this church
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit - prevent abuse
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_create_event`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  // 3. Validate input data against Zod schema
  const validation = eventSchema.safeParse(formData);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return {
      status: "error",
      message: firstError?.message ?? "Invalid event data",
    };
  }

  const data = validation.data;

  try {
    // 4. Create event with sessions in a transaction
    const event = await prisma.$transaction(async tx => {
      // Create the event
      const newEvent = await tx.volunteerEvent.create({
        data: {
          organizationId: organization.id,
          name: data.name,
          description: data.description ?? null,
          eventType: data.eventType,
          locationId: data.locationId ?? null,
          category: data.category ?? null,
          leaderId: data.leaderId,
          status: "DRAFT" as EventStatus,
          requiresBackgroundCheck: data.requiresBackgroundCheck,
          volunteerPoolScope: data.volunteerPoolScope,
          inviteMessage: data.inviteMessage ?? null,
          confirmationMessage: data.confirmationMessage ?? null,
          // Create sessions inline
          sessions: {
            create: data.sessions.map(session => ({
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
              slotsNeeded: session.slotsNeeded,
              slotsFilled: 0,
            })),
          },
        },
        select: { id: true },
      });

      return newEvent;
    });

    // 5. Revalidate the events list page cache
    revalidatePath(`/church/${slug}/admin/volunteer/events`);

    return {
      status: "success",
      message: "Event created successfully",
      data: { eventId: event.id },
    };
  } catch (error) {
    // Log error for debugging (no PII)
    console.error(
      "[createEvent] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to create event. Please try again.",
    };
  }
}

// =============================================================================
// UPDATE EVENT
// =============================================================================

/**
 * Update an existing volunteer event and its sessions.
 *
 * Sessions are handled with a delete-and-recreate approach for simplicity.
 * Only events in DRAFT status can have their sessions modified. Published
 * events can only update basic fields (name, description, messages).
 *
 * @param slug - Church slug for multi-tenant routing
 * @param formData - Update data matching updateEventSchema
 * @returns ApiResponse on success or error
 */
export async function updateEvent(
  slug: string,
  formData: unknown
): Promise<ApiResponse> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_update_event`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  // 3. Validate
  const validation = updateEventSchema.safeParse(formData);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return {
      status: "error",
      message: firstError?.message ?? "Invalid event data",
    };
  }

  const { id, sessions, ...updateData } = validation.data;

  try {
    // 4. Verify event exists and belongs to this organization
    const existingEvent = await prisma.volunteerEvent.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      select: { id: true, status: true },
    });

    if (!existingEvent) {
      return { status: "error", message: "Event not found" };
    }

    // 5. Update event in a transaction
    await prisma.$transaction(async tx => {
      // Update the event fields
      await tx.volunteerEvent.update({
        where: { id },
        data: {
          ...(updateData.name !== undefined && { name: updateData.name }),
          ...(updateData.description !== undefined && {
            description: updateData.description,
          }),
          ...(updateData.eventType !== undefined && {
            eventType: updateData.eventType,
          }),
          ...(updateData.locationId !== undefined && {
            locationId: updateData.locationId,
          }),
          ...(updateData.category !== undefined && {
            category: updateData.category,
          }),
          ...(updateData.leaderId !== undefined && {
            leaderId: updateData.leaderId,
          }),
          ...(updateData.requiresBackgroundCheck !== undefined && {
            requiresBackgroundCheck: updateData.requiresBackgroundCheck,
          }),
          ...(updateData.volunteerPoolScope !== undefined && {
            volunteerPoolScope: updateData.volunteerPoolScope,
          }),
          ...(updateData.inviteMessage !== undefined && {
            inviteMessage: updateData.inviteMessage,
          }),
          ...(updateData.confirmationMessage !== undefined && {
            confirmationMessage: updateData.confirmationMessage,
          }),
        },
      });

      // If sessions are provided and event is still in DRAFT, replace them
      if (sessions && sessions.length > 0 && existingEvent.status === "DRAFT") {
        // Delete existing sessions (cascade deletes assignments too)
        await tx.eventSession.deleteMany({
          where: { eventId: id },
        });

        // Create new sessions
        await tx.eventSession.createMany({
          data: sessions.map(s => ({
            eventId: id,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            slotsNeeded: s.slotsNeeded,
            slotsFilled: 0,
          })),
        });
      }
    });

    // 6. Revalidate cache
    revalidatePath(`/church/${slug}/admin/volunteer/events`);
    revalidatePath(`/church/${slug}/admin/volunteer/events/${id}`);

    return { status: "success", message: "Event updated successfully" };
  } catch (error) {
    console.error(
      "[updateEvent] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to update event. Please try again.",
    };
  }
}

// =============================================================================
// PUBLISH EVENT
// =============================================================================

/**
 * Publish a draft event, making it visible for volunteer assignment.
 *
 * Only DRAFT events can be published. Once published, sessions cannot be
 * deleted (only modified or added).
 *
 * @param slug - Church slug for multi-tenant routing
 * @param formData - Object with event id
 * @returns ApiResponse on success or error
 */
export async function publishEvent(
  slug: string,
  formData: unknown
): Promise<ApiResponse> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_publish_event`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  // 3. Validate
  const validation = publishEventSchema.safeParse(formData);
  if (!validation.success) {
    return { status: "error", message: "Invalid event ID" };
  }

  const { id } = validation.data;

  try {
    // 4. Verify event exists, is in DRAFT status, and belongs to this org
    const event = await prisma.volunteerEvent.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      select: { id: true, status: true, sessions: { select: { id: true } } },
    });

    if (!event) {
      return { status: "error", message: "Event not found" };
    }

    if (event.status !== "DRAFT") {
      return { status: "error", message: "Only draft events can be published" };
    }

    if (event.sessions.length === 0) {
      return {
        status: "error",
        message: "Event must have at least one session to publish",
      };
    }

    // 5. Update status to PUBLISHED
    await prisma.volunteerEvent.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    // 6. Revalidate cache
    revalidatePath(`/church/${slug}/admin/volunteer/events`);
    revalidatePath(`/church/${slug}/admin/volunteer/events/${id}`);

    return { status: "success", message: "Event published successfully" };
  } catch (error) {
    console.error(
      "[publishEvent] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to publish event. Please try again.",
    };
  }
}

// =============================================================================
// CANCEL EVENT
// =============================================================================

/**
 * Cancel a volunteer event.
 *
 * Cancelled events are kept for historical records but are no longer active.
 * Optionally notifies assigned volunteers via SMS/email.
 *
 * @param slug - Church slug for multi-tenant routing
 * @param formData - Object with event id and optional notifyVolunteers flag
 * @returns ApiResponse on success or error
 */
export async function cancelEvent(
  slug: string,
  formData: unknown
): Promise<ApiResponse> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_cancel_event`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  // 3. Validate
  const validation = cancelEventSchema.safeParse(formData);
  if (!validation.success) {
    return { status: "error", message: "Invalid request data" };
  }

  const { id, notifyVolunteers } = validation.data;

  try {
    // 4. Verify event exists and belongs to this org
    const event = await prisma.volunteerEvent.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      select: {
        id: true,
        status: true,
        name: true,
        sessions: {
          select: {
            assignments: {
              where: {
                status: { in: ["CONFIRMED", "ASSIGNED", "INVITED"] },
              },
              select: {
                volunteer: {
                  select: {
                    churchMember: {
                      select: { name: true, phone: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return { status: "error", message: "Event not found" };
    }

    if (event.status === "CANCELLED") {
      return { status: "error", message: "Event is already cancelled" };
    }

    if (event.status === "COMPLETED") {
      return { status: "error", message: "Cannot cancel a completed event" };
    }

    // 5. Update status to CANCELLED
    await prisma.volunteerEvent.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // 6. TODO: If notifyVolunteers is true, send cancellation notifications
    // This will be implemented in Phase 3 (GHL SMS Automation)
    if (notifyVolunteers) {
      // Future: Send SMS/email to assigned volunteers
      // const volunteers = event.sessions.flatMap(s => s.assignments);
      // await notifyVolunteersOfCancellation(volunteers, event.name);
    }

    // 7. Revalidate cache
    revalidatePath(`/church/${slug}/admin/volunteer/events`);
    revalidatePath(`/church/${slug}/admin/volunteer/events/${id}`);

    return { status: "success", message: "Event cancelled successfully" };
  } catch (error) {
    console.error(
      "[cancelEvent] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to cancel event. Please try again.",
    };
  }
}

// =============================================================================
// DELETE EVENT
// =============================================================================

/**
 * Delete a volunteer event.
 *
 * Only DRAFT or CANCELLED events can be deleted. Events with assignments
 * are archived (status = ARCHIVED) instead of hard deleted to preserve
 * volunteer history.
 *
 * @param slug - Church slug for multi-tenant routing
 * @param formData - Object with event id
 * @returns ApiResponse on success or error
 */
export async function deleteEvent(
  slug: string,
  formData: unknown
): Promise<ApiResponse> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_delete_event`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  // 3. Validate
  const validation = deleteEventSchema.safeParse(formData);
  if (!validation.success) {
    return { status: "error", message: "Invalid event ID" };
  }

  const { id } = validation.data;

  try {
    // 4. Verify event exists and belongs to this org
    const event = await prisma.volunteerEvent.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
      select: {
        id: true,
        status: true,
        sessions: {
          select: {
            _count: { select: { assignments: true } },
          },
        },
      },
    });

    if (!event) {
      return { status: "error", message: "Event not found" };
    }

    // Only allow deletion of DRAFT or CANCELLED events
    if (!["DRAFT", "CANCELLED"].includes(event.status)) {
      return {
        status: "error",
        message:
          "Only draft or cancelled events can be deleted. Consider cancelling first.",
      };
    }

    // Check if event has any assignments
    const hasAssignments = event.sessions.some(s => s._count.assignments > 0);

    if (hasAssignments) {
      // Archive instead of delete to preserve volunteer history
      await prisma.volunteerEvent.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      revalidatePath(`/church/${slug}/admin/volunteer/events`);

      return {
        status: "success",
        message: "Event archived (has volunteer history)",
      };
    }

    // 5. Hard delete if no assignments exist
    await prisma.$transaction(async tx => {
      // Delete sessions first (cascade doesn't apply to deleteMany)
      await tx.eventSession.deleteMany({
        where: { eventId: id },
      });

      // Delete the event
      await tx.volunteerEvent.delete({
        where: { id },
      });
    });

    // 6. Revalidate cache
    revalidatePath(`/church/${slug}/admin/volunteer/events`);

    return { status: "success", message: "Event deleted successfully" };
  } catch (error) {
    console.error(
      "[deleteEvent] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to delete event. Please try again.",
    };
  }
}
