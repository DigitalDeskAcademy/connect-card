# Lesson Edit Dialog - Implementation Plan

**Date:** 2025-10-12
**Status:** Pending Review
**Expert Consultation:** Next.js Developer, UX Designer

---

## Executive Summary

Implement lesson editing via Dialog modal using the **existing DeleteLesson pattern** as a template. This approach was recommended by both the Next.js expert and UX designer, and perfectly aligns with the project's established patterns.

**Key Decision:** Use Dialog component (not Sheet, not Intercepting Routes) to match existing patterns in the codebase.

---

## Problem Statement

### Current Issue

When users click a lesson name in CourseStructure, they navigate to a full-page route:

- Lesson edit form renders below parent's PageHeader tabs (off-screen)
- No visual feedback that anything happened
- Users don't see the form without manually scrolling
- Poor UX - confusing and non-intuitive

### Root Cause

- CourseEditClient sets PageHeader context with tabs
- PageHeader config persists when navigating to child routes
- Lesson page doesn't clear parent's PageHeader
- Result: Stacked content with lesson form below fold

---

## Expert Recommendations Recap

### Next.js Developer Analysis

- Identified "context persistence anti-pattern"
- Recommended Dialog/Sheet pattern over Intercepting Routes
- Estimated: **Dialog pattern (4-6 hours)** vs Intercepting Routes (6-8 hours)
- **Verdict:** Dialog is simpler and more maintainable

### UX Designer Analysis

- Studied industry patterns (Teachable, Thinkific, LearnDash)
- Strongly recommended Dialog/Sheet pattern
- Maintains course structure context while editing
- Matches existing modal patterns (New Chapter, New Lesson)
- **Verdict:** Better workflow efficiency

### Existing Pattern Discovery

- **DeleteLesson component** uses exact same pattern we need
- Self-contained component with trigger + AlertDialog
- Callback pattern for multi-tenant compatibility
- Passed via CourseStructure context
- **Perfect template to follow**

---

## Implementation Pattern

### Established Pattern (DeleteLesson)

