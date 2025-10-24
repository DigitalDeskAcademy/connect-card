# Phase 1: Make stripePriceId Nullable - Implementation Plan

## Current Situation Analysis

### ✅ Completed Work

- **Role Fix Complete**: Successfully updated all 9 files from lowercase "platform_admin" to uppercase "PLATFORM_ADMIN" to match database enum
- **Build Status**: Passing successfully after role fixes (18.0s compile time)
- **Platform Admin Access**: Fixed - users with PLATFORM_ADMIN role can now access /platform/admin

### 🚨 Critical Blocker

- **Issue**: stripePriceId is required (non-nullable) in Course model but Sidecar uses subscription model ($297/month), not per-course pricing
- **Impact**: Cannot create courses without Stripe products, incompatible with B2B subscription model

## Implementation Changes Required

### 1. Update Prisma Schema (`prisma/schema.prisma`)

```prisma
// Line 249 - Change from:
stripePriceId    String       @unique

// To:
stripePriceId    String?      @unique
```

### 2. Update Course Creation Logic (`app/admin/courses/create/actions.ts`)

```typescript
// Lines 82-101 - Make Stripe product creation conditional:
let stripePriceId: string | null = null;

if (validation.data.price > 0) {
  const data = await stripe.products.create({
    name: validation.data.title,
    description: validation.data.smallDescription,
    default_price_data: {
      currency: "usd",
      unit_amount: validation.data.price * 100,
    },
  });
  stripePriceId = data.default_price as string;
}

await prisma.course.create({
  data: {
    ...validation.data,
    userId: session?.user.id as string,
    stripePriceId, // Now nullable
  },
});
```

### 3. Update Platform Course Creation (`app/platform/admin/courses/create/actions.ts`)

- Apply same conditional Stripe product creation logic as above
- Line 101: Handle null stripePriceId

### 4. Update Enrollment Logic (`app/(public)/courses/[slug]/actions.ts`)

```typescript
// Line 346 - Add conditional logic:
if (!course.stripePriceId || course.price === 0) {
  // Direct enrollment for free courses
  await tx.enrollment.update({
    where: { id: enrollment.id },
    data: { status: "Active" },
  });
  return {
    status: "success",
    message: "Enrolled in free course successfully",
  };
}

// Existing Stripe checkout flow for paid courses
const checkoutSession = await stripe.checkout.sessions.create({
  // ... existing code
});
```

### 5. Update Seed Scripts (`prisma/seed-courses.ts`)

```typescript
// Line 758 - Make stripePriceId conditional:
stripePriceId: course.price > 0 ? stripeProduct.default_price as string : null,
```

### 6. Update Agency Data Scope (`lib/agency-data-scope.ts`)

```typescript
// Line 161 - Remove temporary assignment:
stripePriceId: courseData.price > 0 ? generateStripePrice() : null,
```

## Migration Strategy

### Step 1: Create Migration

```bash
pnpm prisma migrate dev --name make-stripe-price-id-nullable
```

### Step 2: Update Code

1. Update all 6 files with conditional logic
2. Ensure TypeScript types are updated
3. Test build passes

### Step 3: Test Scenarios

- Create free course (price = 0)
- Create paid course (price > 0)
- Enroll in free course
- Enroll in paid course
- Verify existing courses work

## Testing Checkpoints

- [ ] Can create course without Stripe product (price = 0)
- [ ] Can create course with Stripe product (price > 0)
- [ ] Can enroll in free course without payment
- [ ] Can enroll in paid course with Stripe checkout
- [ ] Existing courses with stripePriceId work unchanged
- [ ] Build passes successfully
- [ ] No TypeScript errors
- [ ] Platform admin can access all admin routes

## Risk Mitigation

- **Backward Compatible**: Existing courses with stripePriceId continue working
- **Gradual Migration**: Can transition from per-course to subscription pricing over time
- **Database Safety**: Migration is reversible if issues arise
- **Type Safety**: TypeScript will catch any missed updates

## Success Criteria

1. Platform supports both free and paid courses
2. B2B subscription model can be implemented
3. No breaking changes to existing functionality
4. All tests pass and build succeeds

## Next Phase Preview

**Phase 2**: Update course categories and make price optional in UI

- Add B2B-specific categories
- Update course creation form
- Implement subscription-based access control
