---
description: Generate server action with security patterns (rate limiting, auth, validation)
argument-hint: [action-name] [action-type]
---

# Add Server Action

Generate a server action following ALL security patterns from coding-patterns.md.

**Usage:** `/add-server-action [action-name] [action-type]`

**Action Types:**

- `create` - Create new record
- `update` - Update existing record
- `delete` - Delete record
- `custom` - Custom business logic

**Examples:**

- `/add-server-action createChurchMember create`
- `/add-server-action updateConnectCardStatus update`
- `/add-server-action deleteVolunteerAssignment delete`
- `/add-server-action sendFollowUpEmail custom`

## Your Tasks:

### 1. Parse Action Information

Extract from `$ARGUMENTS`:

- **Action name:** Function name (e.g., `createChurchMember`)
- **Action type:** create/update/delete/custom
- **Feature context:** Which feature this belongs to

**Ask user for additional context:**

- What data model does this operate on?
- Is this a church-scoped or platform-scoped action?
- What Zod schema should be used? (or should we create one?)

### 2. Check Existing Similar Actions

Search for similar implementations:

```bash
# Find similar actions
find actions -name "*.ts" -type f | head -10
```

Read 1-2 similar actions to match patterns.

### 3. Create Zod Schema (if needed)

**Location:** `/lib/zodSchemas.ts`

```typescript
export const <ActionName>Schema = z.object({
  field1: z.string().min(1, { message: "Field is required" }),
  field2: z.string().email({ message: "Invalid email" }),
  // ... more fields
});

export type <ActionName>SchemaType = z.infer<typeof <ActionName>Schema>;
```

**IMPORTANT:** Use generic validation messages, not field-specific (coding-patterns.md line 80).

### 4. Generate Server Action File

**File Location:**

- Church actions: `/actions/church/<feature>/actions.ts`
- Platform actions: `/actions/platform/<feature>/actions.ts`
- Shared actions: `/actions/<feature>/actions.ts`

**Template (Full Pattern from coding-patterns.md lines 24-106):**

```typescript
"use server";

import { requireUser } from "@/app/data/require-user"; // or requireAdmin
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { <ActionName>Schema, <ActionName>SchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

// Rate limiting configuration
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5, // 5 requests per minute (standard)
  })
);

/**
 * <Action Description>
 *
 * @param data - Validated input data
 * @returns ApiResponse with success/error status
 *
 * @security
 * - Rate limited: 5 requests/minute
 * - Authentication required
 * - Multi-tenant data isolation (organizationId)
 */
export async function <actionName>(
  data: <ActionName>SchemaType
): Promise<ApiResponse> {
  // 1. Authentication check
  const session = await requireUser(); // or requireAdmin() for platform actions

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: session.user.id, // Add organizationId for multi-tenant: ${session.user.id}_${organizationId}
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
  const validation = <ActionName>Schema.safeParse(data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data", // Generic message - never expose validation details
    };
  }

  try {
    // 4. Business logic
    // CRITICAL: ALWAYS include organizationId for multi-tenant isolation
    await prisma.<model>.create({
      data: {
        ...validation.data,
        organizationId: session.user.organizationId, // REQUIRED for multi-tenant
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

### 5. Action-Specific Patterns

**For CREATE actions:**

```typescript
await prisma.<model>.create({
  data: {
    ...validation.data,
    organizationId: session.user.organizationId, // REQUIRED
    userId: session.user.id,
  },
});
```

**For UPDATE actions:**

```typescript
// Verify ownership before update
const existing = await prisma.<model>.findUnique({
  where: {
    id: data.id,
    organizationId: session.user.organizationId, // Multi-tenant safety
  },
});

if (!existing) {
  return {
    status: "error",
    message: "Record not found",
  };
}

await prisma.<model>.update({
  where: { id: data.id },
  data: validation.data,
});
```

**For DELETE actions:**

```typescript
// Verify ownership before delete
await prisma.<model>.delete({
  where: {
    id: data.id,
    organizationId: session.user.organizationId, // Multi-tenant safety
  },
});
```

**For MULTI-TABLE operations (use transactions):**

```typescript
await prisma.$transaction(async (tx) => {
  await tx.model1.create({ ... });
  await tx.model2.update({ ... });
});
```

### 6. Security Checklist

Verify the action includes:

✅ **"use server"** directive at top of file
✅ **Rate limiting** with Arcjet (5 req/min standard)
✅ **Authentication** (`requireUser` or `requireAdmin`)
✅ **Zod validation** with `safeParse()`
✅ **ApiResponse return type** (never custom types)
✅ **organizationId filter** for multi-tenant isolation
✅ **Generic error messages** (don't expose internals)
✅ **No console.error** in error handling
✅ **Transactions** for multi-table updates
✅ **Path revalidation** if UI needs refresh

### 7. Multi-Tenant Fingerprinting

**For church-scoped actions:**

```typescript
fingerprint: `${session.user.id}_${organizationId}`,
```

**For platform-scoped actions:**

```typescript
fingerprint: session.user.id,
```

This prevents rate limit bypass across organizations.

### 8. Generate Form Component (Optional)

If user wants a form component to use this action, scaffold it following pattern from coding-patterns.md lines 127-191:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { <actionName> } from "@/actions/<feature>/actions";
import { <ActionName>Schema, <ActionName>SchemaType } from "@/lib/zodSchemas";

export function <ComponentName>Form() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<<ActionName>SchemaType>({
    resolver: zodResolver(<ActionName>Schema),
    defaultValues: {
      // Set defaults
    },
  });

  function onSubmit(values: <ActionName>SchemaType) {
    startTransition(async () => {
      const result = await <actionName>(values);

      if (result.status === "success") {
        toast.success(result.message);
        router.push("/redirect/path");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
        <FormField
          control={form.control}
          name="fieldName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
  );
}
```

## Important Rules:

- ✅ ALWAYS include rate limiting (no exceptions)
- ✅ ALWAYS use authentication helpers (requireUser/requireAdmin)
- ✅ ALWAYS return ApiResponse type
- ✅ ALWAYS include organizationId for multi-tenant isolation
- ✅ ALWAYS use generic error messages
- ✅ ALWAYS use transactions for multi-table operations
- ❌ NEVER skip validation
- ❌ NEVER expose specific error details to users
- ❌ NEVER use console.error in production code
- ❌ NEVER create custom return types (use ApiResponse)
- ❌ NEVER skip organizationId for church data

## Error Prevention:

**Common Security Vulnerabilities to Avoid:**

1. **Missing Rate Limiting** → DDoS vulnerability
2. **No Authentication** → Unauthorized access
3. **Missing organizationId** → Cross-tenant data leakage
4. **Exposed Error Details** → Information disclosure
5. **No Input Validation** → SQL injection, XSS
6. **Missing Transactions** → Data inconsistency
7. **Hardcoded IDs** → Authorization bypass

**CRITICAL:** This action will be exposed to the internet. Follow ALL security patterns without exception.

## Next Steps:

After generating the action, test it:

1. Create a test form component (if needed)
2. Test with valid data → Should succeed
3. Test with invalid data → Should show validation error
4. Test rate limiting → Hit endpoint 6x in 1 minute → Should block
5. Test multi-tenant isolation → Verify can't access other org's data
6. Test authentication → Verify requires login

**Document in ADR if this action introduces new patterns or deviates from standards.**
