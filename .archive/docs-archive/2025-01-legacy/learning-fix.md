# Learning Fix - End User Course Access

**Branch**: `feat/end-user-learning-experience`
**Created**: 2025-01-23
**Updated**: 2025-01-25
**Status**: ✅ COMPLETE - End users can now browse and access courses
**Priority**: CRITICAL - Platform non-functional for primary users

---

## 🚨 THE PROBLEM (In Simple Terms)

Your end users have a broken experience - it's like having Netflix but no movies show up!

**Current Situation (FIXED IN THIS BRANCH):**

- ✅ Users can log in via `/agency/[slug]/login`
- ✅ Users see dashboard at `/agency/[slug]/learning`
- ✅ **Can browse available courses** at `/agency/[slug]/learning/courses`
- ✅ **Can enroll in courses** (enrollment system implemented)
- ✅ **Can view lesson content** (CourseContent component with video playback)
- ✅ **Can track progress** (mark complete/incomplete functionality)

**Root Cause**: During multi-tenant migration, learning functionality got left in `.backup-single-tenant/` folder and was never adapted.

---

## 🎉 ISSUES RESOLVED (2025-01-25)

**All Critical Issues Fixed:**

- ✅ Fixed SharedCourseCard navigation link (was 404, now works)
- ✅ Created course overview page that redirects to first lesson
- ✅ Added course-specific layout with CourseSidebar
- ✅ Users can now enter courses and navigate between lessons

**Working User Flow:**

1. User browses courses ✅
2. Clicks "Start Learning" → enters course ✅
3. Redirected to first lesson automatically ✅
4. Has course sidebar for lesson navigation ✅
5. Can mark lessons complete/incomplete ✅

---

## ⚠️ CRITICAL: DO THIS FIRST!

### Prerequisites Before Starting

