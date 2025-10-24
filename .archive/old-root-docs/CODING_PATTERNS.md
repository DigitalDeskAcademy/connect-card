# Coding Patterns & Standards

This document defines the coding patterns and standards for the LMS Project to ensure consistency across all code contributions.

## 🎯 Core Principles

1. **Security First** - Always include rate limiting and proper authentication
2. **Consistency** - Follow established patterns, don't introduce new ones without discussion
3. **Simplicity** - Keep error handling and responses simple and generic
4. **Type Safety** - Use TypeScript types consistently (ApiResponse, defined schemas)
5. **Context Awareness** - Use hooks for context-dependent logic, never hardcode URLs

## 📁 Before Writing New Code

### Checklist for Claude and Developers

1. **Check existing similar files first** - Find 2-3 similar implementations
2. **Match patterns exactly** - Don't deviate from established patterns
3. **Use existing types** - ApiResponse, schemas, etc.
4. **Include security measures** - Rate limiting, authentication checks
5. **Follow file naming conventions** - actions.ts, page.tsx, etc.

## 🔒 Server Actions Pattern

### Standard Template

```typescript
"use server";

import { requireUser } from "@/app/data/require-user"; // or requireAdmin
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { [schema], [SchemaType] } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

// Rate limiting configuration
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function actionName(
  data: SchemaType
): Promise<ApiResponse> {
  // 1. Authentication check
  const session = await requireUser(); // or requireAdmin()

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: "error",
        message: "You have been blocked due to rate limiting",
      };
    } else {
      return {
        status: "error",
        message: "You are a bot! if this is a mistake contact our support",
      };
    }
  }

  // 3. Validation
  const validation = schema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data", // Generic message
    };
  }

  try {
    // 4. Business logic
    await prisma.model.create({
      data: {
        ...validation.data,
        userId: session.user.id,
      },
    });

    // 5. Revalidate paths if needed
    revalidatePath("/relevant/path");

    return {
      status: "success",
      message: "Action completed successfully",
    };
  } catch {
    // 6. Generic error handling - no console.error, no specific messages
    return {
      status: "error",
      message: "Failed to complete action",
    };
  }
}
```

### Key Rules for Server Actions

1. **Always return `ApiResponse` type** - Never create custom return types
2. **Include rate limiting** - 5 requests per minute is standard
3. **Use auth helpers** - `requireUser()` or `requireAdmin()`, not manual checks
4. **Generic error messages** - Don't expose validation details or system errors
5. **No console.error** - Keep error handling simple
6. **Use transactions** - When updating multiple tables

## 🎨 Component Patterns

