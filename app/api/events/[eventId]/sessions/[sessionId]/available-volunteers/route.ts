import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAvailableVolunteersForSession } from "@/lib/data/events";

/**
 * GET /api/events/[eventId]/sessions/[sessionId]/available-volunteers
 *
 * Returns available volunteers for a session, filtered by event requirements.
 * Used by the Assign Modal to populate the volunteer list.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; sessionId: string }> }
) {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, sessionId } = await params;

    // 2. Get event to verify access and get organizationId
    const event = await prisma.volunteerEvent.findFirst({
      where: {
        id: eventId,
        organization: {
          users: {
            some: {
              id: session.user.id,
            },
          },
        },
      },
      select: {
        organizationId: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    // 3. Get available volunteers
    const volunteers = await getAvailableVolunteersForSession(
      event.organizationId,
      sessionId,
      eventId
    );

    return NextResponse.json({ volunteers });
  } catch (error) {
    console.error("[available-volunteers] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
