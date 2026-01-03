/**
 * SMS Parsing Unit Tests
 *
 * These tests verify the SMS response parsing logic used by the GHL webhook.
 *
 * WHY UNIT TESTS?
 * ---------------
 * These functions are "pure" - they take input and return output with no side effects.
 * - No database calls
 * - No network requests
 * - No file system access
 *
 * This makes them FAST (milliseconds) and RELIABLE (no flaky external dependencies).
 *
 * WHAT WE'RE TESTING:
 * - parseResponse(): Exact match parsing (YES, Y, NO, N)
 * - parseResponseFuzzy(): Extended fuzzy matching
 * - extractMessageFromPayload(): Payload field extraction
 */

import { describe, it, expect } from "vitest";
import {
  parseResponse,
  parseResponseFuzzy,
  extractMessageFromPayload,
} from "../../../../lib/ghl/sms-parsing";

// ============================================================================
// parseResponse() - Exact Match Parsing
// ============================================================================

describe("parseResponse", () => {
  // Group 1: YES responses
  describe("YES responses", () => {
    it('should return "YES" for "YES"', () => {
      // The most common case - volunteer replies YES
      expect(parseResponse("YES")).toBe("YES");
    });

    it('should return "YES" for lowercase "yes"', () => {
      // Case insensitive - users don't always capitalize
      expect(parseResponse("yes")).toBe("YES");
    });

    it('should return "YES" for "Y"', () => {
      // Short form - common on mobile
      expect(parseResponse("Y")).toBe("YES");
    });

    it('should return "YES" for lowercase "y"', () => {
      expect(parseResponse("y")).toBe("YES");
    });

    it('should return "YES" for "  YES  " with whitespace', () => {
      // SMS sometimes has extra whitespace
      expect(parseResponse("  YES  ")).toBe("YES");
    });

    it('should return "YES" for mixed case "Yes"', () => {
      expect(parseResponse("Yes")).toBe("YES");
    });
  });

  // Group 2: NO responses
  describe("NO responses", () => {
    it('should return "NO" for "NO"', () => {
      expect(parseResponse("NO")).toBe("NO");
    });

    it('should return "NO" for lowercase "no"', () => {
      expect(parseResponse("no")).toBe("NO");
    });

    it('should return "NO" for "N"', () => {
      expect(parseResponse("N")).toBe("NO");
    });

    it('should return "NO" for lowercase "n"', () => {
      expect(parseResponse("n")).toBe("NO");
    });

    it('should return "NO" for "  NO  " with whitespace', () => {
      expect(parseResponse("  NO  ")).toBe("NO");
    });
  });

  // Group 3: Unrecognized responses (should return null)
  describe("unrecognized responses", () => {
    it("should return null for empty string", () => {
      // Empty messages shouldn't be processed
      expect(parseResponse("")).toBe(null);
    });

    it('should return null for "maybe"', () => {
      // Common non-committal response
      expect(parseResponse("maybe")).toBe(null);
    });

    it('should return null for "yeah"', () => {
      // This is a future enhancement - not supported in exact match
      expect(parseResponse("yeah")).toBe(null);
    });

    it('should return null for "nope"', () => {
      // This is a future enhancement - not supported in exact match
      expect(parseResponse("nope")).toBe(null);
    });

    it('should return null for "YES!" with punctuation', () => {
      // Punctuation breaks exact match
      expect(parseResponse("YES!")).toBe(null);
    });

    it('should return null for "Yes please"', () => {
      // Additional text breaks exact match
      expect(parseResponse("Yes please")).toBe(null);
    });

    it("should return null for random text", () => {
      expect(parseResponse("What time does it start?")).toBe(null);
    });

    it("should return null for just whitespace", () => {
      expect(parseResponse("   ")).toBe(null);
    });
  });
});

// ============================================================================
// parseResponseFuzzy() - Extended Fuzzy Matching
// ============================================================================

