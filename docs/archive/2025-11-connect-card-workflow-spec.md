# Connect Card to Member Workflow - Specification

**Created:** 2025-11-23
**Updated:** 2025-11-25
**Status:** APPROVED - Ready for Implementation
**Purpose:** Define the core MVP workflow for processing connect cards into church member database

---

## Executive Summary

**The Core Problem:** When staff reviews a connect card and clicks "Save & Next", what happens?

**Current State:** Card status changes to "REVIEWED" and nothing else happens. No member created, no volunteer record, card just sits in database.

**Desired State:** Automatic creation/update of ChurchMember, Volunteer record (if applicable), PrayerRequest (if applicable), with proper duplicate detection.

---

## Approved Decisions

### 1. ChurchMember Creation Trigger

**Decision:** Option A - Auto-create on "Save & Next"

One-step workflow where clicking "Save & Next" does everything:

- Updates card data with staff corrections
- Creates/updates ChurchMember record
- Creates Volunteer record (if applicable)
- Creates PrayerRequest (if applicable)
- Changes status to PROCESSED

**Rationale:** Streamlined process, staff can handle data quality, no need for extra approval step.

---

### 2. Duplicate Detection Strategy

**Decision:** Email as primary identifier (Industry Standard)

| Scenario                    | Matching Logic | Action                      |
| --------------------------- | -------------- | --------------------------- |
| Email + Name match          | Exact match    | Auto-link and update member |
| Email match, Name different | Possible typo  | Flag for manual review      |
| Phone only match            | No email match | Create new member (MVP)     |

**Duplicate Card Prevention:**

- Check for identical cards scanned within same batch
- Prevent accidental double-scanning of same physical card
- Allow same person to submit multiple cards (different purposes like prayer vs volunteer)

**Note:** Phone-only matching deferred to post-MVP to avoid feature creep.

---

### 3. Member Type

**Decision:** Always create as MEMBER

- Everyone gets `memberType = "MEMBER"` regardless of visitType on card
- Keep it simple for MVP
- visitType from card can trigger automations later (e.g., first-time visitor follow-up)

---

### 4. Volunteer Record Creation

**Decision:** Option A - Auto-create with PENDING_APPROVAL status

When connect card has `volunteerCategory` selected:

- Create Volunteer record automatically
- Status: `PENDING_APPROVAL`
- Location: Same as connect card scan location
- Categories: Use what visitor selected on card
- Shows in Pending Volunteers tab for leader to process

**Workflow Integration:**

- Card reviewer assigns `assignedLeaderId` (who handles this volunteer)
- Card reviewer can trigger `sendBackgroundCheckInfo` for roles like Kids Ministry
- Assigned leader sees volunteer in their Pending tab

---

### 5. Data Update Strategy

**Decision:** Update contact info, append collections

| Field Type           | Strategy                                     |
| -------------------- | -------------------------------------------- |
| Phone, Email         | Always update with newest (trust fresh data) |
| Volunteer Categories | Append new to existing (preserve + add)      |
| Interests            | Append new to existing                       |
| Member Type          | Keep existing (stays MEMBER)                 |
| Prayer Requests      | Always create new record (maintain history)  |

**Rationale:** People fill out new cards because their info changed. Fresh data is more valuable than old data.

---

### 6. Export Strategy

**Decision:** CSV Export first, API Integration later

**Phase 1 (MVP):**

- CSV file download functionality
- Clean data format for church software import
- Manual export by staff (button click)

**Phase 2 (Future):**

- API Integration placeholder (show tab in UI for demos)
- Planning Center, CCB, Breeze API support

**UI:** Both options visible in Export tab to demonstrate flexibility.

---

### 7. Status Progression

**Decision:** Binary status - PENDING to PROCESSED

```
PENDING → PROCESSED
```

- Remove intermediate REVIEWED status
- Industry standard simple workflow
- Clear indication that all actions are complete

---

