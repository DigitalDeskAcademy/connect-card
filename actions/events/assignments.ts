"use server";

import arcjet, { fixedWindow } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import { prisma } from "@/lib/db";
import { isGHLConfigured } from "@/lib/ghl/client";
import { syncContactToGHL } from "@/lib/ghl/contacts";
import { sendSMS, smsTemplates } from "@/lib/ghl/messages";

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
      max: 30, // Allow 30 assignment operations per minute
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
// ASSIGN VOLUNTEER
// =============================================================================

/**
 * Directly assign a volunteer to an event session.
 *
 * Creates an assignment with ASSIGNED status (no SMS invite).
 * Also increments the session's slotsFilled counter.
 *
 * @param slug - Church slug for multi-tenant routing
 * @param sessionId - Session to assign to
 * @param volunteerId - Volunteer to assign
 * @returns ApiResponse with assignment ID on success
 */
export async function assignVolunteer(
  slug: string,
  sessionId: string,
  volunteerId: string
): Promise<ApiResponse<{ assignmentId: string }>> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_assign_volunteer`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  try {
    // 3. Verify session belongs to this organization
    const eventSession = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        event: {
          organizationId: organization.id,
          status: { in: ["PUBLISHED", "IN_PROGRESS"] },
        },
      },
      include: {
        event: { select: { id: true, name: true } },
      },
    });

    if (!eventSession) {
      return {
        status: "error",
        message: "Session not found or event not active",
      };
    }

    // 4. Verify volunteer belongs to this organization and is active
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        id: volunteerId,
        organizationId: organization.id,
        status: "ACTIVE",
      },
      include: {
        churchMember: { select: { name: true } },
      },
    });

    if (!volunteer) {
      return { status: "error", message: "Volunteer not found or not active" };
    }

    // 5. Check if already assigned
    const existingAssignment = await prisma.eventAssignment.findUnique({
      where: {
        sessionId_volunteerId: { sessionId, volunteerId },
      },
    });

    if (existingAssignment) {
      return {
        status: "error",
        message: "Volunteer is already assigned to this session",
      };
    }

    // 6. Create assignment and update slot count in transaction
    const assignment = await prisma.$transaction(async tx => {
      const newAssignment = await tx.eventAssignment.create({
        data: {
          sessionId,
          volunteerId,
          status: "ASSIGNED",
        },
      });

      // Increment slotsFilled
      await tx.eventSession.update({
        where: { id: sessionId },
        data: { slotsFilled: { increment: 1 } },
      });

      return newAssignment;
    });

    // 7. Revalidate cache
    revalidatePath(
      `/church/${slug}/admin/volunteer/events/${eventSession.event.id}`
    );

    return {
      status: "success",
      message: `${volunteer.churchMember?.name || "Volunteer"} assigned successfully`,
      data: { assignmentId: assignment.id },
    };
  } catch (error) {
    console.error(
      "[assignVolunteer] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to assign volunteer. Please try again.",
    };
  }
}

// =============================================================================
// REMOVE ASSIGNMENT
// =============================================================================

/**
 * Remove a volunteer assignment from a session.
 *
 * Also decrements the session's slotsFilled counter.
 *
 * @param slug - Church slug for multi-tenant routing
 * @param assignmentId - Assignment to remove
 * @returns ApiResponse on success
 */
export async function removeAssignment(
  slug: string,
  assignmentId: string
): Promise<ApiResponse> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_remove_assignment`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  try {
    // 3. Verify assignment exists and belongs to this organization
    const assignment = await prisma.eventAssignment.findFirst({
      where: {
        id: assignmentId,
        session: {
          event: {
            organizationId: organization.id,
          },
        },
      },
      include: {
        session: {
          include: {
            event: { select: { id: true } },
          },
        },
        volunteer: {
          include: {
            churchMember: { select: { name: true } },
          },
        },
      },
    });

    if (!assignment) {
      return { status: "error", message: "Assignment not found" };
    }

    // 4. Delete assignment and update slot count in transaction
    await prisma.$transaction(async tx => {
      await tx.eventAssignment.delete({
        where: { id: assignmentId },
      });

      // Decrement slotsFilled (minimum 0)
      await tx.eventSession.update({
        where: { id: assignment.sessionId },
        data: {
          slotsFilled: {
            decrement: 1,
          },
        },
      });
    });

    // 5. Revalidate cache
    revalidatePath(
      `/church/${slug}/admin/volunteer/events/${assignment.session.event.id}`
    );

    return {
      status: "success",
      message: `${assignment.volunteer?.churchMember?.name || "Volunteer"} removed from session`,
    };
  } catch (error) {
    console.error(
      "[removeAssignment] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to remove assignment. Please try again.",
    };
  }
}

