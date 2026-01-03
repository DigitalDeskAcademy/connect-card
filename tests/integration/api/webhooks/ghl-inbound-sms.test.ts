/**
 * GHL Inbound SMS Webhook Integration Tests
 *
 * INTEGRATION TEST vs UNIT TEST:
 * ==============================
 * Unit tests (what we did for sms-parsing.ts):
 * - Test ONE function in complete isolation
 * - No mocking needed because functions are "pure"
 * - Super fast (milliseconds)
 *
 * Integration tests (this file):
 * - Test MULTIPLE components working together
 * - Mock external dependencies (database, APIs)
 * - Verify the "glue code" between components works
 * - Slower but still fast (hundreds of milliseconds)
 *
 * WHY MOCK THE DATABASE?
 * ======================
 * 1. Speed: Real DB queries are slow (100ms+), mocks are instant
 * 2. Isolation: Tests don't affect each other or real data
 * 3. Control: We can simulate any scenario (not found, errors, etc.)
 * 4. CI/CD: No database needed in GitHub Actions
 *
 * WHAT WE'RE TESTING HERE:
 * ========================
 * The webhook receives SMS replies from GHL and needs to:
 * 1. Parse the YES/NO response (unit tested separately)
 * 2. Look up the volunteer via GHL contact ID
 * 3. Find their pending invitation
 * 4. Update assignment status
 * 5. Send confirmation SMS
 *
 * We mock Prisma and the SMS service, then verify the workflow.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ============================================================================
// MOCKING EXPLAINED
// ============================================================================
// vi.mock() tells Vitest: "When any code imports this module, give them
// our fake version instead of the real one."
//
// This is CRITICAL for integration tests because:
// - We don't want real database calls
// - We don't want real SMS messages sent
// - We want to control what the "database" returns
// ============================================================================

// Mock the Prisma client (database)
// Note: We use relative paths because Vitest's path alias resolution
// can be inconsistent. This is a known pattern in Next.js + Vitest projects.
vi.mock("../../../../lib/db", () => ({
  prisma: {
    memberIntegration: {
      findUnique: vi.fn(),
    },
    eventAssignment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    eventSession: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock the SMS sending service
vi.mock("../../../../lib/ghl/messages", () => ({
  sendSMS: vi.fn().mockResolvedValue({ success: true }),
  smsTemplates: {
    eventConfirmation: vi.fn().mockReturnValue("You're confirmed!"),
  },
}));

// ============================================================================
// TEST SETUP
// ============================================================================

// Import the mocked modules so we can configure them per test
import { prisma } from "../../../../lib/db";
import { sendSMS } from "../../../../lib/ghl/messages";

// Import the actual handler we're testing
// Note: We import AFTER mocking so the handler gets our mocked dependencies
import { POST } from "../../../../app/api/webhooks/ghl/inbound-sms/route";

// Helper to create a mock NextRequest (simulating what GHL sends us)
function createMockRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3003/api/webhooks/ghl/inbound-sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================
// These create realistic test data. Using factories keeps tests DRY and
// makes it clear what data each test needs.

const mockMemberIntegration = {
  id: "mi-123",
  provider: "ghl",
  externalId: "ghl-contact-456",
  churchMemberId: "member-789",
  churchMember: {
    id: "member-789",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+15551234567",
    volunteer: {
      id: "vol-111",
      status: "ACTIVE",
    },
  },
};

const mockPendingAssignment = {
  id: "assign-222",
  volunteerId: "vol-111",
  sessionId: "session-333",
  status: "INVITED",
  invitedAt: new Date(),
  session: {
    id: "session-333",
    date: new Date("2025-01-15"),
    startTime: new Date("2025-01-15T09:00:00"),
    event: {
      id: "event-444",
      name: "Sunday Kids Check-in",
      organizationId: "org-555",
      confirmationMessage: null,
      leader: {
        name: "Pastor Mike",
        email: "mike@church.com",
      },
    },
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe("GHL Inbound SMS Webhook", () => {
  // Reset all mocks before each test
  // This ensures tests don't affect each other
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test Group 1: Input Validation
  // -------------------------------------------------------------------------
  describe("input validation", () => {
    it("should return 400 when contactId is missing", async () => {
      // Arrange: Create request without contactId
      const request = createMockRequest({ message: "YES" });

      // Act: Call the webhook handler
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify the response
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Missing contactId");
    });

    it("should return 200 with 'ignored' when message is empty", async () => {
      // Empty messages shouldn't cause errors, just be ignored
      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Empty message ignored");
    });
  });

  // -------------------------------------------------------------------------
  // Test Group 2: Unrecognized Responses
  // -------------------------------------------------------------------------
  describe("unrecognized responses", () => {
    it("should ignore non-YES/NO messages", async () => {
      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "What time does it start?",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe("ignored");
      expect(data.message).toContain("Unrecognized response");

      // Verify NO database calls were made
      expect(prisma.memberIntegration.findUnique).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Test Group 3: Volunteer Not Found Scenarios
  // -------------------------------------------------------------------------
  describe("volunteer lookup", () => {
    it("should handle unknown GHL contact gracefully", async () => {
      // Configure mock: No member found for this contact ID
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(null);

      const request = createMockRequest({
        contactId: "unknown-contact",
        message: "YES",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe("no_member");
      expect(data.message).toBe("Contact not found in system");
    });

    it("should handle member without volunteer profile", async () => {
      // Configure mock: Member exists but has no volunteer profile
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue({
        ...mockMemberIntegration,
        churchMember: {
          ...mockMemberIntegration.churchMember,
          volunteer: null, // No volunteer profile
        },
      } as never);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "YES",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe("not_volunteer");
    });
  });

  // -------------------------------------------------------------------------
  // Test Group 4: No Pending Invitation
  // -------------------------------------------------------------------------
  describe("pending invitation lookup", () => {
    it("should handle volunteer with no pending invite", async () => {
      // Configure mocks: Volunteer exists but no pending assignment
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(
        mockMemberIntegration as never
      );
      vi.mocked(prisma.eventAssignment.findFirst).mockResolvedValue(null);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "YES",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe("no_invite");
      expect(data.volunteerId).toBe("vol-111");
    });
  });

  // -------------------------------------------------------------------------
  // Test Group 5: YES Response Flow
  // -------------------------------------------------------------------------
  describe("YES response processing", () => {
    it("should confirm volunteer and send SMS on YES response", async () => {
      // Configure mocks: Full happy path
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(
        mockMemberIntegration as never
      );
      vi.mocked(prisma.eventAssignment.findFirst).mockResolvedValue(
        mockPendingAssignment as never
      );
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "YES",
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe("confirmed");
      expect(data.newStatus).toBe("CONFIRMED");

      // Verify database transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify confirmation SMS was sent
      expect(sendSMS).toHaveBeenCalledWith(
        "org-555", // organizationId from event
        expect.objectContaining({
          contactId: "ghl-contact-456",
          message: expect.any(String),
        })
      );
    });

    it("should handle lowercase 'yes' response", async () => {
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(
        mockMemberIntegration as never
      );
      vi.mocked(prisma.eventAssignment.findFirst).mockResolvedValue(
        mockPendingAssignment as never
      );
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "yes", // lowercase
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.action).toBe("confirmed");
    });

    it("should handle 'Y' shorthand response", async () => {
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(
        mockMemberIntegration as never
      );
      vi.mocked(prisma.eventAssignment.findFirst).mockResolvedValue(
        mockPendingAssignment as never
      );
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "Y",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.action).toBe("confirmed");
    });
  });

  // -------------------------------------------------------------------------
  // Test Group 6: NO Response Flow
  // -------------------------------------------------------------------------
  describe("NO response processing", () => {
    it("should decline volunteer and decrement slots on NO response", async () => {
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(
        mockMemberIntegration as never
      );
      vi.mocked(prisma.eventAssignment.findFirst).mockResolvedValue(
        mockPendingAssignment as never
      );
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "NO",
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe("declined");
      expect(data.newStatus).toBe("DECLINED");

      // Verify database transaction was called (to decrement slots)
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify NO confirmation SMS sent for declines
      expect(sendSMS).not.toHaveBeenCalled();
    });

    it("should handle lowercase 'no' response", async () => {
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(
        mockMemberIntegration as never
      );
      vi.mocked(prisma.eventAssignment.findFirst).mockResolvedValue(
        mockPendingAssignment as never
      );
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "no",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.action).toBe("declined");
    });

    it("should handle 'N' shorthand response", async () => {
      vi.mocked(prisma.memberIntegration.findUnique).mockResolvedValue(
        mockMemberIntegration as never
      );
      vi.mocked(prisma.eventAssignment.findFirst).mockResolvedValue(
        mockPendingAssignment as never
      );
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "N",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.action).toBe("declined");
    });
  });

  // -------------------------------------------------------------------------
  // Test Group 7: Error Handling
  // -------------------------------------------------------------------------
  describe("error handling", () => {
    it("should return 500 on database error", async () => {
      // Configure mock: Database throws error
      vi.mocked(prisma.memberIntegration.findUnique).mockRejectedValue(
        new Error("Database connection failed")
      );

      const request = createMockRequest({
        contactId: "ghl-contact-456",
        message: "YES",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Internal server error");
    });
  });
});
