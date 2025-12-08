# Prayer Management - Product Vision

**Status:** ✅ **Phase 1 COMPLETE** - PRs #49, #51, #56, #57 merged | Phase 2 planned
**Worktree:** `/church-connect-hub/prayer`
**Branch:** `feature/prayer-enhancements`
**Last Updated:** 2025-12-07
**Owner:** Church Operations Team

---

## ✅ Completed Work

### 1. Server Actions (COMPLETE)

All 6 server actions implemented with full security:

| Action                | File                        | Status  |
| --------------------- | --------------------------- | ------- |
| `createPrayerRequest` | `/actions/prayer-requests/` | ✅ Done |
| `updatePrayerRequest` | `/actions/prayer-requests/` | ✅ Done |
| `assignPrayerRequest` | `/actions/prayer-requests/` | ✅ Done |
| `markAnswered`        | `/actions/prayer-requests/` | ✅ Done |
| `deletePrayerRequest` | `/actions/prayer-requests/` | ✅ Done |
| `togglePrivacy`       | `/actions/prayer-requests/` | ✅ Done |

**Each action includes:**

- Zod validation schema
- Arcjet rate limiting
- Multi-tenant `organizationId` scoping
- Privacy checks for private prayers
- Location-based access control

---

### 2. UI Components (COMPLETE)

| Component            | Status  |
| -------------------- | ------- |
| Create prayer dialog | ✅ Done |
| Edit prayer dialog   | ✅ Done |
| Detail view dialog   | ✅ Done |

---

### 3. Performance: N+1 Query ✅ FIXED

**File:** `lib/data/prayer-requests.ts`
**Impact:** Was 10 sequential COUNT queries
**Status:** ✅ Fixed in PR #51 (Dec 4)

**The Fix:** Replaced 10 COUNT queries with single GROUP BY query.

---

### 4. My Prayer Sheet (PR #57) ✅ COMPLETE

**Route:** `/church/[slug]/my-prayers`
**Status:** ✅ Merged Dec 7

Devotional prayer session UI for prayer team members:

| Feature                   | Status  |
| ------------------------- | ------- |
| Critical prayer detection | ✅ Done |
| Category grouping         | ✅ Done |
| Print stylesheet          | ✅ Done |
| Mark answered action      | ✅ Done |
| Complete session action   | ✅ Done |
| Progress tracking         | ✅ Done |

**Key Files:**

- `lib/utils/prayer-priority.ts` - Critical keyword detection (cancer, death, emergency)
- `components/prayer-session/prayer-card.tsx` - Individual prayer card
- `components/prayer-session/prayer-section.tsx` - Category sections
- `app/church/[slug]/my-prayers/` - Prayer sheet page

---

## 📊 Progress Summary

| Priority | Issue              | Status  | PR  |
| -------- | ------------------ | ------- | --- |
| 1        | Server Actions (6) | ✅ Done | #49 |
| 2        | UI Components (3)  | ✅ Done | #49 |
| 3        | N+1 Query          | ✅ Done | #51 |
| 4        | Privacy redaction  | ✅ Done | #56 |
| 5        | My Prayer Sheet    | ✅ Done | #57 |

**Phase 1:** ✅ 100% Complete - All PRs merged to main
**Phase 2:** 📋 Planned - Prayer Team Workflow (see below)

---

## 🎯 Product Vision

### The Problem

Churches collect prayer requests via connect cards but have no organized way to:

- Track requests from submission to completion
- Assign requests to prayer team members
- Follow up on answered prayers
- Maintain privacy for sensitive requests

### The Solution

Simple prayer request management integrated with connect card workflow:

**Primary Source (70-80%):** Connect cards → AI extraction → Auto-create prayers
**Secondary Source (20-30%):** Manual entry for phone/email submissions

### Success Criteria

- ✅ All connect card prayers automatically tracked
- ✅ Simple manual creation for edge cases (phone, email, urgent)
- ✅ Privacy controls (public vs private)
- ✅ Assignment workflow (staff → team member)
- ✅ Answered prayer tracking

---

## 🏗️ Architecture

### Database Schema

```prisma
model PrayerRequest {
  id             String              @id
  organizationId String              // Multi-tenant isolation
  locationId     String?             // Multi-campus support

  // Request details
  request        String              // Prayer text (2000 char max)
  category       String?             // Auto-detected: Health, Family, Salvation, etc.
  isPrivate      Boolean             // Privacy control
  isUrgent       Boolean             // Priority flag

  // Source tracking
  connectCardId  String?             // Link to connect card (null for manual)
  submittedBy    String?             // Person's name
  submitterEmail String?             // For follow-up
  submitterPhone String?             // For follow-up

  // Workflow
  status         PrayerRequestStatus // PENDING, ASSIGNED, PRAYING, ANSWERED, ARCHIVED
  assignedToId   String?             // Assigned team member
  followUpDate   DateTime?           // Scheduled follow-up
  answeredDate   DateTime?           // When answered
  answeredNotes  String?             // Testimony

  createdAt      DateTime
  updatedAt      DateTime
}
```