// =============================================================================
// BULK ASSIGN (for invite modal)
// =============================================================================

/**
 * Assign multiple volunteers to a session at once.
 *
 * @param slug - Church slug
 * @param sessionId - Session to assign to
 * @param volunteerIds - Array of volunteer IDs
 * @returns ApiResponse with counts
 */
export async function bulkAssignVolunteers(
  slug: string,
  sessionId: string,
  volunteerIds: string[]
): Promise<ApiResponse<{ assigned: number; failed: number }>> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_bulk_assign`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  if (volunteerIds.length === 0) {
    return { status: "error", message: "No volunteers selected" };
  }

  if (volunteerIds.length > 20) {
    return {
      status: "error",
      message: "Maximum 20 volunteers can be assigned at once",
    };
  }

  try {
    // 3. Verify session
    const eventSession = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        event: {
          organizationId: organization.id,
          status: { in: ["PUBLISHED", "IN_PROGRESS"] },
        },
      },
      include: {
        event: { select: { id: true } },
        assignments: { select: { volunteerId: true } },
      },
    });

    if (!eventSession) {
      return {
        status: "error",
        message: "Session not found or event not active",
      };
    }

    // 4. Filter out already assigned volunteers
    const alreadyAssigned = new Set(
      eventSession.assignments.map(a => a.volunteerId)
    );
    const newVolunteerIds = volunteerIds.filter(id => !alreadyAssigned.has(id));

    if (newVolunteerIds.length === 0) {
      return {
        status: "error",
        message: "All selected volunteers are already assigned",
      };
    }

    // 5. Verify all volunteers are active and belong to org
    const validVolunteers = await prisma.volunteer.findMany({
      where: {
        id: { in: newVolunteerIds },
        organizationId: organization.id,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const validIds = new Set(validVolunteers.map(v => v.id));
    const toAssign = newVolunteerIds.filter(id => validIds.has(id));

    if (toAssign.length === 0) {
      return { status: "error", message: "No valid volunteers to assign" };
    }

    // 6. Create assignments in transaction
    await prisma.$transaction(async tx => {
      await tx.eventAssignment.createMany({
        data: toAssign.map(volunteerId => ({
          sessionId,
          volunteerId,
          status: "ASSIGNED" as const,
        })),
        skipDuplicates: true,
      });

      await tx.eventSession.update({
        where: { id: sessionId },
        data: { slotsFilled: { increment: toAssign.length } },
      });
    });

    // 7. Revalidate
    revalidatePath(
      `/church/${slug}/admin/volunteer/events/${eventSession.event.id}`
    );

    const failed = newVolunteerIds.length - toAssign.length;
    return {
      status: "success",
      message: `${toAssign.length} volunteer(s) assigned${failed > 0 ? `, ${failed} skipped` : ""}`,
      data: { assigned: toAssign.length, failed },
    };
  } catch (error) {
    console.error(
      "[bulkAssignVolunteers] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to assign volunteers. Please try again.",
    };
  }
}

// =============================================================================
// INVITE VOLUNTEERS (SMS outreach)
// =============================================================================

/**
 * Send SMS invites to volunteers for an event session.
 *
 * Creates assignments with INVITED status and sends SMS via GHL.
 * Uses the eventInvitation template with event/session details.
 *
 * @param slug - Church slug for multi-tenant routing
 * @param sessionId - Session to invite volunteers to
 * @param volunteerIds - Array of volunteer IDs to invite
 * @returns ApiResponse with invite counts
 */
export async function inviteVolunteersToSession(
  slug: string,
  sessionId: string,
  volunteerIds: string[]
): Promise<
  ApiResponse<{ invited: number; failed: number; smsSkipped: number }>
> {
  // 1. Auth
  const { organization, session } = await requireDashboardAccess(slug);

  // 2. Rate limit (stricter for SMS)
  const decision = await aj.protect({} as Request, {
    fingerprint: `${session.user.id}_${organization.id}_invite_volunteers`,
  });
  if (decision.isDenied()) {
    return {
      status: "error",
      message: "Too many requests. Please wait a moment.",
    };
  }

  if (volunteerIds.length === 0) {
    return { status: "error", message: "No volunteers selected" };
  }

  if (volunteerIds.length > 20) {
    return {
      status: "error",
      message: "Maximum 20 volunteers can be invited at once",
    };
  }

  // Check if GHL is configured
  if (!isGHLConfigured()) {
    return {
      status: "error",
      message: "SMS integration not configured. Please set up GHL in settings.",
    };
  }

  try {
    // 3. Verify session and get event details for SMS template
    const eventSession = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        event: {
          organizationId: organization.id,
          status: { in: ["PUBLISHED", "IN_PROGRESS"] },
        },
      },
      include: {
        event: { select: { id: true, name: true } },
        assignments: { select: { volunteerId: true } },
      },
    });

    if (!eventSession) {
      return {
        status: "error",
        message: "Session not found or event not active",
      };
    }

    // 4. Filter out already assigned/invited volunteers
    const alreadyAssigned = new Set(
      eventSession.assignments.map(a => a.volunteerId)
    );
    const newVolunteerIds = volunteerIds.filter(id => !alreadyAssigned.has(id));

    if (newVolunteerIds.length === 0) {
      return {
        status: "error",
        message: "All selected volunteers are already assigned or invited",
      };
    }

    // 5. Get volunteer details with contact info for SMS
    const volunteers = await prisma.volunteer.findMany({
      where: {
        id: { in: newVolunteerIds },
        organizationId: organization.id,
        status: "ACTIVE",
      },
      include: {
        churchMember: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (volunteers.length === 0) {
      return { status: "error", message: "No valid volunteers to invite" };
    }

    // 6. Format date for SMS
    const eventDate =
      format(eventSession.date, "EEE, MMM d") +
      " at " +
      format(eventSession.startTime, "h:mm a");

    // 7. Create assignments and send SMS for each volunteer
    const results = {
      invited: 0,
      failed: 0,
      smsSkipped: 0,
    };

    const now = new Date();

    for (const volunteer of volunteers) {
      try {
        const member = volunteer.churchMember;
        const firstName = member?.name?.split(" ")[0] || "there";

        // Create assignment with INVITED status
        await prisma.$transaction(async tx => {
          await tx.eventAssignment.create({
            data: {
              sessionId,
              volunteerId: volunteer.id,
              status: "INVITED",
              invitedAt: now,
            },
          });

          await tx.eventSession.update({
            where: { id: sessionId },
            data: { slotsFilled: { increment: 1 } },
          });
        });

        results.invited++;

        // Send SMS if volunteer has phone
        if (member?.phone) {
          // First sync contact to GHL (creates or updates)
          const syncResult = await syncContactToGHL(organization.id, {
            name: member.name || undefined,
            email: member.email || undefined,
            phone: member.phone,
          });

          if (syncResult.success && syncResult.ghlContactId) {
            // Send invite SMS
            const message = smsTemplates.eventInvitation({
              firstName,
              eventName: eventSession.event.name,
              eventDate,
            });

            await sendSMS(organization.id, {
              contactId: syncResult.ghlContactId,
              message,
            });
          } else {
            results.smsSkipped++;
          }
        } else {
          results.smsSkipped++;
        }
      } catch (err) {
        console.error(
          `[inviteVolunteersToSession] Failed for volunteer ${volunteer.id}:`,
          err instanceof Error ? err.message : "Unknown error"
        );
        results.failed++;
      }
    }

    // 8. Revalidate
    revalidatePath(
      `/church/${slug}/admin/volunteer/events/${eventSession.event.id}`
    );

    // Build summary message
    let message = `${results.invited} volunteer(s) invited`;
    if (results.smsSkipped > 0) {
      message += ` (${results.smsSkipped} without phone)`;
    }
    if (results.failed > 0) {
      message += `, ${results.failed} failed`;
    }

    return {
      status: "success",
      message,
      data: results,
    };
  } catch (error) {
    console.error(
      "[inviteVolunteersToSession] Failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      status: "error",
      message: "Failed to invite volunteers. Please try again.",
    };
  }
}
