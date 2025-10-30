/**
 * Connect Card Data Quality Validation
 *
 * Simple validation for AI Vision extracted connect card data.
 * Focuses on most common extraction issues only.
 *
 * Target: 75%+ auto-approval rate for AI Vision extractions
 */

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  needsReview: boolean;
}

/**
 * Validate Connect Card Data
 *
 * Checks for most common AI Vision extraction issues:
 * - 9-digit phone numbers (missing digit)
 * - All same digit phone numbers (999-999-9999, 000-000-0000)
 * - Email missing @ symbol
 * - Missing critical fields (name, phone, or email)
 *
 * @param data - Extracted connect card data from Claude Vision
 * @returns Validation result with issues array
 */
export function validateConnectCardData(data: {
  name: string | null;
  email: string | null;
  phone: string | null;
  prayer_request?: string | null;
  address?: string | null;
}): ValidationResult {
  const issues: ValidationIssue[] = [];
  let needsReview = false;

  // === NAME VALIDATION ===
  if (!data.name || data.name.trim().length < 2) {
    issues.push({
      field: "name",
      message: "Name is missing or too short",
      severity: "error",
    });
    needsReview = true;
  }

  // === PHONE VALIDATION ===
  if (data.phone && data.phone.trim() !== "") {
    const phoneDigits = data.phone.replace(/\D/g, ""); // Extract only digits

    // Check for 9-digit phone (most common OCR error - missing digit)
    if (phoneDigits.length === 9) {
      issues.push({
        field: "phone",
        message: "Phone number has only 9 digits (expected 10)",
        severity: "error",
      });
      needsReview = true;
    }

    // Check for all same digits (999-999-9999, 000-000-0000, etc.)
    if (phoneDigits.length >= 10) {
      const uniqueDigits = new Set(phoneDigits).size;
      if (uniqueDigits === 1) {
        issues.push({
          field: "phone",
          message: "Phone number is all the same digit",
          severity: "error",
        });
        needsReview = true;
      }
    }

    // Check for less than 9 digits (incomplete)
    if (phoneDigits.length < 9 && phoneDigits.length > 0) {
      issues.push({
        field: "phone",
        message: `Phone number has only ${phoneDigits.length} digits`,
        severity: "error",
      });
      needsReview = true;
    }
  } else {
    // Missing phone number
    issues.push({
      field: "phone",
      message: "Phone number is missing",
      severity: "error",
    });
    needsReview = true;
  }

  // === EMAIL VALIDATION ===
  if (data.email && data.email.trim() !== "") {
    // Check for missing @ symbol (most common email error)
    if (!data.email.includes("@")) {
      issues.push({
        field: "email",
        message: "Email is missing @ symbol",
        severity: "error",
      });
      needsReview = true;
    }
  } else {
    // Missing email
    issues.push({
      field: "email",
      message: "Email is missing",
      severity: "error",
    });
    needsReview = true;
  }

  // === PRAYER REQUEST (OPTIONAL) ===
  // No validation - AI Vision handles this well

  // === ADDRESS (OPTIONAL) ===
  // No validation - missing address is normal

  return {
    isValid: !needsReview,
    issues,
    needsReview,
  };
}

/**
 * Format validation summary for UI display
 */
export function formatValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return "No issues detected - ready to save";
  }

  const errorCount = result.issues.filter(i => i.severity === "error").length;
  return `${errorCount} issue${errorCount !== 1 ? "s" : ""} detected - needs review`;
}
