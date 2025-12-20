import { z } from "zod";

// Industries for organization setup
export const organizationIndustries = [
  "SaaS",
  "E-commerce",
  "Healthcare",
  "Finance",
  "Education",
  "Marketing",
  "Real Estate",
  "Consulting",
  "Other",
] as const;

// Organization setup schema for new agency registration
export const organizationSetupSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(30, { message: "Name must be at most 30 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, {
      message: "Name can only contain letters, spaces, hyphens and apostrophes",
    }),
  agencyName: z
    .string()
    .min(2, { message: "Agency name must be at least 2 characters" })
    .max(100, { message: "Agency name must be at most 100 characters" }),
  website: z
    .string()
    .transform(val => {
      // Allow empty strings
      if (!val || val.trim() === "") return "";

      // Add https:// if no protocol is specified
      if (!val.startsWith("http://") && !val.startsWith("https://")) {
        return `https://${val}`;
      }
      return val;
    })
    .refine(
      val => {
        // Allow empty strings
        if (!val || val === "") return true;

        // Basic URL validation - much more flexible
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid website (e.g., example.com)" }
    )
    .optional(),
  industry: z.enum(organizationIndustries, {
    message: "Please select an industry",
  }),
});

/**
 * Extracted Data Schema
 *
 * Validates AI Vision extracted data with size limits to prevent:
 * - Storage exhaustion attacks
 * - Data pollution
 * - Oversized payloads
 *
 * Size limits are generous to accommodate AI extraction variance
 * while preventing abuse.
 */
