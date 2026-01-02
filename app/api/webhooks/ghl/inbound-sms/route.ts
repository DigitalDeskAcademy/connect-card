/**
 * GHL Inbound SMS Webhook
 *
 * Receives inbound SMS messages from GoHighLevel and processes volunteer
 * responses to event invitations.
 *
 * Flow:
 * 1. Receive webhook payload from GHL (contactId, message)
 * 2. Look up volunteer via MemberIntegration (provider="ghl")
 * 3. Find pending INVITED assignment for this volunteer
 * 4. Parse YES/NO response
 * 5. Update assignment status (CONFIRMED/DECLINED)
 * 6. Update session.slotsFilled counts
 * 7. Send confirmation SMS if YES
 *
 * =============================================================================
 * LOCAL DEVELOPMENT SETUP (ngrok)
 * =============================================================================
 *
 * 1. Start the dev server:
 *    pnpm dev  # Runs on port 3003 (volunteer worktree)
 *
 * 2. In a new terminal, start ngrok:
 *    ngrok http 3003
 *
 * 3. Copy the ngrok URL (e.g., https://abc123.ngrok-free.app)
 *
 * 4. Configure GHL webhook:
 *    - Go to GHL > Settings > Webhooks
 *    - Create new webhook or update existing
 *    - URL: https://abc123.ngrok-free.app/api/webhooks/ghl/inbound-sms
 *    - Trigger: Inbound SMS / Conversation Message
 *    - Method: POST
 *
 * 5. Test with curl:
 *    curl -X POST https://abc123.ngrok-free.app/api/webhooks/ghl/inbound-sms \
 *      -H "Content-Type: application/json" \
 *      -d '{"contactId": "test-contact-123", "message": "YES"}'
 *
 * =============================================================================
 * PRODUCTION SETUP
 * =============================================================================
 *
 * - URL: https://your-domain.com/api/webhooks/ghl/inbound-sms
 * - Trigger: Inbound SMS
 * - Method: POST
 *
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSMS, smsTemplates } from "@/lib/ghl/messages";
import { parseResponse } from "@/lib/ghl/sms-parsing";
import { format } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

/**
 * GHL Inbound SMS Webhook Payload
 * Based on GHL webhook documentation for inbound messages
 */
interface GHLInboundSMSPayload {
  /** GHL contact ID who sent the message */
  contactId: string;
  /** The SMS message content */
  message?: string;
  body?: string; // Alternative field name GHL might use
  /** Message timestamp */
  dateAdded?: string;
  timestamp?: string;
  /** GHL location ID */
  locationId?: string;
  /** Phone number the message was sent from */
  phone?: string;
  from?: string;
  /** Conversation ID in GHL */
  conversationId?: string;
  /** Message type */
  type?: string;
  messageType?: string;
}

interface WebhookResponse {
  success: boolean;
  message: string;
  action?: string;
  volunteerId?: string;
  assignmentId?: string;
  newStatus?: string;
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the webhook payload
    const payload: GHLInboundSMSPayload = await request.json();

    // Extract contact ID and message (GHL may use different field names)
    const contactId = payload.contactId;
    const messageText = payload.message || payload.body || "";

    // Validate required fields
    if (!contactId) {
      console.log("[GHL Webhook] Missing contactId in payload");
      return NextResponse.json(
        { success: false, message: "Missing contactId" },
        { status: 400 }
      );
    }

    if (!messageText) {
      console.log("[GHL Webhook] Empty message, ignoring");
      return NextResponse.json({
        success: true,
        message: "Empty message ignored",
      });
    }

    console.log(
      `[GHL Webhook] Received SMS from contact ${contactId}: "${messageText}"`
    );

    // Parse the response
    const parsedResponse = parseResponse(messageText);

    if (!parsedResponse) {
      console.log(`[GHL Webhook] Unrecognized response: "${messageText}"`);
      return NextResponse.json({
        success: true,
        message: "Unrecognized response, no action taken",
        action: "ignored",
      });
    }

    // Look up the church member via MemberIntegration
    const memberIntegration = await prisma.memberIntegration.findUnique({
      where: {
        provider_externalId: {
          provider: "ghl",
          externalId: contactId,
        },
      },
      include: {
        churchMember: {
          include: {
            volunteer: true,
          },
        },
      },
    });

