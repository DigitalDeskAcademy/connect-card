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
    visit_status: z.string().nullable().optional(), // Extract actual text from card
    first_time_visitor: z.boolean().nullable().optional(), // Legacy field
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