export const extractedDataSchema = z.object({
  name: z.string().max(200).nullable(),
  email: z.string().max(255).nullable(),
  phone: z.string().max(50).nullable(),
  prayer_request: z.string().max(5000).nullable(), // Generous for long prayers
  visit_status: z.string().max(100).nullish(),
  first_time_visitor: z.boolean().nullish(),
  interests: z.array(z.string().max(100)).max(20).nullable(),
  // Campaign keywords - standalone words/phrases visitors write (e.g., "impacted", "coffee oasis")
  keywords: z.array(z.string().max(50)).max(10).nullable(),
  address: z.string().max(500).nullable(),
  age_group: z.string().max(50).nullable(),
  family_info: z.string().max(500).nullable(),
  // Structured notes with size limits (replaces z.any())
  additional_notes: z.string().max(2000).nullable(),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;

// Connect card extracted data schema
export const connectCardSchema = z.object({
  imageKey: z.string().min(1, { message: "Front image is required" }),
  imageHash: z.string().min(1, { message: "Front image hash is required" }), // SHA-256 hash from extract API
  backImageKey: z.string().optional().nullable(), // Back image S3 key (optional for two-sided cards)
  backImageHash: z.string().optional().nullable(), // Back image SHA-256 hash
  extractedData: extractedDataSchema,
});

// Connect card update schema for review queue corrections
export const connectCardUpdateSchema = z.object({
  id: z.string().uuid({ message: "Invalid card ID" }),
  name: z.string().min(1, { message: "Name is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .nullable()
    .optional(),
  phone: z.string().nullable().optional(),
  visitType: z
    .enum(["First Visit", "Second Visit", "Regular attendee", "Other"])
    .nullable()
    .optional(),
  interests: z.array(z.string()).default([]),
  volunteerCategory: z.string().nullable().optional(),
  prayerRequest: z.string().nullable().optional(),
  assignedLeaderId: z.string().uuid().nullable().optional(),
  smsAutomationEnabled: z.boolean().default(false),
  sendMessageToLeader: z.boolean().default(false),
  sendBackgroundCheckInfo: z.boolean().default(false),
});

// ============================================================================
// VOLUNTEER MANAGEMENT SCHEMAS
// ============================================================================

// Volunteer status enum
export const volunteerStatuses = [
  "ACTIVE",
  "ON_BREAK",
  "INACTIVE",
  "PENDING_APPROVAL",
] as const;

// Background check status enum
export const backgroundCheckStatuses = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "CLEARED",
  "FLAGGED",
  "EXPIRED",
] as const;

// Volunteer category types enum
export const volunteerCategoryTypes = [
  "GENERAL",
  "GREETER",
  "USHER",
  "KIDS_MINISTRY",
  "WORSHIP_TEAM",
  "PARKING",
  "HOSPITALITY",
  "AV_TECH",
  "PRAYER_TEAM",
  "OTHER",
] as const;

// REMOVED: availabilityTypes, recurrencePatterns, shiftStatuses, daysOfWeek (Dec 2025)
// Shift scheduling moved to Planning Center

// Volunteer profile schema (create/update)
export const volunteerSchema = z.object({
  // Member information (inline creation/lookup)
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .max(100, { message: "First name must be at most 100 characters" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .max(100, { message: "Last name must be at most 100 characters" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be at most 255 characters" }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number" })
    .nullable()
    .optional(),
  organizationId: z.string().uuid({ message: "Invalid organization ID" }),
  locationId: z
    .string()
    .uuid({ message: "Invalid location ID" })
    .nullable()
    .optional(),
  status: z.enum(volunteerStatuses, { message: "Status is required" }),
  startDate: z.coerce.date({ message: "Start date is required" }),
  endDate: z.coerce.date().nullable().optional(),
  inactiveReason: z.string().nullable().optional(),
  emergencyContactName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be at most 100 characters" })
    .nullable()
    .optional(),
  emergencyContactPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number" })
    .nullable()
    .optional(),
  backgroundCheckStatus: z.enum(backgroundCheckStatuses, {
    message: "Background check status is required",
  }),
  backgroundCheckDate: z.coerce.date().nullable().optional(),
  backgroundCheckExpiry: z.coerce.date().nullable().optional(),
  notes: z
    .string()
    .max(1000, { message: "Notes too long" })
    .nullable()
    .optional(),
  // Categories is required but can be empty array - defaults provided in forms
  categories: z.array(z.enum(volunteerCategoryTypes)),
});

// Serving opportunity schema (create/update)
export const servingOpportunitySchema = z.object({
  organizationId: z.string().uuid({ message: "Invalid organization ID" }),
  locationId: z
    .string()
    .uuid({ message: "Invalid location ID" })
    .nullable()
    .optional(),
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(100, { message: "Name must be at most 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description must be at most 500 characters" })
    .nullable()
    .optional(),
  category: z
    .string()
    .max(50, { message: "Category must be at most 50 characters" })
    .nullable()
    .optional(),
  volunteersNeeded: z.coerce
    .number()
    .int({ message: "Must be a whole number" })
    .min(1, { message: "At least 1 volunteer needed" })
    .max(100, { message: "Maximum 100 volunteers" }),
  dayOfWeek: z
    .number()
    .int()
    .min(0, { message: "Invalid day" })
    .max(6, { message: "Invalid day" })
    .nullable()
    .optional(),
  serviceTime: z
    .string()
    .max(50, { message: "Service time must be at most 50 characters" })
    .nullable()
    .optional(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, { message: "Minimum 15 minutes" })
    .max(480, { message: "Maximum 8 hours" })
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
  isRecurring: z.boolean().default(true),
  // REMOVED: recurrencePattern (Dec 2025) - Shift scheduling moved to Planning Center
  sortOrder: z.coerce.number().int().min(0).default(0),
});

// REMOVED: volunteerShiftSchema (Dec 2025) - Shift scheduling moved to Planning Center

// Volunteer skill schema (create/update)
export const volunteerSkillSchema = z.object({
  volunteerId: z.string().uuid({ message: "Invalid volunteer ID" }),
  skillName: z
    .string()
    .min(2, { message: "Skill name must be at least 2 characters" })
    .max(100, { message: "Skill name must be at most 100 characters" }),
  proficiency: z
    .string()
    .max(50, { message: "Proficiency must be at most 50 characters" })
    .nullable()
    .optional(),
  isVerified: z.boolean().default(false),
  verifiedDate: z.coerce.date().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  notes: z
    .string()
    .max(500, { message: "Notes must be at most 500 characters" })
    .nullable()
    .optional(),
});

// REMOVED: volunteerAvailabilitySchema (Dec 2025) - Shift scheduling moved to Planning Center
// REMOVED: servingOpportunitySkillSchema (Dec 2025) - Shift scheduling moved to Planning Center

export type OrganizationSetupSchemaType = z.infer<
  typeof organizationSetupSchema
>;
export type ConnectCardSchemaType = z.infer<typeof connectCardSchema>;
export type ConnectCardUpdateSchemaType = z.infer<
  typeof connectCardUpdateSchema
>;
export type VolunteerSchemaType = z.infer<typeof volunteerSchema>;
export type ServingOpportunitySchemaType = z.infer<
  typeof servingOpportunitySchema
>;
// REMOVED: VolunteerShiftSchemaType (Dec 2025) - Shift scheduling moved to Planning Center
export type VolunteerSkillSchemaType = z.infer<typeof volunteerSkillSchema>;
// REMOVED: VolunteerAvailabilitySchemaType, ServingOpportunitySkillSchemaType (Dec 2025)
// Shift scheduling moved to Planning Center

// ========================================
// PRAYER REQUEST SCHEMAS
// ========================================

// Prayer request status enum
export const prayerRequestStatuses = [
  "PENDING",
  "ASSIGNED",
  "PRAYING",
  "ANSWERED",
  "ARCHIVED",
] as const;

// Prayer request categories
export const prayerCategories = [
  "Health",
  "Family",
  "Salvation",
  "Financial",
  "Relationships",
  "Spiritual Growth",
  "Work/Career",
  "Other",
] as const;

// Privacy levels (for future enhancement - currently just boolean)
export const privacyLevels = [
  "PUBLIC",
  "MEMBERS_ONLY",
  "LEADERSHIP",
  "PRIVATE",
] as const;

// Create prayer request schema (manual creation)
export const createPrayerRequestSchema = z.object({
  request: z
    .string()
    .min(1, { message: "Prayer request cannot be empty" })
    .max(2000, { message: "Prayer request must be at most 2000 characters" }),
  category: z
    .enum(prayerCategories, { message: "Invalid category" })
    .nullable()
    .optional(),
  isPrivate: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  locationId: z
    .string()
    .uuid({ message: "Invalid location ID" })
    .nullable()
    .optional(),
  submittedBy: z
    .string()
    .max(100, { message: "Submitter name must be at most 100 characters" })
    .nullable()
    .optional(),
  submitterEmail: z
    .string()
    .email({ message: "Invalid email address" })
    .nullable()
    .optional(),
  submitterPhone: z
    .string()
    .max(20, { message: "Phone number must be at most 20 characters" })
    .nullable()
    .optional(),
});

// Update prayer request schema (partial updates)
export const updatePrayerRequestSchema = z.object({
  id: z.string().uuid({ message: "Invalid prayer request ID" }),
  request: z
    .string()
    .min(1, { message: "Prayer request cannot be empty" })
    .max(2000, { message: "Prayer request must be at most 2000 characters" })
    .optional(),
  category: z
    .enum(prayerCategories, { message: "Invalid category" })
    .nullable()
    .optional(),
  isPrivate: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  status: z
    .enum(prayerRequestStatuses, { message: "Invalid status" })
    .optional(),
  followUpDate: z.coerce.date().nullable().optional(),
});

// Assign prayer request schema
export const assignPrayerRequestSchema = z.object({
  id: z.string().uuid({ message: "Invalid prayer request ID" }),
  assignedToId: z.string().uuid({ message: "Invalid user ID" }),
});

// Mark prayer as answered schema
export const markAnsweredSchema = z.object({
  id: z.string().uuid({ message: "Invalid prayer request ID" }),
  answeredDate: z.coerce.date({ message: "Answered date is required" }),
  answeredNotes: z
    .string()
    .max(2000, { message: "Notes must be at most 2000 characters" })
    .nullable()
    .optional(),
});

// Delete/archive prayer request schema
export const deletePrayerRequestSchema = z.object({
  id: z.string().uuid({ message: "Invalid prayer request ID" }),
  shouldArchive: z.boolean().default(true), // Archive by default, hard delete if false
});

// Toggle privacy schema
export const togglePrivacySchema = z.object({
  id: z.string().uuid({ message: "Invalid prayer request ID" }),
  isPrivate: z.boolean(),
  reason: z
    .string()
    .max(200, { message: "Reason must be at most 200 characters" })
    .optional(), // For audit log
});

// Export types
export type CreatePrayerRequestSchemaType = z.infer<
  typeof createPrayerRequestSchema
>;
export type UpdatePrayerRequestSchemaType = z.infer<
  typeof updatePrayerRequestSchema
>;
export type AssignPrayerRequestSchemaType = z.infer<
  typeof assignPrayerRequestSchema
>;
export type MarkAnsweredSchemaType = z.infer<typeof markAnsweredSchema>;
export type DeletePrayerRequestSchemaType = z.infer<
  typeof deletePrayerRequestSchema
>;
export type TogglePrivacySchemaType = z.infer<typeof togglePrivacySchema>;
