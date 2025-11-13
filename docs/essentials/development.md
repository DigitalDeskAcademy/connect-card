# Development Documentation

This document consolidates technical implementation guides, validation patterns, and development workflows.

## 🔧 Technical Implementation Guide

### Project Architecture - Vertical Slice Pattern

This project follows **Vertical Slice Architecture** principles for better maintainability:

- **Feature-Based Organization**: Each feature contains all its concerns (UI, business logic, data access)
- **Colocation**: Related functionality kept together rather than separated by technical layers
- **Minimal Coupling**: Features are loosely coupled and can be developed independently
- **Domain-Driven Structure**: Code organized around business capabilities

#### Example Structure

```
app/
├── admin/
│   └── courses/           # Courses vertical slice
│       ├── create/        # Course creation sub-slice
│       ├── [id]/         # Course detail sub-slice
│       └── page.tsx      # Course listing
├── data/
│   └── admin/            # Data access layer for admin features
│       └── admin-get-courses.ts
```

### Tech Stack

- **Next.js 15.3.4** + React 19 + TypeScript 5
- **Neon PostgreSQL** + Prisma ORM 6.10.1
- **Better Auth 1.2.9** + GitHub OAuth + Email OTP
- **Stripe 18.4.0** + webhooks
- **Tigris S3** + Arcjet security

### Essential Commands

```bash
pnpm build          # Build for production (14.0s compile time)
pnpm lint           # ESLint check (clean)
pnpm format         # Format all files
pnpm dev            # Local development server
npx prisma db push  # Sync schema changes
npx prisma generate # Generate Prisma client
npx tsx prisma/seed.ts  # Seed complete production data
```

### Environment Variable Management

**For Git Worktrees: Use direnv (Automatic Loading)**

If you're using git worktrees for parallel development, use **direnv** to automatically load environment variables:

```bash
# Install direnv (one-time setup)
sudo apt install direnv -y

# Add to shell
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc

# The project already has .envrc configured
# Just allow direnv when you first enter the directory
cd /path/to/connect-card
direnv allow
```

**How it works:**

- `.envrc` in parent directory contains `dotenv`
- When you `cd` into any worktree, direnv loads `../.env` automatically
- No manual copying of `.env` files needed
- All worktrees stay in sync automatically

**For Regular Development:**

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit with your credentials
nano .env
```

**See `/docs/worktree-setup.md` for complete worktree configuration guide.**

## 👥 User Roles & Multi-Tenant Architecture

### User Roles (UserRole Enum)

```typescript
enum UserRole {
  platform_admin  // Church Connect Card platform administrators
  church_owner    // Church primary account holder, billing admin
  church_admin    // Church staff member with management access
  user           // Church volunteer or member with limited access
}
```

### Organization Flow

1. **New User Signup**:

   - User authenticates (GitHub/Email OTP)
   - Redirected to `/setup/organization`
   - Creates organization with trial period
   - Becomes `agency_owner` of new organization

2. **Existing User Login**:
   - User authenticates
   - `/auth/callback` checks role and organization
   - Redirects based on role:
     - `platform_admin` → `/platform/admin`
     - `agency_owner/agency_admin` → `/agency/[slug]/admin`
     - `user` → `/agency/[slug]/learning`

### Organization Schema

```typescript
// Organization setup validation
export const organizationSetupSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(50, "Organization name must be less than 50 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be less than 30 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
});
```

## 🛡️ Zod Validation Patterns

### Core Validation Schemas

#### Course Schema

```typescript
// lib/zodSchemas.ts
export const courseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  smallDescription: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  description: z.string().min(1, "Full description is required"),
  thumbnailUrl: z
    .string()
    .url("Please provide a valid thumbnail URL")
    .optional()
    .or(z.literal("")),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(999999, "Price too high"),
  level: z.nativeEnum(CourseLevel),
  status: z.nativeEnum(CourseStatus).optional(),
});
```

#### Lesson Schema

```typescript
export const lessonSchema = z.object({
  name: z.string().min(1, "Lesson name is required"),
  description: z.string().min(1, "Description is required"),
  videoKey: z.string().min(1, "Video is required"),
  thumbnailKey: z.string().min(1, "Thumbnail is required"),
  chapterId: z.string().min(1, "Chapter ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
});
```

### Validation Best Practices

#### Server Actions with Validation

```typescript
export async function createCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  // 1. Admin authentication
  const session = await requireAdmin();

  // 2. Rate limiting with Arcjet
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  // 3. Zod validation
  const validation = courseSchema.safeParse(values);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data",
    };
  }

  // 4. Business logic
  const stripeProduct = await stripe.products.create({
    name: validation.data.title,
    // ...
  });

  // 5. Database operation
  await prisma.course.create({
    data: {
      ...validation.data,
      userId: session.user.id,
      stripePriceId: stripeProduct.default_price as string,
    },
  });

  return { status: "success", message: "Course created successfully" };
}
```

#### Form Validation with React Hook Form

```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

