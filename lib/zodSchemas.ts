import { z } from "zod";

export const courseLevels = [
  "Core",
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;
export const courseStatus = ["Draft", "Published", "Archived"] as const;

export const courseCategories = [
  "Essentials",
  "CRM & Contacts",
  "Marketing Automation",
  "Sales & Funnels",
  "Social Media Management",
  "AI & Automation",
  "Integrations",
  "Advanced Features",
  "Agency Operations",
] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),

  fileKey: z.string().min(1, { message: "File is required" }),

  price: z.coerce
    .number()
    .min(0, { message: "Price cannot be negative" })
    .max(999999, { message: "Price too high" }),

  duration: z.coerce
    .number()
    .min(1, { message: "Duration must be at least 1 hour" })
    .max(500, { message: "Duration must be at most 500 hours" }),

  level: z.enum(courseLevels, {
    message: "Level is required",
  }),
  category: z.enum(courseCategories, {
    message: "Category is required",
  }),
  smallDescription: z
    .string()
    .min(3, { message: "Small Description must be at least 3 characters long" })
    .max(200, {
      message: "Small Description must be at most 200 characters long",
    }),

  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long" }),

  status: z.enum(courseStatus, {
    message: "Status is required",
  }),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course id" }),
});

export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  // Accept any non-empty string for IDs (supports both UUIDs and slug-based IDs from seed scripts)
  chapterId: z.string().min(1, { message: "Chapter ID is required" }),
  courseId: z.string().min(1, { message: "Course ID is required" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" })
    .optional(),

  videoKey: z.string().optional(),
});

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

// Connect card extracted data schema
export const connectCardSchema = z.object({
  imageKey: z.string().min(1, { message: "Image is required" }),
  extractedData: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    prayer_request: z.string().nullable(),
    visit_status: z.string().nullish(), // Extract actual text from card (null or undefined OK)
    first_time_visitor: z.boolean().nullish(), // Legacy field (null or undefined OK)
    interests: z.array(z.string()).nullable(),
    address: z.string().nullable(),
    age_group: z.string().nullable(),
    family_info: z.string().nullable(),
    additional_notes: z.any().nullable(), // Allow any JSON structure
  }),
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

// Availability type enum
export const availabilityTypes = ["RECURRING", "BLACKOUT", "ONE_TIME"] as const;

// Recurrence pattern enum
export const recurrencePatterns = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "FIRST_OF_MONTH",
  "THIRD_OF_MONTH",
  "ONE_TIME",
] as const;

// Shift status enum
export const shiftStatuses = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
] as const;

// Day of week (0=Sunday, 6=Saturday)
export const daysOfWeek = [0, 1, 2, 3, 4, 5, 6] as const;

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
  recurrencePattern: z
    .enum(recurrencePatterns, { message: "Invalid recurrence pattern" })
    .nullable()
    .optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

// Volunteer shift schema (create/update)
export const volunteerShiftSchema = z.object({
  organizationId: z.string().uuid({ message: "Invalid organization ID" }),
  locationId: z
    .string()
    .uuid({ message: "Invalid location ID" })
    .nullable()
    .optional(),
  volunteerId: z.string().uuid({ message: "Invalid volunteer ID" }),
  servingOpportunityId: z
    .string()
    .uuid({ message: "Invalid serving opportunity ID" }),
  shiftDate: z.coerce.date({ message: "Shift date is required" }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format (HH:MM)",
  }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format (HH:MM)",
  }),
  status: z.enum(shiftStatuses, { message: "Status is required" }),
  isConfirmed: z.boolean().default(false),
  checkInTime: z.coerce.date().nullable().optional(),
  checkOutTime: z.coerce.date().nullable().optional(),
  reminderSent: z.boolean().default(false),
  notes: z
    .string()
    .max(500, { message: "Notes must be at most 500 characters" })
    .nullable()
    .optional(),
});

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

// Volunteer availability schema (create/update)
export const volunteerAvailabilitySchema = z.object({
  volunteerId: z.string().uuid({ message: "Invalid volunteer ID" }),
  availabilityType: z.enum(availabilityTypes, {
    message: "Availability type is required",
  }),
  dayOfWeek: z
    .number()
    .int()
    .min(0, { message: "Invalid day" })
    .max(6, { message: "Invalid day" })
    .nullable()
    .optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:MM)",
    })
    .nullable()
    .optional(),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Invalid time format (HH:MM)",
    })
    .nullable()
    .optional(),
  isAvailable: z.boolean().default(true),
  reason: z
    .string()
    .max(200, { message: "Reason must be at most 200 characters" })
    .nullable()
    .optional(),
  recurrencePattern: z
    .enum(recurrencePatterns, { message: "Invalid recurrence pattern" })
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, { message: "Notes must be at most 500 characters" })
    .nullable()
    .optional(),
});

// Serving opportunity skill schema (create)
export const servingOpportunitySkillSchema = z.object({
  servingOpportunityId: z
    .string()
    .uuid({ message: "Invalid serving opportunity ID" }),
  skillName: z
    .string()
    .min(2, { message: "Skill name must be at least 2 characters" })
    .max(100, { message: "Skill name must be at most 100 characters" }),
  isRequired: z.boolean().default(true),
});

export type CourseSchemaType = z.infer<typeof courseSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
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
export type VolunteerShiftSchemaType = z.infer<typeof volunteerShiftSchema>;
export type VolunteerSkillSchemaType = z.infer<typeof volunteerSkillSchema>;
export type VolunteerAvailabilitySchemaType = z.infer<
  typeof volunteerAvailabilitySchema
>;
export type ServingOpportunitySkillSchemaType = z.infer<
  typeof servingOpportunitySkillSchema
>;