## Implementation Workflow

### Data Flow

```
Connect Card Uploaded
        |
        v
AI Extracts Data --> Status: PENDING
        |
        v
Staff Reviews in UI
        |
        v
Staff Clicks "Save & Next"
        |
        v
+------------------+
| Duplicate Check  |
| (by email)       |
+--------+---------+
         |
    +----+----+
    |         |
    v         v
Email      No Email
Match?     Match
    |         |
    v         v
+-------+  Create New
| Name  |  ChurchMember
| Match?|      |
+---+---+      |
    |          |
+---+---+      |
|       |      |
v       v      |
Auto   Flag    |
Update Review  |
    |    |     |
    +----+-----+
         |
         v
Has Volunteer Interest?
         |
    +----+----+
    |         |
   YES        NO
    |         |
    v         |
Create       |
Volunteer    |
(PENDING)    |
    |        |
    +--------+
         |
         v
Create Prayer Request (if present)
         |
         v
Link Card to ChurchMember
         |
         v
Status --> PROCESSED
         |
         v
Available for CSV Export
```

---

## Database Changes

### Schema Updates

```prisma
// ConnectCard model additions
model ConnectCard {
  // ... existing fields ...

  // NEW: Link to created/matched member
  churchMemberId String?
  churchMember   ChurchMember? @relation(fields: [churchMemberId], references: [id])
}

// Status enum change
enum ConnectCardStatus {
  PENDING
  EXTRACTED
  PROCESSED    // Changed from REVIEWED
  FLAGGED
  ARCHIVED
}
```

### Index Additions

```sql
-- Fast email lookups for duplicate detection
CREATE INDEX idx_church_member_email
ON ChurchMember(organizationId, email);
```

---

## Code Changes

### Files to Modify

1. **prisma/schema.prisma**

   - Add `churchMemberId` to ConnectCard
   - Change `REVIEWED` to `PROCESSED` in enum

2. **actions/connect-card/update-connect-card.ts**

   - Add ChurchMember find/create logic
   - Add Volunteer creation logic
   - Link card to member via `churchMemberId`
   - Change status to `PROCESSED`

3. **lib/data/member-management.ts** (new file)

   - `findMemberByEmail()`
   - `createMemberFromCard()`
   - `updateMemberFromCard()`

4. **components/dashboard/connect-cards/** (UI updates)

   - Update status displays from REVIEWED to PROCESSED
   - Add "Member Created" / "Member Updated" feedback

5. **app/church/[slug]/admin/connect-cards/** (new Export tab)
   - CSV export functionality
   - API integration placeholder

---

## Implementation Checklist

### Phase 1: Database & Core Logic

- [ ] Update Prisma schema (churchMemberId, status enum)
- [ ] Run `prisma db push` and `prisma generate`
- [ ] Create member-management.ts helper functions
- [ ] Update updateConnectCard action with member logic

### Phase 2: Volunteer Integration

- [ ] Add Volunteer record creation in updateConnectCard
- [ ] Use PENDING_APPROVAL status
- [ ] Link to correct location from card

### Phase 3: UI Updates

- [ ] Update status displays throughout app
- [ ] Add Export tab with CSV and API sections
- [ ] Show member creation feedback in review UI

### Phase 4: Testing

- [ ] Test new member creation from card
- [ ] Test existing member update (email match)
- [ ] Test volunteer record creation
- [ ] Test duplicate detection edge cases
- [ ] Verify multi-tenant isolation

---

## Industry Standard References

**Planning Center:** One-click approval, email-based deduplication, auto-updates contact info

**Breeze ChMS:** Email as primary key, warns on name mismatch, updates existing records

**Church Community Builder:** Confidence scoring for matches, manual review for uncertain

**Our Approach:** Follows Planning Center pattern - simple, email-based, auto-update with flag for name mismatches.

---

**Owner:** Development Team
**Approved By:** Product Owner (2025-11-25)
