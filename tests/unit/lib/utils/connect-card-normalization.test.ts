/**
 * Connect Card Normalization Unit Tests
 *
 * These tests verify the pure functions that normalize AI Vision extracted data.
 *
 * ============================================================================
 * VITEST BASICS (for reference):
 * ============================================================================
 *
 * describe("GroupName", () => { ... })
 *   - Groups related tests together
 *   - Can be nested for sub-categories
 *
 * it("should do something", () => { ... })
 *   - Defines a single test case
 *   - The string describes WHAT the test verifies
 *   - Best practice: Start with "should"
 *
 * expect(value).toBe(expected)
 *   - Makes an assertion
 *   - Test FAILS if assertion is false
 *
 * Common matchers:
 *   - .toBe(x)           - Exact equality (===)
 *   - .toEqual(x)        - Deep equality (for objects/arrays)
 *   - .toBeNull()        - Checks for null
 *   - .toBeTruthy()      - Checks truthy value
 *   - .toContain(x)      - Array/string contains x
 *   - .toHaveLength(n)   - Array/string length
 *
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
// Use relative import to the source file
// Path: from tests/unit/lib/utils/ to lib/utils/
import {
  normalizeVisitStatus,
  normalizeInterests,
  normalizeKeywords,
} from "../../../../lib/utils/connect-card-normalization";

// ============================================================================
// normalizeVisitStatus Tests
// ============================================================================

describe("normalizeVisitStatus", () => {
  // Test null/empty inputs
  describe("null and empty inputs", () => {
    it("should return null for null input", () => {
      const result = normalizeVisitStatus(null);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      // Note: Current implementation returns "" for empty string
      // This test documents actual behavior
      const result = normalizeVisitStatus("");
      expect(result).toBeNull();
    });
  });

  // Test "First Visit" variations
  describe("First Visit detection", () => {
    it("should normalize 'First Time' to 'First Visit'", () => {
      const result = normalizeVisitStatus("First Time");
      expect(result).toBe("First Visit");
    });

    it("should normalize 'First Visit' to 'First Visit'", () => {
      const result = normalizeVisitStatus("First Visit");
      expect(result).toBe("First Visit");
    });

    it("should normalize 'I'm new' to 'First Visit'", () => {
      const result = normalizeVisitStatus("I'm new");
      expect(result).toBe("First Visit");
    });

    it("should normalize 'im new' (no apostrophe) to 'First Visit'", () => {
      const result = normalizeVisitStatus("im new");
      expect(result).toBe("First Visit");
    });

    it("should normalize 'New Here' to 'First Visit'", () => {
      const result = normalizeVisitStatus("New Here");
      expect(result).toBe("First Visit");
    });

    it("should normalize 'New Guest' to 'First Visit'", () => {
      const result = normalizeVisitStatus("New Guest");
      expect(result).toBe("First Visit");
    });

    it("should normalize 'Guest' (alone) to 'First Visit'", () => {
      const result = normalizeVisitStatus("Guest");
      expect(result).toBe("First Visit");
    });

    it("should be case-insensitive", () => {
      expect(normalizeVisitStatus("FIRST TIME")).toBe("First Visit");
      expect(normalizeVisitStatus("first time")).toBe("First Visit");
      expect(normalizeVisitStatus("First TIME")).toBe("First Visit");
    });
  });

  // Test "Second Visit" variations
  describe("Second Visit detection", () => {
    it("should normalize 'Second Visit' to 'Second Visit'", () => {
      const result = normalizeVisitStatus("Second Visit");
      expect(result).toBe("Second Visit");
    });

    it("should normalize '2nd Visit' to 'Second Visit'", () => {
      const result = normalizeVisitStatus("2nd Visit");
      expect(result).toBe("Second Visit");
    });

    it("should normalize '2nd time' to 'Second Visit'", () => {
      const result = normalizeVisitStatus("2nd time");
      expect(result).toBe("Second Visit");
    });
  });

  // Test "Regular attendee" variations
  describe("Regular attendee detection", () => {
    it("should normalize 'Regular Attender' to 'Regular attendee'", () => {
      const result = normalizeVisitStatus("Regular Attender");
      expect(result).toBe("Regular attendee");
    });

    it("should normalize 'Member' to 'Regular attendee'", () => {
      const result = normalizeVisitStatus("Member");
      expect(result).toBe("Regular attendee");
    });

    it("should normalize 'Returning Guest' to 'Regular attendee'", () => {
      const result = normalizeVisitStatus("Returning Guest");
      expect(result).toBe("Regular attendee");
    });

    it("should normalize 'Frequent Attender' to 'Regular attendee'", () => {
      const result = normalizeVisitStatus("Frequent Attender");
      expect(result).toBe("Regular attendee");
    });
  });

  // Test fallback behavior - unrecognized values
  describe("unrecognized values (fallback)", () => {
    it("should return original value for unrecognized status", () => {
      const result = normalizeVisitStatus("Something Unknown");
      expect(result).toBe("Something Unknown");
    });

    it("should return original value with preserved case", () => {
      const result = normalizeVisitStatus("Special Event Only");
      expect(result).toBe("Special Event Only");
    });
  });
});

// ============================================================================
// normalizeInterests Tests
// ============================================================================

describe("normalizeInterests", () => {
  // Test null/empty inputs
  describe("null and empty inputs", () => {
    it("should return empty array for null input", () => {
      const result = normalizeInterests(null);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty array input", () => {
      const result = normalizeInterests([]);
      expect(result).toEqual([]);
    });
  });

  // Test Volunteering variations
  describe("Volunteering detection", () => {
    it("should normalize 'I want to volunteer' to 'Volunteering'", () => {
      const result = normalizeInterests(["I want to volunteer"]);
      expect(result).toContain("Volunteering");
    });

    it("should normalize 'Serve' to 'Volunteering'", () => {
      const result = normalizeInterests(["Serve"]);
      expect(result).toContain("Volunteering");
    });

    it("should normalize 'I'd like to serve' to 'Volunteering'", () => {
      const result = normalizeInterests(["I'd like to serve"]);
      expect(result).toContain("Volunteering");
    });

    it("should normalize 'Get Involved' to 'Volunteering'", () => {
      const result = normalizeInterests(["Get Involved"]);
      expect(result).toContain("Volunteering");
    });

    it("should normalize 'Help Out' to 'Volunteering'", () => {
      const result = normalizeInterests(["Help Out"]);
      expect(result).toContain("Volunteering");
    });

    it("should deduplicate multiple volunteer variations", () => {
      const result = normalizeInterests([
        "I want to volunteer",
        "Serve",
        "Get Involved",
      ]);
      // Should only have ONE "Volunteering" entry
      const volunteeringCount = result.filter(i => i === "Volunteering").length;
      expect(volunteeringCount).toBe(1);
    });
  });

  // Test Small Groups variations
  describe("Small Groups detection", () => {
    it("should normalize 'Small Group' to 'Small Groups'", () => {
      const result = normalizeInterests(["Small Group"]);
      expect(result).toContain("Small Groups");
    });

    it("should normalize 'Life Group' to 'Small Groups'", () => {
      const result = normalizeInterests(["Life Group"]);
      expect(result).toContain("Small Groups");
    });

    it("should normalize 'Connect Group' to 'Small Groups'", () => {
      const result = normalizeInterests(["Connect Group"]);
      expect(result).toContain("Small Groups");
    });

    it("should normalize 'Community Group' to 'Small Groups'", () => {
      const result = normalizeInterests(["Community Group"]);
      expect(result).toContain("Small Groups");
    });

    it("should normalize 'Bible Study' to 'Small Groups'", () => {
      const result = normalizeInterests(["Bible Study"]);
      expect(result).toContain("Small Groups");
    });
  });

  // Test Youth Ministry variations
  describe("Youth Ministry detection", () => {
    it("should normalize 'Youth Ministry' to 'Youth Ministry'", () => {
      const result = normalizeInterests(["Youth Ministry"]);
      expect(result).toContain("Youth Ministry");
    });

    it("should normalize 'Student Ministry' to 'Youth Ministry'", () => {
      const result = normalizeInterests(["Student Ministry"]);
      expect(result).toContain("Youth Ministry");
    });

    it("should normalize 'Teen Group' to 'Youth Ministry'", () => {
      const result = normalizeInterests(["Teen Group"]);
      expect(result).toContain("Youth Ministry");
    });
  });

  // Test Kids Ministry variations
  describe("Kids Ministry detection", () => {
    it("should normalize 'Kids Ministry' to 'Kids Ministry'", () => {
      const result = normalizeInterests(["Kids Ministry"]);
      expect(result).toContain("Kids Ministry");
    });

    it("should normalize 'Children's Ministry' to 'Kids Ministry'", () => {
      const result = normalizeInterests(["Children's Ministry"]);
      expect(result).toContain("Kids Ministry");
    });

    it("should normalize 'Nursery' to 'Kids Ministry'", () => {
      const result = normalizeInterests(["Nursery"]);
      expect(result).toContain("Kids Ministry");
    });
  });

  // Test Worship variations
  describe("Worship detection", () => {
    it("should normalize 'Worship Team' to 'Worship'", () => {
      const result = normalizeInterests(["Worship Team"]);
      expect(result).toContain("Worship");
    });

    it("should normalize 'Music Ministry' to 'Worship'", () => {
      const result = normalizeInterests(["Music Ministry"]);
      expect(result).toContain("Worship");
    });

    it("should normalize 'Band' to 'Worship'", () => {
      const result = normalizeInterests(["Band"]);
      expect(result).toContain("Worship");
    });

    it("should normalize 'Choir' to 'Worship'", () => {
      const result = normalizeInterests(["Choir"]);
      expect(result).toContain("Worship");
    });
  });

  // Test Missions variations
  describe("Missions detection", () => {
    it("should normalize 'Missions' to 'Missions'", () => {
      const result = normalizeInterests(["Missions"]);
      expect(result).toContain("Missions");
    });

    it("should normalize 'Outreach' to 'Missions'", () => {
      const result = normalizeInterests(["Outreach"]);
      expect(result).toContain("Missions");
    });
  });

  // Test passthrough for unrecognized interests
  describe("unrecognized interests (passthrough)", () => {
    it("should keep unrecognized interests as-is", () => {
      const result = normalizeInterests(["Men's Breakfast"]);
      expect(result).toContain("Men's Breakfast");
    });

    it("should keep multiple unrecognized interests", () => {
      const result = normalizeInterests(["Photography Team", "Ushering"]);
      expect(result).toContain("Photography Team");
      expect(result).toContain("Ushering");
    });
  });

  // Test mixed inputs
  describe("mixed inputs", () => {
    it("should handle mix of recognized and unrecognized interests", () => {
      const result = normalizeInterests([
        "I want to volunteer",
        "Photography Team",
        "Small Group",
      ]);

      expect(result).toContain("Volunteering");
      expect(result).toContain("Photography Team");
      expect(result).toContain("Small Groups");
      expect(result).toHaveLength(3);
    });

    it("should be case-insensitive", () => {
      const result = normalizeInterests([
        "VOLUNTEER",
        "small group",
        "YOUTH ministry",
      ]);

      expect(result).toContain("Volunteering");
      expect(result).toContain("Small Groups");
      expect(result).toContain("Youth Ministry");
    });
  });
});

// ============================================================================
// normalizeKeywords Tests - THE FEATURE FROM PR #80
// ============================================================================

describe("normalizeKeywords", () => {
  // Test null/empty inputs
  describe("null and empty inputs", () => {
    it("should return empty array for null input", () => {
      const result = normalizeKeywords(null);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty array input", () => {
      const result = normalizeKeywords([]);
      expect(result).toEqual([]);
    });
  });

  // Test lowercase normalization
  describe("lowercase normalization", () => {
    it("should lowercase 'Impacted' to 'impacted'", () => {
      const result = normalizeKeywords(["Impacted"]);
      expect(result).toEqual(["impacted"]);
    });

    it("should lowercase 'COFFEE OASIS' to 'coffee oasis'", () => {
      const result = normalizeKeywords(["COFFEE OASIS"]);
      expect(result).toEqual(["coffee oasis"]);
    });

    it("should lowercase 'Next Steps' to 'next steps'", () => {
      const result = normalizeKeywords(["Next Steps"]);
      expect(result).toEqual(["next steps"]);
    });

    it("should handle mixed case", () => {
      const result = normalizeKeywords(["CaFeInAtEd"]);
      expect(result).toEqual(["cafeinated"]);
    });
  });

  // Test whitespace trimming
  describe("whitespace trimming", () => {
    it("should trim leading whitespace", () => {
      const result = normalizeKeywords(["  impacted"]);
      expect(result).toEqual(["impacted"]);
    });

    it("should trim trailing whitespace", () => {
      const result = normalizeKeywords(["impacted  "]);
      expect(result).toEqual(["impacted"]);
    });

    it("should trim both leading and trailing whitespace", () => {
      const result = normalizeKeywords(["  impacted  "]);
      expect(result).toEqual(["impacted"]);
    });

    it("should preserve internal whitespace in phrases", () => {
      const result = normalizeKeywords(["coffee  oasis"]);
      // Note: Current implementation doesn't normalize internal spaces
      expect(result).toEqual(["coffee  oasis"]);
    });
  });

  // Test filtering empty strings
  describe("empty string filtering", () => {
    it("should filter out empty strings", () => {
      const result = normalizeKeywords([""]);
      expect(result).toEqual([]);
    });

    it("should filter out whitespace-only strings", () => {
      const result = normalizeKeywords(["   "]);
      expect(result).toEqual([]);
    });

    it("should filter empty strings while keeping valid ones", () => {
      const result = normalizeKeywords(["impacted", "", "next steps", "   "]);
      expect(result).toEqual(["impacted", "next steps"]);
    });
  });

  // Test multiple keywords
  describe("multiple keywords", () => {
    it("should normalize multiple keywords", () => {
      const result = normalizeKeywords([
        "Impacted",
        "Coffee Oasis",
        "Next Steps",
      ]);
      expect(result).toEqual(["impacted", "coffee oasis", "next steps"]);
    });

    it("should preserve order of keywords", () => {
      const result = normalizeKeywords(["Alpha", "Beta", "Gamma"]);
      expect(result[0]).toBe("alpha");
      expect(result[1]).toBe("beta");
      expect(result[2]).toBe("gamma");
    });
  });

  // Test real-world examples from PR #80
  describe("real-world campaign keywords", () => {
    it("should normalize 'impacted' keyword (common campaign)", () => {
      const result = normalizeKeywords(["impacted"]);
      expect(result).toContain("impacted");
    });

    it("should normalize 'coffee oasis' keyword (location-based campaign)", () => {
      const result = normalizeKeywords(["Coffee Oasis"]);
      expect(result).toContain("coffee oasis");
    });

    it("should normalize 'next steps' keyword (discipleship campaign)", () => {
      const result = normalizeKeywords(["Next Steps"]);
      expect(result).toContain("next steps");
    });

    it("should handle typical church campaign keywords", () => {
      const campaignKeywords = [
        "Easter",
        "Christmas Eve",
        "VBS",
        "Fall Festival",
        "Discover Class",
      ];
      const result = normalizeKeywords(campaignKeywords);

      expect(result).toEqual([
        "easter",
        "christmas eve",
        "vbs",
        "fall festival",
        "discover class",
      ]);
    });
  });
});
