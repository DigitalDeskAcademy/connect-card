# Member Unification Implementation Plan

**Created:** December 22, 2025
**Status:** ✅ Complete (PR #87 merged Dec 23, 2025)
**Based on:** `/docs/member-unification-architecture.md`
**Worktree:** `tech-debt`

---

## Decisions Made

Based on the architecture doc and practical considerations:

| Decision              | Choice                           | Rationale                                                       |
| --------------------- | -------------------------------- | --------------------------------------------------------------- |
| **Model Name**        | Keep `ChurchMember`              | Minimal churn, rename later if needed                           |
| **MemberType**        | Journey + Booleans               | A member can be volunteer AND staff simultaneously              |
| **VolunteerCategory** | Flatten to `String[]`            | Metadata (assignedAt, assignedBy) rarely used, array is simpler |
| **VolunteerSkill**    | Keep model, link to ChurchMember | Expiring certifications need metadata (CPR, background checks)  |
| **Name Field**        | Split to `firstName`, `lastName` | Matches Planning Center, better for search/sort                 |
| **Dead Models**       | Remove Task, Appointment         | Zero usage; keep Message shell for future messaging feature     |

---

## Phase Overview

| Phase       | Focus                           | Risk Level | Estimated Scope                   |
| ----------- | ------------------------------- | ---------- | --------------------------------- |
| **Phase 1** | Schema additions (non-breaking) | Low        | Add new fields, no removals       |
| **Phase 2** | Data migration script           | Medium     | Backfill data, verify integrity   |
| **Phase 3** | Update data layer (`lib/data/`) | Medium     | Query unified model               |
| **Phase 4** | Update server actions           | Medium     | Mutations use unified model       |
| **Phase 5** | Update UI components            | Low        | Read from unified fields          |
| **Phase 6** | Cleanup & removal               | High       | Drop old models, enums, dead code |

---

## Phase 1: Schema Additions (Non-Breaking)

**Goal:** Add all new fields to ChurchMember without removing anything. Application continues working.

### 1.1 Add Identity Fields

```prisma
model ChurchMember {
  // Existing
  name              String?

  // NEW: Split name fields
  firstName         String?
  lastName          String?
}
```

### 1.2 Add Journey Fields

```prisma
model ChurchMember {
  // NEW: Replace memberType enum with flexible journey
  journeyStatus     String?         @default("visitor") // visitor, returning, regular, member
  firstVisitDate    DateTime?
  memberSinceDate   DateTime?
  lastActivityDate  DateTime?
}
```

### 1.3 Add Role Booleans

```prisma
model ChurchMember {
  // NEW: Additive roles (not exclusive)
  isVolunteer       Boolean         @default(false)
  isStaff           Boolean         @default(false)
  isLeader          Boolean         @default(false)
}
```

### 1.4 Add Volunteer Fields (Merged from Volunteer model)

```prisma
model ChurchMember {
  // NEW: Volunteer attributes (nullable, populated when isVolunteer = true)
  volunteerStatus           String?         // active, on_break, inactive, pending
  volunteerCategories       String[]        @default([])
  volunteerStartDate        DateTime?
  volunteerEndDate          DateTime?
  volunteerInactiveReason   String?
  volunteerNotes            String?

  // Emergency contact
  emergencyContactName      String?
  emergencyContactPhone     String?

  // Background check
  backgroundCheckStatus     String?         // not_started, in_progress, pending_review, cleared, flagged, expired
  backgroundCheckDate       DateTime?
  backgroundCheckExpiry     DateTime?
  bgCheckToken              String?         @unique
  bgCheckConfirmedAt        DateTime?

  // Export tracking
  readyForExport            Boolean         @default(false)
  readyForExportDate        DateTime?
  volunteerExportedAt       DateTime?
  documentsSentAt           DateTime?

  // Automation
  automationStatus          String?         // pending, day1_sent, day3_sent, responded, expired
  automationStartedAt       DateTime?
  automationResponseAt      DateTime?

  // NEW: For volunteer events feature
  reliabilityScore          Float?
  totalEventsServed         Int             @default(0)
  lastServedDate            DateTime?
}
```

### 1.5 Update VolunteerSkill Relation

```prisma
model VolunteerSkill {
  // Change foreign key from volunteerId to churchMemberId
  churchMemberId    String
  churchMember      ChurchMember     @relation(fields: [churchMemberId], references: [id])

  // Keep all existing fields
  skillName         String
  proficiency       String?
  isVerified        Boolean          @default(false)
  verifiedDate      DateTime?
  expiryDate        DateTime?
}
```

### 1.6 Add Indexes

```prisma
model ChurchMember {
  @@index([organizationId, journeyStatus])
  @@index([organizationId, isVolunteer])
  @@index([organizationId, isVolunteer, volunteerStatus])
  @@index([organizationId, locationId])
  @@index([bgCheckToken])
}
```

### 1.7 Validation Checklist

- [ ] Run `pnpm prisma generate` - no errors
- [ ] Run `pnpm prisma db push` on dev database
- [ ] Application still works (no breaking changes)
- [ ] All existing tests pass

---

## Phase 2: Data Migration

**Goal:** Backfill new ChurchMember fields from existing Volunteer data.

### 2.1 Migration Script

Create `scripts/migrate-volunteer-to-churchmember.ts`:

```typescript
// Pseudocode - actual script to be written
async function migrateVolunteers() {
  const volunteers = await prisma.volunteer.findMany({
    include: {
      churchMember: true,
      categories: true,
      skills: true,
    },
  });

  for (const volunteer of volunteers) {
    await prisma.churchMember.update({
      where: { id: volunteer.churchMemberId },
      data: {
        // Set role flag
        isVolunteer: true,

        // Copy volunteer fields
        volunteerStatus: volunteer.status?.toLowerCase(),
        volunteerStartDate: volunteer.startDate,
        volunteerEndDate: volunteer.endDate,
        volunteerInactiveReason: volunteer.inactiveReason,
        volunteerNotes: volunteer.notes,

        // Emergency contact
        emergencyContactName: volunteer.emergencyContactName,
        emergencyContactPhone: volunteer.emergencyContactPhone,

        // Background check
        backgroundCheckStatus: volunteer.backgroundCheckStatus?.toLowerCase(),
        backgroundCheckDate: volunteer.backgroundCheckDate,
        backgroundCheckExpiry: volunteer.backgroundCheckExpiry,
        bgCheckToken: volunteer.bgCheckToken,
        bgCheckConfirmedAt: volunteer.bgCheckConfirmedAt,

        // Export tracking
        readyForExport: volunteer.readyForExport,
        readyForExportDate: volunteer.readyForExportDate,
        volunteerExportedAt: volunteer.exportedAt,
        documentsSentAt: volunteer.documentsSentAt,

        // Automation
        automationStatus: volunteer.automationStatus?.toLowerCase(),
        automationStartedAt: volunteer.automationStartedAt,
        automationResponseAt: volunteer.automationResponseAt,

        // Flatten categories to array
        volunteerCategories: volunteer.categories.map(c => c.category),
      },
    });

    // Migrate skills to new foreign key
    for (const skill of volunteer.skills) {
      await prisma.volunteerSkill.update({
        where: { id: skill.id },
        data: { churchMemberId: volunteer.churchMemberId },
      });
    }
  }
}
```

### 2.2 Name Splitting

```typescript
async function splitNames() {
  const members = await prisma.churchMember.findMany({
    where: { firstName: null, name: { not: null } },
  });

  for (const member of members) {
    const [firstName, ...rest] = (member.name || "").trim().split(" ");
    const lastName = rest.join(" ") || null;

    await prisma.churchMember.update({
      where: { id: member.id },
      data: { firstName, lastName },
    });
  }
}
```

### 2.3 Journey Status Backfill

```typescript
async function backfillJourneyStatus() {
  // Map old memberType to new journeyStatus
  const mapping = {
    VISITOR: "visitor",
    RETURNING: "returning",
    MEMBER: "member",
    VOLUNTEER: "regular", // Volunteers who aren't members
    STAFF: "member", // Staff are typically members
  };

  for (const [oldType, newStatus] of Object.entries(mapping)) {
    await prisma.churchMember.updateMany({
      where: { memberType: oldType },
      data: { journeyStatus: newStatus },
    });
  }

  // Set role flags based on old memberType
  await prisma.churchMember.updateMany({
    where: { memberType: "STAFF" },
    data: { isStaff: true },
  });
}
```

### 2.4 Validation Checklist

- [ ] All Volunteer records have corresponding ChurchMember with `isVolunteer = true`
- [ ] Volunteer field counts match: `COUNT(Volunteer) == COUNT(ChurchMember WHERE isVolunteer = true)`
- [ ] Category arrays populated correctly
- [ ] Skills now link to ChurchMember
- [ ] No orphaned records
- [ ] firstName/lastName populated for all members with names

---

## Phase 3: Update Data Layer

**Goal:** Update `lib/data/` queries to use unified model.

### 3.1 Update `lib/data/volunteers.ts`

```typescript
// BEFORE
export async function getVolunteers(organizationId: string) {
  return prisma.volunteer.findMany({
    where: { organizationId },
    include: { churchMember: true, categories: true },
  });
}

// AFTER
export async function getVolunteers(organizationId: string) {
  return prisma.churchMember.findMany({
    where: {
      organizationId,
      isVolunteer: true,
    },
    include: { skills: true },
  });
}
```

### 3.2 Files to Update

| File                              | Changes                            |
| --------------------------------- | ---------------------------------- |
| `lib/data/volunteers.ts`          | All queries use ChurchMember       |
| `lib/data/contacts.ts`            | Already uses ChurchMember (verify) |
| `lib/data/connect-card-review.ts` | Verify volunteer creation          |

### 3.3 Validation Checklist

- [ ] Volunteer list returns same count as before
- [ ] All filters work (category, status, bg check)
- [ ] No N+1 queries introduced
- [ ] Type errors resolved

---

## Phase 4: Update Server Actions

**Goal:** Mutations write to unified model.

### 4.1 Files to Update

| File                                             | Changes                              |
| ------------------------------------------------ | ------------------------------------ |
| `actions/volunteers/volunteers.ts`               | Create/update on ChurchMember        |
| `actions/volunteers/onboarding.ts`               | Set isVolunteer flag                 |
| `actions/volunteers/confirm-background-check.ts` | Update ChurchMember directly         |
| `actions/connect-card/save-connect-card.ts`      | Volunteer interest → set isVolunteer |
| `actions/connect-card/update-connect-card.ts`    | Volunteer assignment → set fields    |

### 4.2 Key Changes

```typescript
// BEFORE: Create volunteer record
const volunteer = await prisma.volunteer.create({
  data: {
    churchMemberId: memberId,
    status: "PENDING",
    organizationId,
  },
});

// AFTER: Update existing ChurchMember
await prisma.churchMember.update({
  where: { id: memberId },
  data: {
    isVolunteer: true,
    volunteerStatus: "pending",
    volunteerStartDate: new Date(),
  },
});
```

### 4.3 Validation Checklist

- [ ] Connect card with volunteer interest sets `isVolunteer = true`
- [ ] Background check flow updates correct fields
- [ ] Process volunteer action works
- [ ] Export includes correct volunteer data

---

## Phase 5: Update UI Components

**Goal:** UI reads from unified fields.

### 5.1 Files to Update

| File                                                          | Changes                       |
| ------------------------------------------------------------- | ----------------------------- |
| `components/dashboard/volunteers/columns.tsx`                 | Read from ChurchMember fields |
| `components/dashboard/volunteers/data-table.tsx`              | Update types                  |
| `components/dashboard/volunteers/volunteer-form.tsx`          | Update form fields            |
| `components/dashboard/volunteers/volunteer-detail-client.tsx` | Read unified data             |
| `app/church/[slug]/admin/volunteer/page.tsx`                  | Update data fetching          |

### 5.2 Type Updates

```typescript
// BEFORE
type VolunteerWithMember = Volunteer & { churchMember: ChurchMember };

// AFTER
type VolunteerMember = ChurchMember & {
  skills: VolunteerSkill[];
};
```

### 5.3 Validation Checklist

- [ ] Volunteer list displays correctly
- [ ] Volunteer detail page shows all fields
- [ ] Forms save data correctly
- [ ] No TypeScript errors

---

## Phase 6: Cleanup & Removal

**Goal:** Remove deprecated models, enums, and dead code.

### 6.1 Schema Removals

```prisma
// REMOVE these models
// - Volunteer
// - VolunteerCategory
// - Task
// - Appointment

// REMOVE these enums (keep as TypeScript constants)
// - MemberType
// - VolunteerStatus
// - BackgroundCheckStatus
// - AutomationStatus
// - VolunteerCategoryType
```

### 6.2 Remove Old Fields

```prisma
model ChurchMember {
  // REMOVE after migration verified
  // memberType        MemberType?      // Replaced by journeyStatus + role booleans
  // name              String?          // Replaced by firstName + lastName
}
```

### 6.3 Files to Delete

| File                | Reason                         |
| ------------------- | ------------------------------ |
| TBD after migration | Will identify during Phase 4-5 |

### 6.4 Validation Checklist

- [ ] `pnpm build` succeeds
- [ ] All E2E tests pass
- [ ] No references to removed models
- [ ] No orphaned files

---

## Rollback Plan

If issues arise during migration:

### Phase 1-2 Rollback

- Schema additions are non-breaking
- Data migration can be re-run
- Revert schema with `git checkout prisma/schema.prisma`

### Phase 3-5 Rollback

- Revert code changes to use old queries
- Data remains in both old and new fields

### Phase 6 Rollback

- **Most critical phase** - do NOT remove models until fully verified
- Keep backup of removed code in `archive/` directory
- Can restore schema from git history

---

## Success Criteria

Migration is complete when:

1. **Zero JOINs** for volunteer queries
2. **All volunteer data** accessible from ChurchMember
3. **All tests passing** (unit, integration, E2E)
4. **No TypeScript errors** in codebase
5. **Performance equal or better** (verify with EXPLAIN ANALYZE)
6. **Export produces identical output** as before

---

## Execution Order

Start with Phase 1. Each phase should be:

1. Implemented
2. Tested locally
3. Committed
4. PR created (if significant)
5. Merged to main before next phase

**Do NOT proceed to Phase 6 until Phases 1-5 are fully verified in production.**