**1. Component Refactoring ( #1 Priority)**

- [ ] Complete EditCourseForm extraction (ACTION_PLAN.md Day 1)
- [ ] Complete CourseStructure extraction
- [ ] Establish `/components/courses/` directory
- **Why**: Creates the foundation we'll build on, prevents making duplication worse

**2. Test Environment Setup**

- [ ] Dev server running (`pnpm dev` - watch for OTP codes)
- [ ] Test user accounts ready:
  - End user account (role: `end_user`)
  - Agency admin account (role: `agency_admin`)
  - Platform admin account (role: `platform_admin`)
- [ ] At least one test course in database
- [ ] Git branch created for safe work

---

## 🦺 SAFETY MEASURES (Don't Be Scared!)

### Feature Flags for Easy Rollback

```typescript
// Can disable everything if needed
const LEARNING_FEATURES = {
  COURSE_BROWSING: true, // Set false to disable
  ENROLLMENT: true, // Set false to disable
  LESSON_VIEWING: true, // Set false to disable
  PROGRESS_TRACKING: true, // Set false to disable
};
```

### Testing After EVERY Change

```bash
# Run these after each modification:
pnpm build     # Verify it compiles (2 min)
pnpm lint      # Check for issues (30 sec)
pnpm dev       # Test locally

# Manual testing checklist:
- [ ] Platform admin can still edit courses
- [ ] Agency admin can still manage courses
- [ ] End users can see new features
- [ ] Nothing broke that was working before
```

### Rollback Plan If Something Breaks

```bash
# Quick rollback:
git status                    # See what changed
git diff                      # Review changes
git checkout -- [filename]    # Undo specific file
git stash                     # Save but remove all changes

# Nuclear option (start fresh):
git checkout main
git branch -D feat/end-user-learning-experience
git checkout -b feat/end-user-learning-experience-v2
```

---

## 📋 STEP-BY-STEP IMPLEMENTATION (Go Slow!)

### Overview: What We're Building

1. **Extract** existing components from backup (they work!)
2. **Adapt** them for multi-tenant (add organization context)
3. **Test** with one user before rolling out
4. **Enable** features one at a time

### Detailed Step-by-Step Process (What to Expect)

**Step 1: Investigation Phase** (30 min)

```bash
# We'll examine backup files (READ ONLY - no changes)
ls .backup-single-tenant/my-learning/
# Understand what components we can reuse
# Map out dependencies
# NO CHANGES YET - just learning
```

**Step 2: Extract ONE Component** (45 min)

```bash
# Example: Extract CourseContent.tsx
cp .backup-single-tenant/.../CourseContent.tsx components/courses/
# Modify for multi-tenant
# Test immediately: pnpm build
# If it breaks, we delete it and try again
```

**Step 3: Wire Up ONE Route** (30 min)

```bash
# Add to agency learning route ONLY
# Platform admin stays untouched
# Test with one user account
# Verify admins still work
```

**Step 4: Gradual Feature Enable** (per feature)

```bash
# Enable course browsing → Test
# Enable enrollment → Test
# Enable lesson viewing → Test
# Enable progress → Test
```

---

## 🎯 Core Architecture Principle

Following `/docs/critical-docs/component-refactoring-plan.md`:

> **"Shared Components, Separate Routes"**
>
> - Routes stay separate (for security and clarity)
> - Components are shared (for maintainability)
> - Business logic is extracted (for consistency)

This approach prevents the 40% code duplication problem identified in our technical debt analysis.

---

## 📋 PHASE 1: Component Extraction & Sharing (2 hours)

**Aligns with**: Technical Debt doc Section "Phase 1: Stop the Bleeding"

### ⭐ CRITICAL UPDATE: Shared Component Architecture

Following the "Component-Based Composition" pattern from TECHNICAL-DEBT.md, we will create SHARED components that work for all user roles, eliminating duplication while maintaining the same core foundation as the single-tenant system.

### 1.1 Create Shared Course Listing Component

**Location**: `/components/courses/CourseListingPage.tsx`

```typescript
// SHARED by ALL ROLES - one component, different actions
interface CourseListingPageProps {
  courses: Course[];
  userRole: 'platform_admin' | 'agency_admin' | 'user';
  orgSlug?: string;
  showCreateButton?: boolean;
  createButtonHref?: string;
}

export function CourseListingPage({
  courses,
  userRole,
  orgSlug,
  showCreateButton,
  createButtonHref
}: CourseListingPageProps) {
  // Same grid layout for everyone
  return (
    <div>
      {showCreateButton && (
        <Link href={createButtonHref}>Create Course</Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map(course => (
          <SharedCourseCard
            key={course.id}
            data={course}
            userRole={userRole}
            orgSlug={orgSlug}
          />
        ))}
      </div>
    </div>
  );
}
```

### 1.2 Create Shared Course Card Component

**Location**: `/components/courses/SharedCourseCard.tsx`

```typescript
// REPLACES AgencyCourseCard, AdminCourseCard, and future learner cards
interface SharedCourseCardProps {
  data: Course;
  userRole: 'platform_admin' | 'agency_admin' | 'user';
  orgSlug?: string;
  isPlatformCourse?: boolean;
}

export function SharedCourseCard({ data, userRole, orgSlug, isPlatformCourse }: SharedCourseCardProps) {
  // SAME card structure, different actions based on role
  const getCardActions = () => {
    switch (userRole) {
      case 'platform_admin':
        // Can edit/delete all courses
        return (
          <DropdownMenu>
            <Link href={`/platform/admin/courses/${data.id}/edit`}>Edit</Link>
            <Link href={`/platform/admin/courses/${data.id}/delete`}>Delete</Link>
          </DropdownMenu>
        );

      case 'agency_admin':
        // Can edit own, view-only platform courses
        if (isPlatformCourse) {
          return <Button variant="secondary">View Only</Button>;
        }
        return (
          <DropdownMenu>
            <Link href={`/agency/${orgSlug}/admin/courses/${data.id}/edit`}>Edit</Link>
            <Link href={`/agency/${orgSlug}/admin/courses/${data.id}/delete`}>Delete</Link>
          </DropdownMenu>
        );

      case 'user':
        // Learning actions only
        return (
          <Link href={`/agency/${orgSlug}/courses/${data.slug}`}>
            <Button className="w-full">Start Learning</Button>
          </Link>
        );
    }
  };

  // Rest of card is IDENTICAL for all roles
  return (
    <Card>
      <Image src={data.thumbnail} />
      <CardHeader>{data.title}</CardHeader>
      <CardContent>{data.description}</CardContent>
      {getCardActions()}
    </Card>
  );
}
```

### 1.3 Extract CourseContent Component (Already Done ✅)

**Location**: `/components/courses/CourseContent.tsx`

```typescript
// SHARED by all roles - platform admin, agency admin, end users
interface CourseContentProps {
  lesson: LessonData;
  onComplete: (lessonId: string) => Promise<ApiResponse>;
  onNavigate: (direction: "prev" | "next") => void;
  showAdminControls?: boolean; // For admin preview mode
  basePath: string; // For navigation URLs
}

export function CourseContent({
  lesson,
  onComplete,
  onNavigate,
  showAdminControls = false,
  basePath,
}: CourseContentProps) {
  // Copy implementation from .backup-single-tenant
  // Adapt for multi-context usage
}
```

### 1.2 Extract CourseDetailView Component

**Location**: `/components/courses/CourseDetailView.tsx`

```typescript
// Used by all roles to VIEW course details
interface CourseDetailProps {
  course: CourseWithChapters;
  enrollmentStatus?: EnrollmentStatus;
  actions?: ReactNode; // Context-specific actions
  basePath: string; // For navigation links
  showPricing?: boolean; // Platform-specific
  showEnrollment?: boolean; // User-specific
}

export function CourseDetailView({
  course,
  enrollmentStatus,
  actions,
  basePath,
  showPricing = false,
  showEnrollment = false,
}: CourseDetailProps) {
  // Unified course detail display
}
```

### 1.3 Create EnrollmentButton Component

**Location**: `/components/courses/EnrollmentButton.tsx`

```typescript
interface EnrollmentButtonProps {
  courseId: string;
  isEnrolled: boolean;
  onEnroll: () => Promise<ApiResponse>;
  enrollmentType: 'paid' | 'subscription' | 'free';
  price?: number;
}

export function EnrollmentButton({
  courseId,
  isEnrolled,
  onEnroll,
  enrollmentType,
  price
}: EnrollmentButtonProps) {
  if (isEnrolled) {
    return <Link href={`${basePath}/learning/${courseSlug}`}>Continue Learning</Link>;
  }

  // Handle different enrollment types
  switch(enrollmentType) {
    case 'subscription':
      return <Button onClick={onEnroll}>Enroll (Included)</Button>;
    case 'paid':
      return <Button onClick={onEnroll}>${price} - Enroll Now</Button>;
    case 'free':
      return <Button onClick={onEnroll}>Enroll for Free</Button>;
  }
}
```

### 1.4 Create Shared Data Service

**Location**: `/lib/services/course-access-service.ts`

```typescript
export class CourseAccessService {
  /**
   * Check if user can view a course based on role and enrollment
   */
  static async canViewCourse(
    userId: string,
    courseId: string,
    context: UserContext
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    });

    // Platform admin: Can view all
    if (user.role === "platform_admin") return true;

    // Agency admin: Can view own + platform courses
    if (user.role === "agency_admin") {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { organizationId: true },
      });
      return (
        !course.organizationId || course.organizationId === user.organizationId
      );
    }

    // End user: Must be enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });
    return enrollment?.status === "Active";
  }

  /**
   * Get lesson data with proper scoping
   */
  static async getLessonForUser(
    lessonId: string,
    context: UserContext
  ): Promise<LessonData | null> {
    // Implementation following select pattern from CODING_PATTERNS.md
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        description: true,
        videoKey: true,
        thumbnailKey: true,
        Chapter: {
          select: {
            courseId: true,
            Course: {
              select: {
                id: true,
                slug: true,
                organizationId: true,
              },
            },
          },
        },
        lessonProgress: {
          where: { userId: context.userId },
          select: { completed: true },
        },
      },
    });

    if (!lesson) return null;

    // Verify access
    const canView = await this.canViewCourse(
      context.userId,
      lesson.Chapter.courseId,
      context
    );

    return canView ? lesson : null;
  }
}
```

---

## 📋 PHASE 2: Route Implementation with Shared Components (3 hours)

### 2.1 File Structure

```
app/agency/[slug]/
├── courses/                    # NEW - Course browsing
│   ├── page.tsx               # Course catalog
│   └── [courseId]/
│       ├── page.tsx           # Course detail (preview)
│       └── actions.ts         # Enrollment action
│
└── learning/
    ├── page.tsx               # Dashboard (EXISTS)
    ├── [courseSlug]/          # NEW - Course learning
    │   ├── page.tsx           # Course overview/syllabus
    │   └── [lessonId]/
    │       ├── page.tsx       # Lesson viewer
    │       └── actions.ts     # Progress tracking
    └── _components/
        └── CourseProgressCard.tsx (EXISTS)

components/courses/             # NEW - Shared components
├── CourseContent.tsx          # Lesson viewer
├── CourseDetailView.tsx       # Course preview
├── EnrollmentButton.tsx       # CTA component
├── CourseCard.tsx            # Catalog card
└── CourseProgress.tsx        # Progress indicators
```

### 2.2 Agency Course Catalog

**File**: `/app/agency/[slug]/courses/page.tsx`

```typescript
import { CourseCard } from '@/components/courses/CourseCard';
import { createAgencyDataScope } from '@/lib/agency-data-scope';

export default async function AgencyCoursesPage({ params }) {
  const { slug } = await params;
  const org = await getOrganizationBySlug(slug);

  // Get available courses (agency + platform)
  const dataScope = createAgencyDataScope(org.id);
  const courses = await dataScope.getCourses();

  // Get user's enrollments
  const session = await auth.api.getSession({ headers: await headers() });
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    select: { courseId: true }
  });

  const enrolledIds = new Set(enrollments.map(e => e.courseId));

  return (
    <div>
      <h1>Available Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            isEnrolled={enrolledIds.has(course.id)}
            linkTo={`/agency/${slug}/courses/${course.id}`}
            enrollText={org.subscriptionActive ? "Enroll (Included)" : "View Details"}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2.3 Agency Lesson Viewer

**File**: `/app/agency/[slug]/learning/[courseSlug]/[lessonId]/page.tsx`

```typescript
import { CourseContent } from '@/components/courses/CourseContent';
import { CourseAccessService } from '@/lib/services/course-access-service';
import { markLessonComplete } from './actions';

export default async function AgencyLessonPage({ params }) {
  const { slug, courseSlug, lessonId } = await params;
  const session = await requireUser();

  // Context-aware data fetching
  const context = {
    type: 'agency' as const,
    orgSlug: slug,
    userId: session.id
  };

  const lesson = await CourseAccessService.getLessonForUser(lessonId, context);

  if (!lesson) {
    notFound();
  }

  // Shared component with context-specific actions
  return (
    <CourseContent
      lesson={lesson}
      onComplete={(id) => markLessonComplete(id)}
      onNavigate={(dir) => handleNavigation(dir, courseSlug, lessonId)}
      basePath={`/agency/${slug}/learning`}
    />
  );
}
```

### 2.4 Progress Tracking Action

**File**: `/app/agency/[slug]/learning/[courseSlug]/[lessonId]/actions.ts`

```typescript
"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string
): Promise<ApiResponse> {
  try {
    const user = await requireUser();

    // Upsert lesson progress
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      update: {
        completed: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        lessonId,
        completed: true,
      },
    });

    // Get course slug for revalidation
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        Chapter: {
          select: {
            Course: {
              select: { slug: true },
            },
          },
        },
      },
    });

    if (lesson?.Chapter.Course.slug) {
      revalidatePath(`/agency/[slug]/learning/${lesson.Chapter.Course.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to mark lesson complete:", error);
    return { error: "Failed to update progress" };
  }
}
```

---

## 📋 PHASE 3: Access Control & Enrollment (2 hours)

### 3.1 Role-Based Access Matrix

| Role               | Can View       | Can Enroll              | Can Edit         | Notes                     |
| ------------------ | -------------- | ----------------------- | ---------------- | ------------------------- |
| **Platform Admin** | All courses    | N/A                     | All courses      | Full access               |
| **Agency Admin**   | Own + Platform | Auto-enroll in own      | Own courses only | Can view platform courses |
| **End User**       | Enrolled only  | Via agency subscription | None             | Access through agency     |

### 3.2 Enrollment Implementation

**File**: `/app/agency/[slug]/courses/[courseId]/actions.ts`

```typescript
"use server";

import { requireUser } from "@/app/data/user/require-user";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";

// Rate limiting per CODING_PATTERNS.md
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function enrollInCourse(
  orgSlug: string,
  courseId: string
): Promise<ApiResponse> {
  try {
    // Rate limiting
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return { error: "Too many attempts. Please try again later." };
    }

    const user = await requireUser();
    const org = await getOrganizationBySlug(orgSlug);

    if (!org) {
      return { error: "Organization not found" };
    }

    // Check agency subscription
    if (!org.subscriptionActive) {
      return { error: "Agency subscription required for enrollment" };
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existing) {
      return { error: "Already enrolled in this course" };
    }

    // Auto-enroll for active agencies
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId,
        status: "Active",
        organizationId: org.id,
      },
    });

    revalidatePath(`/agency/${orgSlug}/courses`);
    revalidatePath(`/agency/${orgSlug}/learning`);

    return { success: true, message: "Successfully enrolled in course" };
  } catch (error) {
    console.error("Enrollment error:", error);
    return { error: "Failed to enroll in course" };
  }
}
```

### 3.3 Course Detail with Enrollment

**File**: `/app/agency/[slug]/courses/[courseId]/page.tsx`

```typescript
import { CourseDetailView } from '@/components/courses/CourseDetailView';
import { EnrollmentButton } from '@/components/courses/EnrollmentButton';
import { enrollInCourse } from './actions';

export default async function AgencyCourseDetailPage({ params }) {
  const { slug, courseId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  // Get course details
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      // ... course fields per CODING_PATTERNS.md select pattern
    }
  });

  if (!course) notFound();

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId
      }
    }
  });

  const org = await getOrganizationBySlug(slug);

  return (
    <CourseDetailView
      course={course}
      enrollmentStatus={enrollment?.status}
      basePath={`/agency/${slug}`}
      showEnrollment={true}
      actions={
        <EnrollmentButton
          courseId={course.id}
          courseSlug={course.slug}
          isEnrolled={!!enrollment}
          onEnroll={() => enrollInCourse(slug, course.id)}
          enrollmentType={org.subscriptionActive ? 'subscription' : 'paid'}
          price={course.price}
        />
      }
    />
  );
}
```

---

## 📋 PHASE 4: Testing & Validation (1 hour)

### 4.1 User Journey Testing Checklist

#### End User Flow

- [ ] User can access `/agency/[slug]/login`
- [ ] User can log in with email OTP
- [ ] User is redirected to `/agency/[slug]/learning` dashboard
- [ ] Dashboard shows enrolled courses with progress
- [ ] User can click "Browse Courses" to see catalog
- [ ] User can view course details before enrolling
- [ ] User can enroll in courses (if agency has subscription)
- [ ] User can access lesson content after enrollment
- [ ] User can mark lessons as complete
- [ ] Progress is tracked and displayed correctly
- [ ] User cannot access admin routes

#### Agency Admin Flow

- [ ] Admin can view all agency courses
- [ ] Admin can view (not edit) platform courses
- [ ] Admin can preview any course content
- [ ] Admin sees different UI elements than end users

#### Platform Admin Flow

- [ ] Can preview any course from any organization
- [ ] Can access course content without enrollment
- [ ] Sees admin controls in preview mode

### 4.2 Security Testing

- [ ] Unauthorized users get 404 on protected routes
- [ ] Users cannot access other agency's content
- [ ] Direct URL manipulation is properly protected
- [ ] Rate limiting works on enrollment actions
- [ ] Organization scoping is enforced in all queries

### 4.3 Component Reusability Testing

- [ ] CourseContent works for all three roles
- [ ] CourseDetailView adapts to different contexts
- [ ] EnrollmentButton shows correct state for each scenario
- [ ] No code duplication between routes

---

## 🚀 Implementation Commands

```bash
# Start development
pnpm dev

# Test different user roles
# 1. Log in as end user: user@example.com
# 2. Log in as agency admin: admin@agency.com
# 3. Log in as platform admin: admin@platform.com

# Build check
pnpm build

# Lint check
pnpm lint

# Before committing
pnpm format
```

---

## 📚 Reference Documents

### Technical Debt Guidelines

- `/docs/critical-docs/TECHNICAL-DEBT.md` - Component composition strategy
- `/docs/critical-docs/component-refactoring-plan.md` - Shared component patterns
- `/docs/critical-docs/ACTION_PLAN.md` - MVP priorities

### Coding Standards

- `/CODING_PATTERNS.md` - Project patterns (ApiResponse, rate limiting, etc.)
- Use `select` pattern, never `include` in Prisma queries
- Always include rate limiting on server actions
- Use generic error messages for security

### Backup Reference

- `.backup-single-tenant/my-learning/` - Original lesson viewing implementation
- `.backup-single-tenant/public-courses/` - Original enrollment flow

---

## ⚠️ Critical Implementation Notes

### DO NOT

- ❌ Duplicate components between platform and agency
- ❌ Create separate implementations for each role
- ❌ Use `include` in Prisma queries
- ❌ Expose detailed error messages
- ❌ Skip rate limiting on actions

### ALWAYS

- ✅ Share components with role-specific props
- ✅ Keep routes separate for security
- ✅ Use CourseAccessService for authorization
- ✅ Follow CODING_PATTERNS.md standards
- ✅ Test all three user roles

---

## 🔄 Progress Tracking

### Phase 1: Component Extraction ✅ PARTIALLY COMPLETE

- [x] Extract CourseContent component
- [x] Create SharedCourseCard component (replaced duplicates)
- [x] Create CourseListingPage component
- [x] Create CompactCourseCard for dashboards
- [ ] Extract CourseDetailView component (not needed yet)
- [ ] Create CourseAccessService (used simpler approach)

### Phase 2: Route Implementation ✅ COMPLETE

- [x] Create `/agency/[slug]/learning/courses` catalog
- [x] Fix broken navigation link in SharedCourseCard
- [x] Create `/agency/[slug]/learning/[courseSlug]/page.tsx` course overview
- [x] Create `/agency/[slug]/learning/[courseSlug]/layout.tsx` with CourseSidebar
- [x] Create `/agency/[slug]/learning/[courseSlug]/[lessonId]` lesson viewer
- [x] Add navigation between lessons (via CourseSidebar)
- [x] Update dashboard with course discovery section

### Phase 3: Access Control ✅ COMPLETE

- [x] Implement course visibility toggle
- [x] Add hide/show functionality for agency admins
- [x] Configure role-based access (getVisibleCourses)
- [x] Test authorization flows

### Phase 4: Testing ✅ COMPLETE

- [x] Test end user complete flow
- [x] Test agency admin course management
- [x] Test platform admin functionality maintained
- [x] Verify security boundaries (hidden courses filtered)

---

## 🚑 TROUBLESHOOTING GUIDE

### Common Issues & Quick Fixes

**Build Fails After Adding Component**

```bash
# Check for missing imports
pnpm build 2>&1 | grep "Cannot find"
# Fix imports, then rebuild
```

**"Module not found" Errors**

```bash
# Install missing dependencies
pnpm add [package-name]
# Or check if import path is wrong
```

**User Can't See Courses**

- Check user role in database
- Verify organization has active subscription
- Check enrollment status
- Look for console errors in browser

**Authorization Errors**

- Verify `requireUser()` vs `requireAdmin()`
- Check organization context
- Ensure user.organizationId matches

**Component Not Updating**

```bash
# Clear Next.js cache
rm -rf .next
pnpm dev
```

**Type Errors**

- Check `ApiResponse` type usage
- Verify schema types match
- Look for any `any` types that need fixing

---

## 📝 Session Continuity Notes

**Last Updated**: 2025-01-25
**Status**: ✅ COMPLETE - All navigation and layout issues resolved
**Achievement**: Successfully restored full learning functionality with proper navigation

**What Was Actually Completed**:

- ✅ Created SharedCourseCard replacing AdminCourseCard and AgencyCourseCard (396 lines saved)
- ✅ Created CourseListingPage shared wrapper component
- ✅ Created CompactCourseCard for dashboard widgets
- ✅ Created CourseContent for lesson viewing with video playback
- ✅ Implemented `/agency/[slug]/learning/courses` for end user course browsing
- ✅ Implemented `/agency/[slug]/learning/[courseSlug]/[lessonId]` for lesson viewing
- ✅ Added course visibility management (hide/show toggle for agency admins)
- ✅ Created getVisibleCourses() to filter hidden courses from end users
- ✅ Added progress tracking with mark complete/incomplete
- ✅ Created IV therapy seed data for testing

**What Was Fixed Today (2025-01-25):**

- ✅ Fixed SharedCourseCard navigation link from `/courses/` to `/learning/`
- ✅ Created course overview page at `/agency/[slug]/learning/[courseSlug]/page.tsx`
- ✅ Added course-specific layout with CourseSidebar at `/agency/[slug]/learning/[courseSlug]/layout.tsx`
- ✅ Copied and adapted CourseSidebar and LessonItem components for agency context

**Technical Debt Still Remaining (Non-Critical):**

- ❌ EditCourseForm.tsx still duplicated (664 lines)
- ❌ CourseStructure.tsx still duplicated (1,002 lines)
- Total remaining duplication: 1,666 lines (identified in TECHNICAL-DEBT.md)

**Implementation Order**:

1. Create `/components/courses/CourseListingPage.tsx` - Shared by all roles
2. Create `/components/courses/SharedCourseCard.tsx` - Replaces duplicate cards
3. Create `/app/agency/[slug]/courses/page.tsx` - End user course browsing
4. Update `/app/agency/[slug]/admin/courses/page.tsx` - Use shared component
5. Create course detail page for learners

**Key Architecture Decision**:

- Routes stay separate: `/platform/admin/courses`, `/agency/[slug]/admin/courses`, `/agency/[slug]/courses`
- Components are shared: All use CourseListingPage with different userRole prop
- Actions change based on role, but UI structure remains identical
- This follows technical debt doc's "Component-Based Composition" principle

This document is the single source of truth for the end-user learning experience implementation. Update it as implementation progresses.
