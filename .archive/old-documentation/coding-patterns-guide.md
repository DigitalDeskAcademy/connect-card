# Sidecar Platform - Coding Patterns Guide

This guide documents the coding patterns, conventions, and methodologies used throughout the Sidecar platform. Follow these patterns to maintain consistency across the codebase.

## Core Principles

1. **Pattern Consistency**: Always research existing implementations before creating new features
2. **No New Patterns**: Don't introduce new libraries or patterns without discussion
3. **TypeScript First**: Strict typing throughout the application
4. **Component Reusability**: Use existing components before creating new ones

## Research Before Implementation

Before implementing any feature:

```bash
# 1. Search for similar patterns
grep -r "pattern" --include="*.tsx" --include="*.ts"

# 2. Check existing components
find app/ -name "*.tsx" | xargs grep "similarFeature"

# 3. Review existing layouts and pages
ls -la app/[area]/[feature]/
```

## Interface Naming Convention

**Always use `iAppProps` for component props:**

```typescript
// ✅ CORRECT
interface iAppProps {
  title: string;
  data: SomeType;
  children?: ReactNode;
}

// ❌ WRONG
interface Props {}
interface ComponentProps {}
interface IAppProps {} // Wrong capitalization
```

## Component Structure

### Server Components (Default)

```typescript
// No "use client" directive - server component by default
import { someServerFunction } from "@/app/data/feature/server-function";

interface iAppProps {
  params?: Promise<{ id: string }>;  // Next.js 15 async params
}

export default async function ComponentName({ params }: iAppProps) {
  // Server-side data fetching
  const data = await someServerFunction();

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Client Components

```typescript
"use client";  // Required for hooks, browser APIs, event handlers

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";

interface iAppProps {
  data: ClientSideDataType;
}