export function CourseForm() {
  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      smallDescription: "",
      // ...
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

### Common Validation Patterns

#### File Upload Validation

```typescript
const fileUploadSchema = z.object({
  courseId: z.string().optional(),
  fileType: z.enum(["thumbnail", "video"]).optional(),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().max(50 * 1024 * 1024, "File too large (50MB max)"),
});
```

#### Pagination Schema

```typescript
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});
```

## 🔄 Development Workflow

### Git Workflow

1. **Feature Branches**: Create feature branches from `main`
2. **Commit Messages**: Use conventional commits (`feat:`, `fix:`, `docs:`)
3. **Pull Requests**: All changes go through PR review
4. **CI/CD**: Build and lint checks on all PRs

### Code Quality Standards

- **ESLint**: Zero warnings in production
- **TypeScript**: Strict mode enabled, no `any` types
- **Prettier**: Consistent code formatting
- **Prisma**: Type-safe database operations only

### Testing Strategy

```typescript
// Example test structure
describe("Course Creation", () => {
  it("should create course with valid data", async () => {
    const validCourseData = {
      title: "Test Course",
      smallDescription: "Test description",
      // ...
    };

    const result = await createCourse(validCourseData);
    expect(result.status).toBe("success");
  });

  it("should reject invalid course data", async () => {
    const invalidData = { title: "" }; // Missing required fields

    const result = await createCourse(invalidData);
    expect(result.status).toBe("error");
  });
});
```

### Performance Monitoring

- **Build Time**: Target < 15s (currently 14.0s)
- **Bundle Size**: Monitor with `@next/bundle-analyzer`
- **Core Web Vitals**: Track LCP, CLS, FID
- **Database Queries**: Monitor with Prisma metrics

## 🎨 UI Development Patterns

### Component Structure

```typescript
// components/ui/course-card.tsx
interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    thumbnailUrl?: string
    price: number
  }
  variant?: 'default' | 'compact'
  onEnroll?: (courseId: string) => void
}

export function CourseCard({ course, variant = 'default', onEnroll }: CourseCardProps) {
  return (
    <Card className={cn("course-card", variant === 'compact' && "course-card--compact")}>
      {/* Component implementation */}
    </Card>
  )
}
```

### Brand Guidelines

- **Primary Color**: Sky Blue `#7DD3FC` (`text-primary`, `bg-primary`)
- **Secondary Color**: Purple `#8D6A9F` (`text-purple-500`)
- **Data Visualization**: Use brand colors in priority order

### Responsive Design Patterns

```typescript
// Responsive grid system
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {courses.map(course => (
    <CourseCard key={course.id} course={course} />
  ))}
</div>

// Mobile-first breakpoints
className="text-sm md:text-base lg:text-lg"
```

## 🔒 Security Patterns

### Authentication with Better Auth

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_CLIENT_ID!,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // In development, log OTP to console
        if (process.env.NODE_ENV === "development") {
          console.log(`🔐 OTP for ${email}: ${otp}`);
        }
        // Send email via Resend
        await resend.emails.send({
          from: "Church Connect Card <onboarding@resend.dev>",
          to: [email],
          subject: "Verify your email",
          html: `<p>Your verification code: <strong>${otp}</strong></p>`,
        });
      },
    }),
    organization({
      allowUserToCreateOrganization: async user => {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        return (
          dbUser?.role === "agency_owner" || dbUser?.role === "platform_admin"
        );
      },
    }),
  ],
});
```

### Authentication Flow Patterns

#### Email Check Before Authentication

```typescript
// Prevent user creation on login attempts
async function checkEmailExists(email: string): Promise<boolean> {
  const res = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const { exists } = await res.json();
  return exists;
}
```

### Rate Limiting with Arcjet

```typescript
import arcjet, { fixedWindow } from "@/lib/arcjet";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

// Usage in server actions
const decision = await aj.protect(req, {
  fingerprint: session.user.id,
});

if (decision.isDenied()) {
  return { status: "error", message: "Rate limit exceeded" };
}
```

### Input Sanitization

```typescript
// Always validate and sanitize user input
const sanitizedTitle = validation.data.title.trim();
const sanitizedDescription = validation.data.description.replace(
  /<script>/g,
  ""
);
```

## 📁 File Organization

### Directory Structure

```
app/
├── (auth)/             # Authentication pages
│   ├── login/         # Login with email/GitHub
│   ├── signup/        # New agency registration
│   ├── verify-request/# OTP verification
│   └── verify-signup/ # Signup verification
├── (public)/          # Public routes (marketing)
│   ├── signup/        # Marketing signup page
│   └── pricing/       # Pricing information
├── auth/
│   └── callback/      # Post-auth redirect handler
├── setup/
│   └── organization/  # Organization setup flow
├── platform/
│   └── admin/         # Platform admin dashboard
├── agency/
│   └── [slug]/        # Agency-specific routes
│       ├── admin/     # Agency admin dashboard
│       └── learning/  # Agency learning portal
├── admin/             # Legacy admin routes
├── my-learning/       # Student learning interface
├── api/               # API routes and webhooks
│   └── auth/
│       └── check-email/ # Email existence check
├── data/              # Data access layer
└── components/        # Shared UI components

lib/
├── auth.ts           # Better Auth configuration
├── auth-client.ts    # Client-side auth
├── db.ts             # Prisma database client
├── stripe.ts         # Stripe configuration
└── zodSchemas.ts     # Validation schemas
```

### Import Patterns

```typescript
// Use absolute imports with @ alias
import { prisma } from "@/lib/db";
import { courseSchema } from "@/lib/zodSchemas";
import { requireAdmin } from "@/app/data/admin/require-admin";

// Group imports logically
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
```

---

_Last updated: 2025-01-14_