describe("parseResponseFuzzy", () => {
  // This is the "future enhancement" version with more permissive matching

  describe("YES patterns", () => {
    // Standard responses
    it('should match "yes"', () => {
      expect(parseResponseFuzzy("yes")).toBe("YES");
    });

    it('should match "y"', () => {
      expect(parseResponseFuzzy("y")).toBe("YES");
    });

    // Casual affirmatives
    it('should match "yeah"', () => {
      expect(parseResponseFuzzy("yeah")).toBe("YES");
    });

    it('should match "yep"', () => {
      expect(parseResponseFuzzy("yep")).toBe("YES");
    });

    it('should match "yup"', () => {
      expect(parseResponseFuzzy("yup")).toBe("YES");
    });

    // Enthusiastic responses
    it('should match "sure"', () => {
      expect(parseResponseFuzzy("sure")).toBe("YES");
    });

    it('should match "absolutely"', () => {
      expect(parseResponseFuzzy("absolutely")).toBe("YES");
    });

    it('should match "definitely"', () => {
      expect(parseResponseFuzzy("definitely")).toBe("YES");
    });

    // Phrases
    it('should match "count me in"', () => {
      expect(parseResponseFuzzy("count me in")).toBe("YES");
    });

    it('should match "I\'m in"', () => {
      expect(parseResponseFuzzy("i'm in")).toBe("YES");
    });

    // Case insensitive
    it('should match "YEAH" (uppercase)', () => {
      expect(parseResponseFuzzy("YEAH")).toBe("YES");
    });
  });

  describe("NO patterns", () => {
    // Standard responses
    it('should match "no"', () => {
      expect(parseResponseFuzzy("no")).toBe("NO");
    });

    it('should match "n"', () => {
      expect(parseResponseFuzzy("n")).toBe("NO");
    });

    // Casual negatives
    it('should match "nope"', () => {
      expect(parseResponseFuzzy("nope")).toBe("NO");
    });

    it('should match "nah"', () => {
      expect(parseResponseFuzzy("nah")).toBe("NO");
    });

    // Polite declines
    it('should match "sorry"', () => {
      expect(parseResponseFuzzy("sorry")).toBe("NO");
    });

    it('should match "can\'t"', () => {
      expect(parseResponseFuzzy("can't")).toBe("NO");
    });

    it('should match "cannot"', () => {
      expect(parseResponseFuzzy("cannot")).toBe("NO");
    });

    it('should match "unable"', () => {
      expect(parseResponseFuzzy("unable")).toBe("NO");
    });

    // Phrases
    it('should match "not available"', () => {
      expect(parseResponseFuzzy("not available")).toBe("NO");
    });
  });

  describe("unrecognized responses", () => {
    it("should return null for questions", () => {
      expect(parseResponseFuzzy("What time?")).toBe(null);
    });

    it("should return null for ambiguous responses", () => {
      expect(parseResponseFuzzy("let me check")).toBe(null);
    });

    it("should return null for empty string", () => {
      expect(parseResponseFuzzy("")).toBe(null);
    });
  });
});

// ============================================================================
// extractMessageFromPayload() - Payload Field Extraction
// ============================================================================

describe("extractMessageFromPayload", () => {
  // GHL webhooks can send the message in different fields

  it('should extract from "message" field', () => {
    const payload = { message: "YES" };
    expect(extractMessageFromPayload(payload)).toBe("YES");
  });

  it('should extract from "body" field when message is undefined', () => {
    const payload = { body: "NO" };
    expect(extractMessageFromPayload(payload)).toBe("NO");
  });

  it('should extract from "text" field as fallback', () => {
    const payload = { text: "maybe" };
    expect(extractMessageFromPayload(payload)).toBe("maybe");
  });

  it('should prefer "message" over "body"', () => {
    // When multiple fields are present, message takes priority
    const payload = { message: "YES", body: "NO" };
    expect(extractMessageFromPayload(payload)).toBe("YES");
  });

  it("should return empty string when all fields are undefined", () => {
    const payload = {};
    expect(extractMessageFromPayload(payload)).toBe("");
  });

  it("should return empty string for empty message", () => {
    const payload = { message: "" };
    expect(extractMessageFromPayload(payload)).toBe("");
  });
});