export function ComponentName({ data }: iAppProps) {
  const [state, setState] = useState();
  const pathname = usePathname();

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## Navigation & Active States

### URL-based Active States

```typescript
"use client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const pathname = usePathname();
const isActive = pathname === item.url;

// Apply active styles
className={cn(
  "base-classes",
  isActive && "bg-accent text-accent-foreground"
)}
```

### Link Components

```typescript
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// As a button-styled link
<Link
  href="/path"
  className={buttonVariants({ variant: "outline" })}
>
  Link Text
</Link>

// As a simple link
<Link href="/path" className="text-primary hover:underline">
  Link Text
</Link>
```

## Form Patterns

### Form Setup with Zod & React Hook Form

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

// 1. Define schema
const formSchema = z.object({
  field: z.string().min(1, "Required"),
});

type FormSchemaType = z.infer<typeof formSchema>;

// 2. Component
export function FormComponent() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field: "",
    },
  });

  function onSubmit(values: FormSchemaType) {
    startTransition(async () => {
      const result = await serverAction(values);

      if (result.status === "success") {
        toast.success(result.message);
        router.push("/destination");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Server Actions Pattern

```typescript
"use server";

import { ApiResponse } from "@/lib/types";
import { requireUser } from "@/app/data/user/require-user";

export async function actionName(data: SchemaType): Promise<ApiResponse> {
  try {
    // Authentication check
    const user = await requireUser();

    // Validation
    const result = schema.safeParse(data);
    if (!result.success) {
      return { status: "error", message: "Invalid data" };
    }

    // Business logic

    return { status: "success", message: "Operation completed" };
  } catch (error) {
    return { status: "error", message: "An error occurred" };
  }
}
```

## Layout Patterns

### Nested Layout Structure

```typescript
import { ReactNode } from "react";

interface iAppProps {
  children: ReactNode;
  params?: Promise<{ slug?: string }>;
}

export default async function Layout({ children, params }: iAppProps) {
  // Optional data fetching

  return (
    <div className="flex flex-1">
      {/* Sidebar or navigation */}
      <div className="w-64 border-r border-border shrink-0">
        {/* Sidebar content */}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

## Styling Patterns

### Using cn() Utility

```typescript
import { cn } from "@/lib/utils";

// Conditional classes
className={cn(
  "base-classes always-applied",
  condition && "conditional-classes",
  isActive && "active-classes",
  {
    "object-syntax": someCondition,
    "another-class": anotherCondition,
  }
)}
```

### Common Class Patterns

```typescript
// Text truncation
className = "truncate max-w-[200px]";

// Flexbox patterns
className = "flex items-center justify-between gap-4";

// Responsive design
className = "px-4 lg:px-6 md:gap-6";

// Transitions
className = "transition-opacity duration-200";
```

## Data Fetching Patterns

### Server-Side Data Fetching

```typescript
// In app/data/[feature]/get-data.ts
export async function getData(id: string) {
  const user = await requireUser();

  const data = await prisma.model.findUnique({
    where: { id, userId: user.id },
    select: {
      // Explicit field selection
    },
  });

  return data;
}
```

### Client-Side Hooks

```typescript
// Custom hooks in hooks/ directory
export function useCustomHook({ data }: { data: DataType }) {
  const [state, setState] = useState();

  useEffect(() => {
    // Effect logic
  }, [dependency]);

  return { state /* other values */ };
}
```

## Component Composition

### Card Pattern

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Tabs Pattern

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    {/* Tab 1 content */}
  </TabsContent>
  <TabsContent value="tab2">
    {/* Tab 2 content */}
  </TabsContent>
</Tabs>
```

## Icons Usage

Always use Tabler icons:

```typescript
import {
  IconHome,
  IconSettings,
  IconUser
} from "@tabler/icons-react";

// Usage
<IconHome className="h-4 w-4" />
```

## Error Handling

### Try-Catch Pattern

```typescript
import { tryCatch } from "@/hooks/try-catch";

const { data, error } = await tryCatch(someAsyncFunction());

if (error) {
  // Handle error
  return;
}

// Use data
```

## File Organization

### Directory Structure

```
app/
├── [user-context]/           # platform/admin, agency/[slug]
│   └── [feature]/           # courses, settings, etc.
│       ├── page.tsx         # Main page
│       ├── layout.tsx       # Optional layout
│       ├── actions.ts       # Server actions
│       └── _components/     # Feature-specific components
│           └── Component.tsx
├── data/                    # Data access layer
│   └── [feature]/
│       └── get-data.ts
└── hooks/                   # Reusable hooks
    └── use-feature.ts
```

## Common Utilities

### Toast Notifications

```typescript
import { toast } from "sonner";

toast.success("Success message");
toast.error("Error message");
toast.info("Info message");
```

### Loading States

```typescript
const [pending, startTransition] = useTransition();

<Button disabled={pending}>
  {pending && <Loader2 className="animate-spin" />}
  Button Text
</Button>
```

## Type Safety

### Database Types

```typescript
// Use Prisma generated types
import { Course, User } from "@prisma/client";

// Create specific types for data shapes
export type CourseWithChapters = Course & {
  chapters: Chapter[];
};
```

### API Response Types

```typescript
import { ApiResponse } from "@/lib/types";

// Always return ApiResponse from server actions
export async function action(): Promise<ApiResponse> {
  return {
    status: "success" | "error",
    message: string,
  };
}
```

## Testing Patterns

Before implementing:

1. Check similar existing implementations
2. Test with different user roles
3. Verify responsive design
4. Check loading and error states
5. Test form validation

## Anti-Patterns to Avoid

❌ **DON'T:**

- Create new naming conventions
- Use console.log in production code
- Import CSS files directly
- Use any type
- Create deeply nested components
- Use inline styles extensively
- Implement complex client-side state management
- Create custom hooks for simple logic

✅ **DO:**

- Follow existing patterns
- Use proper TypeScript types
- Use Tailwind classes
- Keep components focused
- Use server components by default
- Leverage existing utilities

## Quick Reference

| Pattern             | File/Example                    |
| ------------------- | ------------------------------- |
| Form Implementation | `EditCourseForm.tsx`            |
| Sidebar Navigation  | `CourseSidebar.tsx`             |
| Active States       | `nav-main.tsx`                  |
| Layout Structure    | `my-learning/[slug]/layout.tsx` |
| Server Actions      | `actions.ts` files              |
| Data Fetching       | `app/data/` directory           |

## When in Doubt

1. Search for similar patterns in the codebase
2. Check existing components first
3. Follow the simplest working example
4. Ask before introducing new patterns
5. Keep it simple for v1

This guide is a living document. Update it when patterns evolve, but maintain backward compatibility.