### Privacy Model

Three privacy levels (expanding from current boolean):

| Level         | Who Sees Identity         | Who Sees Request       | Follow-up? |
| ------------- | ------------------------- | ---------------------- | ---------- |
| **PUBLIC**    | All prayer team           | All prayer team        | Yes        |
| **PRIVATE**   | Assigned + admins only    | Assigned + admins only | Yes        |
| **ANONYMOUS** | No one (PII never stored) | All prayer team        | No         |

- **Auto-detection**: Sensitive keywords → auto-mark private
- **Manual override**: Staff can change privacy (except cannot "un-anonymize")
- **Anonymous = "Pray for me, don't contact me"**

### Multi-Tenant Scoping

- Filter by `organizationId` (church isolation)
- Filter by `locationId` (multi-campus support)
- Staff see only public + assigned private requests
- Admins see all requests

---

## 🚀 Feature Scope

### ✅ What's Built (100% Complete)

**Database Layer:**

- ✅ PrayerRequest model with full schema
- ✅ Multi-tenant data scoping
- ✅ Privacy filtering logic
- ✅ Category auto-detection (8 categories)
- ✅ Sensitive keyword detection

**Server Actions (PR #49):**

- ✅ Create prayer request (manual entry)
- ✅ Update prayer request (edit text/category)
- ✅ Assign to team member
- ✅ Mark as answered (with testimony)
- ✅ Delete/archive prayer request
- ✅ Toggle privacy

**UI Layer:**

- ✅ Prayer requests table (TanStack Table)
- ✅ Search, filter, sort, pagination
- ✅ Privacy indicators
- ✅ Status badges
- ✅ Location filtering (multi-campus)
- ✅ Empty states
- ✅ Create prayer dialog
- ✅ Edit prayer dialog
- ✅ Detail view dialog

**Performance (PR #51):**

- ✅ N+1 query optimization (GROUP BY)

**Privacy (PR #56):**

- ✅ Redact submittedBy for private prayers from unauthorized staff

**Testing:**

- ✅ E2E test suite (8 tests)
- ✅ Multi-tenant isolation verified
- ✅ Privacy controls validated

---

## 📋 Phase 2: Prayer Team Workflow (NEXT)

**Goal:** Complete the end-to-end workflow so prayer team members can actually receive and pray over requests.

### Current Workflow Gap

The `/my-prayers` page exists, but prayers don't flow into it automatically:

```
CURRENT (BROKEN):
Connect Card → prayer text stored → STUCK (not in workflow)
                                    ↓
                     Admin must manually create PrayerRequest records
                                    ↓
                     Admin must manually create PrayerBatch (no UI exists!)
                                    ↓
                     Prayer team has no visibility they have assignments
```

### Phase 2.1: Auto-Create from Connect Cards (CRITICAL)

**Problem:** Prayers from connect cards never enter the prayer workflow system.

**Current:** `ConnectCard.prayerRequest` stores text but no `PrayerRequest` record is created.

**Solution:** When connect card is processed with prayer text, auto-create `PrayerRequest`.

| Task                                             | Status |
| ------------------------------------------------ | ------ |
| Hook in `save-connect-card.ts` or `approve-all`  | [ ]    |
| Create PrayerRequest with `connectCardId` linked | [ ]    |
| Auto-detect privacy (sensitive keywords)         | [ ]    |
| Auto-detect category (existing logic)            | [ ]    |

**Files to modify:**

- `actions/connect-card/save-connect-card.ts`
- `actions/connect-card/approve-all-cards.ts`

---

### Phase 2.2: Dashboard Widget for Prayer Team (CRITICAL)

**Problem:** Prayer team members have zero visibility that prayers are assigned to them.

**Current:** They must manually navigate to `/my-prayers` to see assignments.

**Solution:** Add dashboard widget showing assigned prayer count.

| Task                                     | Status |
| ---------------------------------------- | ------ |
| Create `AssignedPrayersWidget` component | [ ]    |
| Add to dashboard for prayer team role    | [ ]    |
| Show count + "Start Praying" button      | [ ]    |
| Query: `getMyAssignedPrayerCount()`      | [ ]    |

**Files to modify:**

- `app/church/[slug]/admin/_components/DashboardClient.tsx`
- `lib/data/prayer-requests.ts` (add count query)

---

### Phase 2.3: Batch Creation (HIGH)

**Problem:** PrayerBatch records must exist for assignment, but there's no way to create them.

**Current:** UI claims "batches are automatically created daily" but no such code exists.

**Options:**

1. **Auto-batch (recommended):** Cron/trigger creates daily batches from unassigned prayers
2. **Manual batch:** Admin UI to "Create Batch from X pending prayers"

| Task                               | Status |
| ---------------------------------- | ------ |
| Decide: auto-batch vs manual batch | [ ]    |
| Implement batch creation function  | [ ]    |
| Add UI trigger or cron job         | [ ]    |
| Update batch list page             | [ ]    |

**Files to modify:**

- `lib/data/prayer-batches.ts`
- `app/church/[slug]/admin/prayer-batches/`

---

### Phase 2.4: Enhanced Prayer Session (NICE TO HAVE)

| Task                                          | Status |
| --------------------------------------------- | ------ |
| Full-screen prayer mode for tablets           | [ ]    |
| Keyboard/swipe navigation between prayers     | [ ]    |
| PDF export option                             | [ ]    |
| Allow completion without all prayers answered | [ ]    |

---

### Phase 2 Definition of Done

- [ ] Connect card prayers auto-create PrayerRequest records
- [ ] Prayer team sees assigned count on dashboard
- [ ] Batches can be created (auto or manual)
- [ ] End-to-end: Card → Prayer → Batch → Assignment → Session → Complete

---

## 📋 Future Phases (Wishlist)

**Phase 3 - Integration:**

- [ ] Connect card review → auto-create prayer (when connect card is saved with prayer text)

**Phase 4 - Anonymous Prayer Support:**

- [ ] Privacy level enum (PUBLIC, PRIVATE, ANONYMOUS)
- [ ] Public prayer form (no auth required)
- [ ] Analytics without PII

---

## 📋 Historical Implementation Roadmap (COMPLETED)

### Phase 1: Server Actions (NEXT - Critical)

**Goal:** Enable CRUD operations from UI

**Tasks:**

1. Implement 5 server actions (create, update, assign, mark-answered, delete)
2. Add Zod validation schemas
3. Add Arcjet rate limiting
4. Multi-tenant isolation checks

**Deliverables:**

- Functional create/edit/delete operations
- Assignment workflow working
- Privacy controls enforced

---

### Phase 2: Simple Manual Creation

**Goal:** Basic form for phone/email prayer submissions

**Tasks:**

1. Create simple form (name, request text, privacy toggle)
2. Dialog wrapper with "New Prayer Request" button
3. Success/error handling with toast
4. Table refresh on success

**Deliverables:**

- Staff can manually create prayers
- Simple, fast workflow
- No complex fields (keep minimal)

**Hold for Church Feedback:**

- Email submission workflow
- Phone intake process
- Advanced categorization
- Follow-up automation

---

### Phase 3: Assignment & Completion

**Goal:** Complete prayer lifecycle workflow

**Tasks:**

1. Assignment dialog (select team member, add notes)
2. Detail view dialog (full request, edit capability)
3. Mark as answered (testimony textarea)
4. Assignment history tracking

**Deliverables:**

- Full assignment workflow
- Answered prayer tracking
- Team member workload visibility

---

### Phase 4: Connect Card Integration

**Goal:** Auto-create prayers from connect card review

**Tasks:**

1. Modify connect card review action
2. Extract `extractedData.prayerRequest`
3. Create PrayerRequest with `connectCardId` link
4. Privacy auto-detection
5. Category auto-detection

**Deliverables:**

- 70-80% of prayers automated
- Manual review only for exceptions
- Privacy respected automatically

---

### Phase 5: Anonymous Prayer Support

**Goal:** Allow prayer submissions without identity for privacy-sensitive requests

**Key Insight:** Some people want prayer but don't want anyone reaching out. Anonymous means "pray for me, don't contact me."

**Schema Changes:**

```prisma
model PrayerRequest {
  // ... existing fields ...

  // Privacy level (replaces boolean isPrivate)
  privacyLevel           PrayerPrivacyLevel @default(PUBLIC)
  isAnonymous            Boolean            @default(false)

  // Analytics without PII
  analyticsCorrelationId String?            @default(uuid())

  // Submission source tracking
  submissionSource       PrayerSubmissionSource @default(CONNECT_CARD)
  connectCardAnonymous   Boolean            @default(false)
}

enum PrayerPrivacyLevel {
  PUBLIC      // All staff see name + request
  PRIVATE     // Only assigned + admins see identity
  ANONYMOUS   // No one sees identity, PII never stored
}

enum PrayerSubmissionSource {
  CONNECT_CARD    // From scanned card
  PUBLIC_FORM     // Website/kiosk (no auth)
  STAFF_ENTRY     // Manual staff entry
  MEMBER_PORTAL   // Authenticated member
}
```

**Two Anonymous Flows:**

1. **Connect Card with Anonymous Prayer**

   - Person fills out card (name, email, phone)
   - Checks "Keep my prayer anonymous"
   - ChurchMember created with full contact info
   - PrayerRequest created WITHOUT linking PII
   - Staff can follow up about OTHER things, just not the prayer

2. **Public Prayer Form** (future)
   - `/church/[slug]/prayer` - no auth required
   - Just prayer text + optional category
   - Rate limited by IP/fingerprint
   - No PII stored at all

**Analytics Without PII:**

The `analyticsCorrelationId` enables trend tracking:

- "40% of prayers this month were anonymous"
- "Anonymous prayers more likely health-related"
- Cannot identify individuals

**Tasks:**

1. Add `privacyLevel` enum to schema (migrate from `isPrivate` boolean)
2. Add `isAnonymous`, `analyticsCorrelationId`, `submissionSource` fields
3. Add "Keep prayer anonymous" checkbox to connect card review
4. Update `createPrayerRequestFromConnectCard()` to handle anonymous
5. Update prayer table to show "Anonymous" instead of name
6. Add anonymous prayer analytics to dashboard

**Deliverables:**

- Connect card prayers can be marked anonymous
- No follow-up capability for anonymous (by design)
- Analytics track anonymous trends without PII
- Migration path for existing `isPrivate` data

---

## 🚫 Out of Scope (For Now)

**Not building (defer to Phase 4+):**

- ❌ Prayer team management (use existing team roles)
- ❌ Advanced reporting/analytics (beyond basic stats)
- ❌ GHL SMS notifications
- ❌ Follow-up automation workflows
- ❌ Public prayer wall (display answered prayers publicly)

**Rationale:** Ship Phase 2 workflow first, add complexity based on church feedback.

---

## 📊 Key Metrics

**Phase 1 Status (COMPLETE):**

- Database: ✅ Complete
- UI: ✅ Complete
- E2E Tests: ✅ Complete
- Server Actions: ✅ Complete (PR #49)
- N+1 Optimization: ✅ Complete (PR #51)
- Privacy Redaction: ✅ Complete (PR #56)
- My Prayer Sheet: ✅ Complete (PR #57)

**Phase 2 Status (PLANNED):**

- Auto-create from connect cards: 📋 Not started
- Dashboard widget: 📋 Not started
- Batch creation: 📋 Not started

**Merged PRs:** #49, #51, #56, #57

---

## 🔄 Workflow Example

### Scenario 1: Connect Card Prayer (Automated)

```
Sunday service
  → Visitor fills connect card with prayer request
  → Staff scans card
  → AI extracts prayer text
  → Auto-creates PrayerRequest (connectCardId linked)
  → Privacy auto-detected
  → Category auto-assigned
  → Appears in prayer table
  → Staff assigns to team member
  → Team member prays, marks answered
```

**Staff effort:** 30 seconds (assign only)

---

### Scenario 2: Phone Call Prayer (Manual)

```
Monday morning
  → Church office receives call: "Pray for my mom's surgery"
  → Staff clicks "New Prayer Request"
  → Enters: Name, request text
  → Toggles privacy if sensitive
  → Submits
  → Assigns to prayer team member
  → Team member prays, marks answered
```

**Staff effort:** 2 minutes (manual entry)

---

## ✅ Success Criteria

**We've succeeded when:**

1. ✅ 80%+ of prayers come from connect cards (automated)
2. ✅ Staff can manually create prayers in <2 minutes
3. ✅ Privacy controls prevent accidental public exposure
4. ✅ Team members can see only their assigned prayers
5. ✅ Answered prayers are tracked with testimonies
6. ✅ Multi-campus churches can filter by location

---

## 🎓 Design Principles

### 1. Simplicity Over Features

- **Individual prayers**, not batched
- **Simple table**, not complex dashboards
- **Basic CRUD**, not advanced workflows
- Ship fast, enhance based on feedback

### 2. Privacy First

- **Default public**, explicit private
- **Auto-detect** sensitive keywords
- **Staff permissions** enforced
- **Private → assigned only** strict isolation

### 3. Multi-Source Support

- **Primary:** Connect cards (automated)
- **Secondary:** Manual entry (fallback)
- **Both supported**, clean UX for each

### 4. Multi-Tenant Architecture

- **Organization isolation** (church data never leaks)
- **Location filtering** (multi-campus support)
- **Role-based access** (staff vs admin permissions)

---

## 📖 Related Documentation

- **Implementation Details:** `/docs/technical/architecture-decisions.md` (ADR-XXX)
- **Database Schema:** `/prisma/schema.prisma` (PrayerRequest model)
- **E2E Tests:** `/tests/e2e/09-prayer-management.spec.ts`
- **Data Layer:** `/lib/data/prayer-requests.ts`

---

**Last Updated:** 2025-12-07
**Status:** ✅ Phase 1 complete | 📋 Phase 2 planned
**Next Review:** When Phase 2 work begins (connect card integration, dashboard widget)