```typescript
// DeleteLesson.tsx (lines 84-139)
export function DeleteLesson({ chapterId, courseId, lessonId, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleDelete() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(onDelete({ ... }));
      if (result?.status === "success") {
        toast.success(result.message);
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {/* Dialog content */}
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Key Pattern Elements:**

1. ✅ Self-contained component (trigger + dialog together)
2. ✅ `AlertDialogTrigger asChild` for custom trigger styling
3. ✅ Internal state management (`open`, `pending`)
4. ✅ Callback pattern (`onDelete` prop)
5. ✅ React Hook Form with Zod validation
6. ✅ tryCatch error handling
7. ✅ Toast notifications
8. ✅ Passed via CourseStructure context

### Our Pattern (LessonEditDialog)

```typescript
// LessonEditDialog.tsx (NEW)
export function LessonEditDialog({ lesson, courseId, chapterId, onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { ... }
  });

  async function handleSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(onSubmit(values, lesson.id));
      if (result?.status === "success") {
        toast.success(result.message);
        form.reset(values);
        setIsOpen(false);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="hover:text-primary cursor-pointer">
          {lesson.title}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Form with title, rich text description, video upload */}
      </DialogContent>
    </Dialog>
  );
}
```

**Differences from DeleteLesson:**

- Uses `Dialog` instead of `AlertDialog` (form editing vs confirmation)
- Wider modal (`sm:max-w-3xl` vs `sm:max-w-[425px]`)
- React Hook Form integration for complex form
- Unsaved changes warning
- Lesson name as trigger (not icon button)

---

## Phase Plan

### Phase 1: Create LessonEditDialog Component (2 hours)

**File:** `/components/courses/LessonEditDialog.tsx`

**Responsibilities:**

- Self-contained dialog component
- Encapsulates trigger button + dialog content
- Manages internal state (open, pending)
- React Hook Form with Zod validation
- Handles lesson data loading and form initialization

**Props Interface:**

```typescript
interface LessonEditDialogProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    videoKey: string | null;
  };
  courseId: string;
  chapterId: string;
  onSubmit: (data: LessonSchemaType, lessonId: string) => Promise<ApiResponse>;
}
```

**Key Features:**

- DialogTrigger with lesson title as clickable text
- Wide modal layout (`sm:max-w-3xl`)
- Three form fields: title (Input), description (RichTextEditor), video (Uploader)
- Unsaved changes warning before close
- Loading states during save
- Toast notifications
- Form reset on successful save

**Pattern Alignment:**

- ✅ Matches DeleteLesson structure
- ✅ Callback pattern for multi-tenant
- ✅ tryCatch error handling
- ✅ Controlled state with useState
- ✅ useTransition for async operations

---

### Phase 2: Update CourseStructure Context (30 minutes)

**File:** `/components/courses/CourseStructure.tsx`

**Changes Required:**

1. **Add to Context Interface** (lines 148-160):

```typescript
interface CourseStructureContext {
  basePath: string;
  courseId: string;
  onReorderChapters: (data: ReorderData[]) => Promise<ApiResponse>;
  onReorderLessons: (
    chapterId: string,
    data: ReorderData[]
  ) => Promise<ApiResponse>;
  NewChapterModal: React.ComponentType<NewChapterModalProps>;
  NewLessonModal: React.ComponentType<NewLessonModalProps>;
  DeleteChapter: React.ComponentType<DeleteChapterProps>;
  DeleteLesson: React.ComponentType<DeleteLessonProps>;
  LessonEditDialog: React.ComponentType<LessonEditDialogProps>; // ← ADD THIS
}
```

2. **Add Props Type** (after line 141):

```typescript
interface LessonEditDialogProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    videoKey: string | null;
  };
  courseId: string;
  chapterId: string;
}
```

3. **Destructure from Context** (lines 197-206):

```typescript
export function CourseStructure({ course, context }: CourseStructureProps) {
  const {
    basePath,
    courseId,
    onReorderChapters,
    onReorderLessons,
    NewChapterModal,
    NewLessonModal,
    DeleteChapter,
    DeleteLesson,
    LessonEditDialog,  // ← ADD THIS
  } = context;
```

4. **Replace Link with Dialog** (lines 570-574):

```typescript
// BEFORE:
<Link href={`${basePath}/${courseId}/${item.id}/${lesson.id}`}>
  {lesson.title}
</Link>

// AFTER:
<LessonEditDialog
  lesson={{
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    videoKey: lesson.videoKey,
  }}
  courseId={courseId}
  chapterId={item.id}
/>
```

**Note:** We need to update course query to include `description` and `videoKey` for lessons.

---

### Phase 3: Update Platform Course Edit Page (45 minutes)

**File:** `/app/platform/admin/courses/[courseId]/edit/_components/CourseEditClient.tsx`

**Changes Required:**

1. **Import LessonEditDialog**:

```typescript
import { LessonEditDialog } from "@/components/courses/LessonEditDialog";
```

2. **Import Platform updateLesson Action**:

```typescript
import { updateLesson } from "@/app/platform/admin/courses/[courseId]/[chapterId]/[lessonId]/actions";
```

3. **Create Wrapped Component**:

```typescript
function PlatformLessonEditDialog(props: {
  lesson: { id: string; title: string; description: string | null; videoKey: string | null };
  courseId: string;
  chapterId: string;
}) {
  return (
    <LessonEditDialog
      {...props}
      onSubmit={updateLesson}
    />
  );
}
```

4. **Add to CourseStructure Context** (lines 180-195):

```typescript
const context: CourseStructureContext = {
  basePath: "/platform/admin/courses",
  courseId: course.id,
  onReorderChapters: data => reorderChapters(course.id, data),
  onReorderLessons: (chapterId, data) =>
    reorderLessons(course.id, chapterId, data),
  NewChapterModal: PlatformNewChapterModal,
  NewLessonModal: PlatformNewLessonModal,
  DeleteChapter: PlatformDeleteChapter,
  DeleteLesson: PlatformDeleteLesson,
  LessonEditDialog: PlatformLessonEditDialog, // ← ADD THIS
};
```

5. **Update Course Query** (in page.tsx):

```typescript
const course = await prisma.course.findUnique({
  where: { id: courseId },
  select: {
    id: true,
    title: true,
    chapter: {
      select: {
        id: true,
        title: true,
        position: true,
        lessons: {
          select: {
            id: true,
            title: true,
            position: true,
            description: true, // ← ADD THIS
            videoKey: true, // ← ADD THIS
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    },
  },
});
```

---

### Phase 4: Update Agency Course Edit Page (45 minutes)

**File:** `/app/agency/[slug]/admin/courses/[courseId]/edit/_components/AgencyCourseEditClient.tsx`

**Changes Required:**

1. **Import LessonEditDialog**:

```typescript
import { LessonEditDialog } from "@/components/courses/LessonEditDialog";
```

2. **Import Agency updateLesson Action**:

```typescript
import { updateLesson } from "@/app/agency/[slug]/admin/courses/[courseId]/[chapterId]/[lessonId]/actions";
```

3. **Create Wrapped Component**:

```typescript
function AgencyLessonEditDialog(props: {
  lesson: { id: string; title: string; description: string | null; videoKey: string | null };
  courseId: string;
  chapterId: string;
}) {
  return (
    <LessonEditDialog
      {...props}
      onSubmit={updateLesson}
    />
  );
}
```

4. **Add to CourseStructure Context**:

```typescript
const context: CourseStructureContext = {
  basePath: `/agency/${slug}/admin/courses`,
  courseId: course.id,
  onReorderChapters: data => reorderChapters(slug, course.id, data),
  onReorderLessons: (chapterId, data) =>
    reorderLessons(slug, course.id, chapterId, data),
  NewChapterModal: AgencyNewChapterModal,
  NewLessonModal: AgencyNewLessonModal,
  DeleteChapter: AgencyDeleteChapter,
  DeleteLesson: AgencyDeleteLesson,
  LessonEditDialog: AgencyLessonEditDialog, // ← ADD THIS
};
```

5. **Update Course Query** (in page.tsx) - Same as platform

---

### Phase 5: Testing & Validation (1 hour)

**Platform Context Testing:**

1. Navigate to `/platform/admin/courses/[id]/edit?tab=structure`
2. Click a lesson name in the structure
3. Verify dialog opens with lesson data pre-filled
4. Edit title, description, video
5. Click "Save Lesson" - verify success toast
6. Verify dialog closes
7. Verify changes reflected in structure
8. Test unsaved changes warning (edit without saving, try to close)
9. Test validation errors (empty title, etc.)
10. Test cancel button

**Agency Context Testing:**

1. Navigate to `/agency/[slug]/admin/courses/[id]/edit?tab=structure`
2. Repeat all platform tests
3. Verify organization scoping in server action
4. Verify revalidation paths are correct

**Edge Cases:**

- Click lesson with no description/video
- Edit lesson, save, immediately re-open (verify fresh data)
- Drag-and-drop lessons while dialog open
- Mobile responsiveness
- Keyboard navigation (Tab, Enter, Escape)

---

## Files Modified

### New Files (1)

- `/components/courses/LessonEditDialog.tsx` (new component)

### Modified Files (5)

- `/components/courses/CourseStructure.tsx` (context update, replace Link with dialog)
- `/app/platform/admin/courses/[courseId]/edit/_components/CourseEditClient.tsx` (add wrapped component)
- `/app/platform/admin/courses/[courseId]/edit/page.tsx` (update query)
- `/app/agency/[slug]/admin/courses/[courseId]/edit/_components/AgencyCourseEditClient.tsx` (add wrapped component)
- `/app/agency/[slug]/admin/courses/[courseId]/edit/page.tsx` (update query)

### Unchanged Files (Keep as Fallback)

- `/app/platform/admin/courses/[courseId]/[chapterId]/[lessonId]/page.tsx` (direct URL access)
- `/app/agency/[slug]/admin/courses/[courseId]/[chapterId]/[lessonId]/page.tsx` (direct URL access)
- `/components/courses/LessonForm.tsx` (keep for full-page route)

**Rationale:** Keep full-page lesson routes as fallback for direct URL access or future use.

---

## Multi-Tenant Security

### Platform Context

- `updateLesson` action uses `requireAdmin()` (lines 22)
- Scoped to platform courses only (`isPlatformCourse: true`)
- Rate limited (5 requests/minute per user)

### Agency Context

- `updateLesson` action uses `requireAgencyAdmin(slug)` (line 41)
- Organization ID verification (lines 52-69)
- Ensures lesson belongs to agency's course
- Revalidates agency-specific paths

**Both contexts maintain proper data isolation.**

---

## UX Improvements

### Before (Current)

❌ Click lesson → navigate to new route
❌ Form renders below fold (off-screen)
❌ No visual feedback
❌ User confused ("nothing happened")
❌ Must scroll to see form
❌ Loses context of course structure

### After (With Dialog)

✅ Click lesson → dialog opens immediately
✅ Clear visual feedback (modal overlay)
✅ Form visible in center of screen
✅ Course structure stays visible in background
✅ Edit in context without navigation
✅ Matches existing "New Chapter" pattern

---

## Performance Considerations

### Dialog Pattern Benefits

- **No route navigation** - Faster, no PageHeader conflicts
- **Smaller bundle** - Dialog lighter than full-page route
- **Better UX** - Immediate feedback, maintains context
- **Reusable** - Same dialog for platform and agency

### Potential Concerns

- **Lesson data loading** - Mitigated by passing data from parent
- **Form state management** - React Hook Form handles efficiently
- **Rich text editor** - Already used elsewhere, proven performant

### Bundle Impact

- **LessonEditDialog:** ~5KB (component + form logic)
- **Removed navigation code:** -2KB (Link, router overhead)
- **Net increase:** ~3KB (acceptable for improved UX)

---

## Accessibility

### Keyboard Navigation

- **Tab:** Navigate between form fields
- **Escape:** Close dialog (with unsaved changes warning)
- **Enter:** Submit form (when in text input)

### Screen Readers

- Dialog announces title ("Edit Lesson")
- Form labels properly associated
- Error messages announced
- Success toast announced

### Focus Management

- Dialog captures focus on open
- Returns focus to trigger on close
- Logical tab order through form

---

## Risks & Mitigation

### Risk 1: Unsaved Changes Lost

**Mitigation:**

- Browser beforeunload warning
- Dialog onOpenChange warning
- Clear unsaved changes banner in dialog

### Risk 2: Large Video Upload Performance

**Mitigation:**

- Uploader component already handles this
- Progress indicators during upload
- No changes to upload logic

### Risk 3: Rich Text Editor in Dialog

**Mitigation:**

- RichTextEditor already used in full-page form
- Tested and working
- Same implementation, just in dialog

### Risk 4: Mobile Dialog UX

**Mitigation:**

- `max-h-[90vh]` with `overflow-y-auto`
- Responsive dialog sizing
- Touch-friendly form controls

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback:**

   - Revert LessonEditDialog integration
   - Restore Link navigation in CourseStructure
   - Full-page lesson routes still work

2. **Partial Rollback:**

   - Keep LessonEditDialog for platform
   - Disable for agency (use Link)
   - Debug agency-specific issues

3. **Data Safety:**
   - No database schema changes
   - Server actions unchanged
   - Zero data migration risk

---

## Timeline Estimate

| Phase     | Task                              | Time        |
| --------- | --------------------------------- | ----------- |
| 1         | Create LessonEditDialog component | 2 hours     |
| 2         | Update CourseStructure context    | 30 min      |
| 3         | Update platform course edit       | 45 min      |
| 4         | Update agency course edit         | 45 min      |
| 5         | Testing & validation              | 1 hour      |
| **Total** | **End-to-end implementation**     | **5 hours** |

**Buffer:** Add 1 hour for unexpected issues = **6 hours total**

---

## Success Criteria

### Functional Requirements

- ✅ Click lesson name opens dialog
- ✅ Dialog displays current lesson data
- ✅ Edit title, description, video
- ✅ Save updates lesson successfully
- ✅ Dialog closes on successful save
- ✅ Changes reflected in course structure
- ✅ Works in both platform and agency contexts

### User Experience

- ✅ Clear visual feedback on click
- ✅ No off-screen content issues
- ✅ Maintains course structure context
- ✅ Matches existing modal patterns
- ✅ Unsaved changes protection

### Technical Quality

- ✅ Type-safe implementation
- ✅ Multi-tenant security maintained
- ✅ No breaking changes to existing routes
- ✅ Follows established patterns
- ✅ Passes build and lint checks

---

## Post-Implementation

### Documentation Updates

- Update STATUS.md: Mark mobile nav and lesson edit as fixed
- Update architecture-decisions.md: Add lesson edit dialog pattern
- Add this plan to `/docs/technical/` for future reference

### Future Enhancements

- Consider same pattern for chapter editing
- Evaluate Dialog pattern for other CRUD operations
- Consider keyboard shortcuts (e.g., Cmd+S to save)

---

## Questions for Next.js Expert Review

1. **Pattern Validation:** Does this align with Next.js 15 best practices?
2. **State Management:** Is controlled Dialog state optimal, or should we use URL state?
3. **Data Loading:** Should we fetch lesson data async in dialog, or pass from parent?
4. **Route Preservation:** Should we keep full-page routes as fallback?
5. **Bundle Optimization:** Any concerns about Dialog component client bundle?
6. **Edge Cases:** What edge cases should we test more thoroughly?
7. **Alternative Approaches:** Any better approaches we haven't considered?

---

## References

- Expert consultation: Next.js Developer (Dialog recommended)
- Expert consultation: UX Designer (Dialog recommended)
- Existing pattern: DeleteLesson component (AlertDialog with trigger)
- Existing pattern: NewChapterModal (Dialog with form)
- Next.js 15 Dialog documentation
- Project coding patterns: `/docs/essentials/coding-patterns.md`
