/**
 * Extracted Data Schema Validation Tests
 *
 * Tests the Zod schema that validates AI Vision extracted data.
 * This is critical because it's the first line of defense against:
 * - Malformed AI responses
 * - Oversized payloads (storage exhaustion)
 * - Invalid data types
 *
 * The schema is used in:
 * - save-connect-card.ts action
 * - connect card upload flow
 */

import { describe, it, expect } from "vitest";
import { extractedDataSchema } from "../../../../lib/zodSchemas";

// ============================================================================
// VITEST TIP: Testing Zod Schemas
// ============================================================================
//
// Zod schemas have two main methods:
//   - .parse(data)      - Throws error if invalid
//   - .safeParse(data)  - Returns { success, data } or { success: false, error }
//
// For tests, prefer .safeParse() because:
//   - You can test both success and failure cases
//   - No try/catch needed
//   - Access to detailed error information
//
// ============================================================================

describe("extractedDataSchema", () => {
  // Test valid inputs
  describe("valid inputs", () => {
    it("should accept minimal valid data (all nulls)", () => {
      const data = {
        name: null,
        email: null,
        phone: null,
        prayer_request: null,
        visit_status: null,
        first_time_visitor: null,
        interests: null,
        keywords: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept complete valid data", () => {
      const data = {
        name: "John Smith",
        email: "john@example.com",
        phone: "206-555-1234",
        prayer_request: "Please pray for my family",
        visit_status: "First Visit",
        first_time_visitor: true,
        interests: ["Volunteering", "Small Groups"],
        keywords: ["impacted", "next steps"],
        address: "123 Main St, Seattle, WA 98101",
        age_group: "30-40",
        family_info: "Married with 2 kids",
        additional_notes: "Met at coffee oasis event",
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept empty arrays for interests and keywords", () => {
      const data = {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: null,
        prayer_request: null,
        interests: [],
        keywords: [],
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // Test keywords field specifically (PR #80 feature)
  describe("keywords field (PR #80)", () => {
    it("should accept valid keywords array", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: ["impacted", "coffee oasis", "next steps"],
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual([
          "impacted",
          "coffee oasis",
          "next steps",
        ]);
      }
    });

    it("should accept null keywords", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should enforce max 10 keywords", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: [
          "k1",
          "k2",
          "k3",
          "k4",
          "k5",
          "k6",
          "k7",
          "k8",
          "k9",
          "k10",
          "k11", // 11th keyword - over limit
        ],
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should enforce max 50 chars per keyword", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: ["a".repeat(51)], // 51 chars - over limit
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept keyword at max length (50 chars)", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: ["a".repeat(50)], // Exactly 50 chars
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // Test prayer_request field
  describe("prayer_request field", () => {
    it("should accept valid prayer request", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: "Please pray for healing and comfort for my family",
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prayer_request).toBe(
          "Please pray for healing and comfort for my family"
        );
      }
    });

    it("should accept null prayer_request", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept long prayer request (up to 5000 chars)", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: "Please pray ".repeat(400), // ~4800 chars
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject prayer request over 5000 chars", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: "a".repeat(5001), // Over limit
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // Test interests field
  describe("interests field", () => {
    it("should accept valid interests array", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: ["Volunteering", "Small Groups", "Youth Ministry"],
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should enforce max 20 interests", () => {
      const interests = Array.from(
        { length: 21 },
        (_, i) => `Interest ${i + 1}`
      );
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: interests, // 21 interests - over limit
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should enforce max 100 chars per interest", () => {
      const data = {
        name: "Test User",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: ["a".repeat(101)], // 101 chars - over limit
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // Test name field size limits
  describe("name field", () => {
    it("should accept valid name", () => {
      const data = {
        name: "John Michael Smith III",
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject name over 200 chars", () => {
      const data = {
        name: "a".repeat(201), // Over limit
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // Test email field
  describe("email field", () => {
    it("should accept valid email", () => {
      const data = {
        name: null,
        email: "test@example.com",
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject email over 255 chars", () => {
      const data = {
        name: null,
        email: "a".repeat(256) + "@example.com", // Way over limit
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // Test invalid types
  describe("type validation", () => {
    it("should reject number for name", () => {
      const data = {
        name: 12345, // Should be string
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject string for keywords (should be array)", () => {
      const data = {
        name: null,
        email: null,
        phone: null,
        prayer_request: null,
        keywords: "impacted", // Should be array
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject string for interests (should be array)", () => {
      const data = {
        name: null,
        email: null,
        phone: null,
        prayer_request: null,
        keywords: null,
        interests: "Volunteering", // Should be array
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject string for first_time_visitor (should be boolean)", () => {
      const data = {
        name: null,
        email: null,
        phone: null,
        prayer_request: null,
        first_time_visitor: "yes", // Should be boolean
        keywords: null,
        interests: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // Test realistic AI extraction scenarios
  describe("realistic AI extraction scenarios", () => {
    it("should accept typical first-time visitor card", () => {
      const data = {
        name: "Sarah Johnson",
        email: "sarah.j@gmail.com",
        phone: "206-555-9876",
        prayer_request: "Pray for my job search",
        visit_status: "First Visit",
        first_time_visitor: true,
        interests: ["Small Groups", "Women's Ministry"],
        keywords: ["easter"],
        address: null,
        age_group: "25-35",
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept card with campaign keyword only", () => {
      const data = {
        name: "Anonymous",
        email: null,
        phone: null,
        prayer_request: null,
        visit_status: null,
        first_time_visitor: null,
        interests: null,
        keywords: ["impacted"],
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: "Just wrote 'impacted' on the card",
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept card with prayer request only", () => {
      const data = {
        name: null,
        email: null,
        phone: null,
        prayer_request:
          "Please pray for my mother who is in the hospital. She has cancer and we need a miracle. Our family is really struggling right now.",
        visit_status: null,
        first_time_visitor: null,
        interests: null,
        keywords: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: null,
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept volunteer signup card", () => {
      const data = {
        name: "Mike Chen",
        email: "mike@techcompany.com",
        phone: "425-555-1234",
        prayer_request: null,
        visit_status: "Regular attender",
        first_time_visitor: false,
        interests: ["I want to volunteer", "Parking Team", "AV/Tech"],
        keywords: null,
        address: null,
        age_group: null,
        family_info: null,
        additional_notes: "Available Sunday mornings",
      };

      const result = extractedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