### Form Components

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ComponentName() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      // Set defaults
    },
  });

  function onSubmit(values: SchemaType) {
    startTransition(async () => {
      const result = await serverAction(values);

      if (result.status === "success") {
        toast.success(result.message);
        router.push("/redirect/path");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## 📝 Zod Schemas

### Location

All schemas go in `/lib/zodSchemas.ts`

### Pattern

```typescript
export const schemaName = z.object({
  field: z.string().min(3, { message: "Generic message" }),
  // Use generic messages, not specific field names
});

export type SchemaNameType = z.infer<typeof schemaName>;
```

## 🗂️ File Structure

### Pages

- `app/[route]/page.tsx` - Server components by default
- Include comprehensive JSDoc comments
- Handle authentication at page level

### Actions

- `app/[route]/actions.ts` - All server actions for that route
- Group related actions in same file
- Use "use server" directive

### Components

- `app/[route]/_components/ComponentName.tsx` - Route-specific components
- `components/ui/` - Shared shadcn components only

## 🧭 Navigation Patterns

### Context-Aware Navigation

All navigation components must use the `useNavigation` hook for context-aware URLs:

```typescript
import { useNavigation } from '@/hooks/use-navigation';

function MyComponent() {
  const { homeUrl, dashboardUrl, coursesUrl, isAdmin } = useNavigation();

  return (
    <nav>
      <Link href={homeUrl}>Home</Link>
      {isAdmin && (
        <>
          <Link href={dashboardUrl}>Dashboard</Link>
          <Link href={coursesUrl}>Courses</Link>
        </>
      )}
    </nav>
  );
}
```

**Never hardcode admin URLs in shared components.** The hook automatically determines the correct URLs based on:

- Organization context (for agency admins)
- User role (for platform admins)
- Authentication state (for regular users)

### Navigation Hook Returns

```typescript
{
  // URLs
  homeUrl: string; // Always '/home' for smart routing
  dashboardUrl: string; // Context-aware admin dashboard
  coursesUrl: string; // Context-aware courses page
  analyticsUrl: string | null;
  usersUrl: string | null;

  // Role flags
  isAdmin: boolean; // Any admin role
  isPlatformAdmin: boolean; // Platform admin specifically
  isAgencyAdmin: boolean; // Agency admin/owner

  // Context data
  organization: Organization | null;
  session: Session | null;
}
```

## ✅ Type Safety

### Always Use Existing Types

```typescript
import { ApiResponse } from "@/lib/types";
import { CourseSchemaType } from "@/lib/zodSchemas";
```

### ApiResponse Type

```typescript
export type ApiResponse = {
  status: "success" | "error";
  message: string;
};
```

Never extend or modify this type without discussion.

## 🔐 Authentication Patterns

### For Admin Actions

```typescript
const session = await requireAdmin();
// Throws if not admin - no need for additional checks
```

### For User Actions

```typescript
const session = await requireUser();
// Throws if not authenticated - no need for additional checks
```

### Never Do This

```typescript
// ❌ Don't do manual checks
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return { status: "error", message: "Unauthorized" };
}
```

## 📊 Database Patterns

### Simple Operations

```typescript
await prisma.model.create({
  data: { ...validation.data },
});
```

### Multi-Table Updates

```typescript
await prisma.$transaction(async (tx) => {
  await tx.model1.create({ ... });
  await tx.model2.update({ ... });
});
```

## 🚫 What NOT to Do

1. **Don't create new return types** - Use ApiResponse
2. **Don't skip rate limiting** - Always include it
3. **Don't expose specific errors** - Keep messages generic
4. **Don't use console.log/error** - Remove before committing
5. **Don't create new patterns** - Follow existing ones

## 📋 Quick Reference for Claude

When asked to create code:

1. First say: "Let me check existing patterns in similar files"
2. Review 2-3 similar implementations
3. Follow the template exactly
4. Use ApiResponse type
5. Include rate limiting
6. Generic error messages
7. No console logging

## 🔄 Common Patterns to Copy From

- **Server Actions**: `/app/admin/courses/create/actions.ts`
- **Form Components**: `/app/(auth)/login/_components/LoginForm.tsx`
- **Page Structure**: `/app/admin/courses/create/page.tsx`
- **Schemas**: `/lib/zodSchemas.ts`

## 🔐 Multi-Tenant Data Scoping Pattern

### Hybrid Approach (Adopted Decision)

We use a hybrid approach for multi-tenant data isolation to balance security, clarity, and maintainability.

#### READ Operations - Use Data Scope Abstraction

For complex queries and reads, use the data scope factory for automatic organization filtering:

```typescript
// Pages and components use createAgencyDataScope
const dataScope = createAgencyDataScope(organization.id);
const courses = await dataScope.getCourses(); // Automatically filtered
const users = await dataScope.getUsers(); // Always scoped to org
```

Benefits:

- Impossible to forget organizationId filter
- Complex business logic centralized (e.g., platform + agency courses)
- Consistent data access patterns

#### WRITE Operations - Direct Prisma with Explicit Scoping

For mutations (create/update/delete), use direct Prisma calls with explicit organizationId:

```typescript
export async function createAgencyCourse(
  slug: string,
  data: CourseSchemaType
): Promise<ApiResponse> {
  const { organization } = await requireAgencyAdmin(slug);

  await prisma.course.create({
    data: {
      ...data,
      organizationId: organization.id, // REQUIRED: Always explicit
      stripePriceId: null, // Agency courses use subscription
    },
  });
}
```

Benefits:

- Clear and explicit data ownership
- Easier to debug and trace
- Follows existing platform patterns

### Critical Multi-Tenant Rules

1. **NEVER** create/update agency data without organizationId
2. **ALWAYS** use requireAgencyAdmin() for agency operations
3. **Platform courses** have organizationId = null (visible to all)
4. **Agency courses** must have valid organizationId (scoped to org)
5. **Use fingerprinting** in rate limiting: `${userId}_${organizationId}`

### Data Access Patterns

```typescript
// ❌ WRONG - Missing organization scope
await prisma.course.create({ data: { title: "..." } });

// ✅ CORRECT - Explicit organization scope
await prisma.course.create({
  data: {
    title: "...",
    organizationId: organization.id,
  },
});

// ✅ CORRECT - Using data scope for reads
const scope = createAgencyDataScope(orgId);
const courses = await scope.getCourses();
```

This hybrid pattern ensures data isolation while maintaining code clarity and follows industry best practices for B2B SaaS multi-tenancy.

---

**Remember**: When in doubt, copy an existing pattern rather than creating a new one.