    if (!memberIntegration) {
      console.log(`[GHL Webhook] No member found for GHL contact ${contactId}`);
      return NextResponse.json({
        success: true,
        message: "Contact not found in system",
        action: "no_member",
      });
    }

    const volunteer = memberIntegration.churchMember?.volunteer;
    if (!volunteer) {
      console.log(
        `[GHL Webhook] Member ${memberIntegration.churchMemberId} has no volunteer profile`
      );
      return NextResponse.json({
        success: true,
        message: "Contact is not a volunteer",
        action: "not_volunteer",
      });
    }

    // Find pending INVITED assignment for this volunteer
    // Only process if they have an active invitation
    const pendingAssignment = await prisma.eventAssignment.findFirst({
      where: {
        volunteerId: volunteer.id,
        status: "INVITED",
      },
      include: {
        session: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                organizationId: true,
                confirmationMessage: true,
                leader: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        invitedAt: "desc", // Most recent invite first
      },
    });

    if (!pendingAssignment) {
      console.log(
        `[GHL Webhook] No pending invite for volunteer ${volunteer.id}`
      );
      return NextResponse.json({
        success: true,
        message: "No pending invitation found",
        action: "no_invite",
        volunteerId: volunteer.id,
      });
    }

    const { session } = pendingAssignment;
    const { event } = session;
    const firstName =
      memberIntegration.churchMember?.name?.split(" ")[0] || "there";

    // Process the response
    const now = new Date();
    let responseMessage: WebhookResponse;

    if (parsedResponse === "YES") {
      // Update assignment to CONFIRMED
      await prisma.$transaction(async tx => {
        await tx.eventAssignment.update({
          where: { id: pendingAssignment.id },
          data: {
            status: "CONFIRMED",
            respondedAt: now,
          },
        });

        // slotsFilled was already incremented when invite was sent
        // (INVITED counts toward filled slots)
        // No change needed here
      });

      // Send confirmation SMS
      const eventDate =
        format(session.date, "EEE, MMM d") +
        " at " +
        format(session.startTime, "h:mm a");

      // Use custom confirmation message if set, otherwise use template
      const confirmationText = event.confirmationMessage
        ? event.confirmationMessage
            .replace(/\{\{firstName\}\}/g, firstName)
            .replace(/\{\{eventName\}\}/g, event.name)
            .replace(/\{\{eventDate\}\}/g, eventDate)
            .replace(
              /\{\{leaderName\}\}/g,
              event.leader?.name || "the team leader"
            )
        : smsTemplates.eventConfirmation({
            firstName,
            eventName: event.name,
            eventDate,
            leaderName: event.leader?.name,
          });

      await sendSMS(event.organizationId, {
        contactId,
        message: confirmationText,
      });

      console.log(
        `[GHL Webhook] Volunteer ${volunteer.id} CONFIRMED for event ${event.id}`
      );

      responseMessage = {
        success: true,
        message: "Response processed: CONFIRMED",
        action: "confirmed",
        volunteerId: volunteer.id,
        assignmentId: pendingAssignment.id,
        newStatus: "CONFIRMED",
      };
    } else {
      // parsedResponse === "NO"
      // Update assignment to DECLINED and decrement slotsFilled
      await prisma.$transaction(async tx => {
        await tx.eventAssignment.update({
          where: { id: pendingAssignment.id },
          data: {
            status: "DECLINED",
            respondedAt: now,
          },
        });

        // Decrement slotsFilled since they declined
        // (INVITED counted toward filled slots, now they're declining)
        await tx.eventSession.update({
          where: { id: session.id },
          data: {
            slotsFilled: {
              decrement: 1,
            },
          },
        });
      });

      console.log(
        `[GHL Webhook] Volunteer ${volunteer.id} DECLINED event ${event.id}`
      );

      responseMessage = {
        success: true,
        message: "Response processed: DECLINED",
        action: "declined",
        volunteerId: volunteer.id,
        assignmentId: pendingAssignment.id,
        newStatus: "DECLINED",
      };
    }

    return NextResponse.json(responseMessage);
  } catch (error) {
    console.error(
      "[GHL Webhook] Error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// VERIFICATION ENDPOINT (GET)
// ============================================================================

/**
 * GET handler for webhook verification
 * Some webhook providers send a GET request to verify the endpoint exists
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "ghl-inbound-sms",
    description: "GoHighLevel inbound SMS webhook for event responses",
  });
}
