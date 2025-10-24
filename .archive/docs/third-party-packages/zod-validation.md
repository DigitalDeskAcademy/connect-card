# Zod Schema Validation

## Package Overview

- **Package**: `zod`
- **Purpose**: Runtime type validation and schema definition
- **Installation Date**: Form handling and API validation phase
- **TypeScript Support**: ✅ Built-in declarations, generates TypeScript types

## Why Zod?

- **Type-Safe**: Generates TypeScript types automatically from schemas
- **Runtime Validation**: Validates data at runtime, not just compile time
- **Developer Experience**: Clear error messages and intuitive API
- **Framework Agnostic**: Works with any form library or API framework
- **Small Bundle**: Minimal impact on bundle size

## Implementation Details

### Key Use Cases:

- **Form Validation**: React Hook Form integration
- **API Route Validation**: Validate request bodies and params
- **Environment Variables**: Type-safe environment variable parsing
- **Database Schemas**: Ensure data integrity before database operations

### Basic Schema Example:

```typescript
import { z } from "zod";

const CourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
  duration: z.number().int().min(1, "Duration must be at least 1 hour"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

type Course = z.infer<typeof CourseSchema>; // Auto-generated TypeScript type
```

### Integration with React Hook Form:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<Course>({
  resolver: zodResolver(CourseSchema),
  defaultValues: {
    title: "",
    description: "",
    price: 0,
    duration: 1,
    level: "Beginner",
  },
});
```

## Usage in LMS:

### Form Validation:

- **Course Creation**: Validate all course fields before submission
- **User Input**: Ensure proper email formats, password requirements
- **File Uploads**: Validate file types and sizes
- **Settings**: Validate configuration changes

### API Route Protection:

```typescript
// API route validation
const CreateCourseRequest = z.object({
  title: z.string().min(1),
  price: z.number().min(0),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = CreateCourseRequest.parse(body); // Throws if invalid

  // Proceed with validated data
}
```

### Environment Variable Validation:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

## Error Handling:

```typescript
try {
  const validData = schema.parse(userInput);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
    console.log(error.errors); // Detailed error information
  }
}
```

## Key Features Used:

- **String Validation**: `.min()`, `.max()`, `.email()`, `.url()`
- **Number Validation**: `.min()`, `.max()`, `.int()`, `.positive()`
- **Enum Validation**: `.enum()` for predefined values
- **Object Validation**: `.object()` for complex data structures
- **Array Validation**: `.array()` for lists of items
- **Optional Fields**: `.optional()` for nullable fields

## Alternatives Considered:

- **Yup**: Popular but larger bundle size and less TypeScript-friendly
- **Joi**: Server-focused, not optimized for browser usage
- **Ajv**: JSON Schema based, more verbose syntax
- **Manual Validation**: Error-prone and time-consuming to maintain

## Integration Points:

- **React Hook Form**: `@hookform/resolvers/zod` for seamless integration
- **tRPC**: Native Zod support for end-to-end type safety
- **Prisma**: Can generate Zod schemas from database schema
- **Next.js API Routes**: Validate request/response data

## Performance Considerations:

- **Schema Reuse**: Define schemas once, reuse across components
- **Lazy Validation**: Use `.safeParse()` for non-throwing validation
- **Transform**: Use `.transform()` to modify data during validation
- **Refinement**: Use `.refine()` for custom validation logic

## Troubleshooting:

- **Type Errors**: Ensure Zod schema matches expected TypeScript types
- **Validation Failures**: Check error messages in `error.errors` array
- **Performance**: Avoid recreating schemas in render loops
- **Circular References**: Be careful with recursive schema definitions

## Future Enhancements:

- **Custom Validators**: Add business-specific validation rules
- **Internationalization**: Translate error messages for global users
- **Dynamic Schemas**: Generate schemas based on user permissions/roles
- **OpenAPI Integration**: Generate API documentation from Zod schemas
