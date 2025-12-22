# Member Unification Architecture

**Created:** December 21, 2025  
**Purpose:** Team handoff document for migrating to unified member model  
**Status:** Approved for implementation

---

## 1. Executive Summary

We are consolidating `ChurchMember` and `Volunteer` into a **single unified model** that serves as the source of truth for all people in the church database.

**Why:**

- Eliminates JOINs on every query
- Simplifies messaging filters, event invites, and exports
- Matches Planning Center's architecture (our primary export target)
- Single profile view instead of assembling from multiple sources
- Scales better with 1,000+ churches

**What changes:**

- Volunteer fields merge into ChurchMember
- VolunteerCategory becomes a string array
- VolunteerSkill becomes a string array (or stays as model - team decision)
- Volunteer model is retired

---

## 2. Naming Consideration

**Problem:** The name `Member` is already used in our schema for Better Auth's organization membership (line 96-113). This is the User ↔ Organization junction table required by Better Auth.

**Options:**

| Name           | Pros                                       | Cons                                              |
| -------------- | ------------------------------------------ | ------------------------------------------------- |
| `ChurchMember` | Already exists, minimal rename             | Verbose, "Church" is redundant in church software |
| `Person`       | Matches Planning Center                    | Generic, could conflict with future models        |
| `Profile`      | Matches our "profile + attributes" concept | Might imply user settings                         |
| `Contact`      | Common CRM terminology                     | Less personal, might imply sales                  |

**Recommendation:** Keep `ChurchMember` for now. Rename is a future consideration after migration is stable. The internal name matters less than the architecture.

**Team decision needed:** Confirm model name or choose alternative.

---

## 3. Current State

### Models Involved

```
ChurchMember (line 455-510)
├── Core identity fields
├── memberType enum (VISITOR, RETURNING, MEMBER, VOLUNTEER, STAFF)
├── tags[], detectedKeywords, customFields
├── Relations: connectCards[], volunteer?, notes[], etc.

Volunteer (line 675-739)
├── 1:1 with ChurchMember
├── Volunteer-specific fields (status, bgCheck, dates, etc.)
├── Relations: categories[], skills[]

VolunteerCategory (line 744-770)
├── Junction: Volunteer → Category
├── Has metadata: assignedAt, assignedBy, notes

VolunteerSkill (line 820-846)
├── Junction: Volunteer → Skill
├── Has metadata: proficiency, isVerified, expiryDate
```

### Current Query Pattern

To find active kids ministry volunteers with cleared background checks:

```sql
SELECT cm.*, v.*
FROM church_member cm
JOIN volunteer v ON v.churchMemberId = cm.id
JOIN volunteer_category vc ON vc.volunteerId = v.id
WHERE cm.organizationId = ?
  AND v.status = 'ACTIVE'
  AND v.backgroundCheckStatus = 'CLEARED'
  AND vc.category = 'KIDS_MINISTRY'
```

3 tables. 2 JOINs. Every volunteer query has this overhead.

---

## 4. Target State

### Unified Model Concept

```
ChurchMember (unified)
├── IDENTITY
│   ├── firstName, lastName (split from name)
│   ├── email, phone, address
│
├── JOURNEY (progression, replaces memberType enum)
│   ├── journeyStatus: string ("visitor" | "returning" | "regular" | "member")
│   ├── firstVisitDate
│   ├── memberSinceDate
│   ├── lastActivityDate
│
├── ROLES (additive booleans)
│   ├── isVolunteer: boolean
│   ├── isStaff: boolean
│   ├── isLeader: boolean
│
├── VOLUNTEER ATTRIBUTES (nullable, populated if isVolunteer = true)
│   ├── volunteerStatus: string
│   ├── volunteerCategories: string[]
│   ├── volunteerSkills: string[] (or keep relation - see section 5)
│   ├── volunteerStartDate
│   ├── volunteerEndDate
│   ├── volunteerInactiveReason
│   ├── emergencyContactName
│   ├── emergencyContactPhone
│   ├── backgroundCheckStatus: string
│   ├── backgroundCheckDate
│   ├── backgroundCheckExpiry
│   ├── bgCheckToken
│   ├── bgCheckConfirmedAt
│   ├── readyForExport: boolean
│   ├── readyForExportDate
│   ├── documentsSentAt
│   ├── exportedAt
│   ├── automationStatus: string
│   ├── automationStartedAt
│   ├── automationResponseAt
│   ├── reliabilityScore: float (new - for events feature)
│   ├── totalEventsServed: int (new)
│   ├── lastServedDate: datetime (new)
│
├── LOCATION
│   ├── locationId (home campus)
│
├── FLEXIBLE
│   ├── tags: string[]
│   ├── detectedKeywords: json
│   ├── customFields: json
│
├── RELATIONS
│   ├── connectCards[]
│   ├── notes[]
│   ├── eventAssignments[] (new - for volunteer events)
│   ├── documentDeliveries[]
│   ├── integrations[]
│   └── messageRecipients[] (new - for messaging feature)
```

### Target Query Pattern

Same query, unified:

```sql
SELECT *
FROM church_member
WHERE organizationId = ?
  AND isVolunteer = true
  AND volunteerStatus = 'active'
  AND backgroundCheckStatus = 'cleared'
  AND 'KIDS_MINISTRY' = ANY(volunteerCategories)
```

1 table. 0 JOINs. Indexable.

---

## 5. Decisions for the Team

### Decision 1: MemberType Enum

**Current:** `MemberType` enum with exclusive values: VISITOR, RETURNING, MEMBER, VOLUNTEER, STAFF

**Problem:** A person can be a Member AND a Volunteer AND Staff simultaneously. These aren't exclusive.

**Proposed:** Split into:

- `journeyStatus` (string): "visitor" → "returning" → "regular" → "member" (progression)
- `isVolunteer` (boolean): Can be true regardless of journey
- `isStaff` (boolean): Can be true regardless of journey

**Alternative:** Keep enum but add boolean flags. Enum represents "primary" classification.

**Team decides:** Which approach matches our product logic better?

---

### Decision 2: VolunteerCategory Model

**Current:** Junction table with metadata (assignedAt, assignedBy, notes)

**Question:** Do we need the metadata?

**If no:** Flatten to `volunteerCategories: String[]` on ChurchMember

**If yes:** Keep VolunteerCategory model, but link directly to ChurchMember (not Volunteer)

**Consideration:** The volunteer events feature filters by category. Array is simpler. Metadata is rarely displayed.

**Team decides:** Keep junction table or flatten to array?

---

### Decision 3: VolunteerSkill Model

**Current:** Has meaningful metadata: proficiency, isVerified, verifiedDate, expiryDate

**Analysis:** Skills with expiration dates (CPR certification, etc.) probably need the full model. Simple skills ("can play guitar") could be strings.

**Options:**

1. Keep VolunteerSkill model, link to ChurchMember directly
2. Flatten to `volunteerSkills: String[]`, lose metadata
3. Hybrid: Simple skills as strings, certified skills as separate model

**Team decides:** Based on how skills are actually used in the app.

---

### Decision 4: Name Field

**Current:** Single `name` field

**Planning Center uses:** `firstName`, `lastName` separately

**Impact:** Export transformations, search, display

**Team decides:** Split now or add as optional fields for future?

---

### Decision 5: Dead Models

From the codebase audit, these models have zero or minimal usage:

| Model       | Current State  | Recommendation                            |
| ----------- | -------------- | ----------------------------------------- |
| Task        | 0 queries      | Remove                                    |
| Appointment | Mock data only | Remove                                    |
| Message     | Mock data only | Remove or repurpose for messaging feature |
| MemberNote  | Minimal use    | Keep (useful for profiles)                |

**Team decides:** Confirm removal list.

---

## 6. Models Being Retired

### Volunteer Model → Merged into ChurchMember

All fields from Volunteer (line 675-739) move to ChurchMember with `volunteer` prefix where clarity is needed.

| Volunteer Field       | New Location                         | Notes                                  |
| --------------------- | ------------------------------------ | -------------------------------------- |
| status                | ChurchMember.volunteerStatus         | String, not enum                       |
| startDate             | ChurchMember.volunteerStartDate      |                                        |
| endDate               | ChurchMember.volunteerEndDate        |                                        |
| inactiveReason        | ChurchMember.volunteerInactiveReason |                                        |
| emergencyContactName  | ChurchMember.emergencyContactName    |                                        |
| emergencyContactPhone | ChurchMember.emergencyContactPhone   |                                        |
| backgroundCheckStatus | ChurchMember.backgroundCheckStatus   | String, not enum                       |
| backgroundCheckDate   | ChurchMember.backgroundCheckDate     |                                        |
| backgroundCheckExpiry | ChurchMember.backgroundCheckExpiry   |                                        |
| bgCheckToken          | ChurchMember.bgCheckToken            |                                        |
| bgCheckConfirmedAt    | ChurchMember.bgCheckConfirmedAt      |                                        |
| readyForExport        | ChurchMember.readyForExport          |                                        |
| readyForExportDate    | ChurchMember.readyForExportDate      |                                        |
| documentsSentAt       | ChurchMember.documentsSentAt         |                                        |
| exportedAt            | ChurchMember.volunteerExportedAt     | Rename for clarity                     |
| automationStatus      | ChurchMember.automationStatus        | String, not enum                       |
| automationStartedAt   | ChurchMember.automationStartedAt     |                                        |
| automationResponseAt  | ChurchMember.automationResponseAt    |                                        |
| notes                 | ChurchMember.volunteerNotes          | Keep separate from MemberNote relation |
| customFields          | Merge into ChurchMember.customFields |                                        |
| locationId            | ChurchMember.locationId              | Already exists concept                 |
| categories            | ChurchMember.volunteerCategories[]   | If flattening                          |
| skills                | ChurchMember.volunteerSkills[]       | If flattening                          |

### VolunteerCategory Model → Decision Pending

If flattening: Extract `category` values into `ChurchMember.volunteerCategories: String[]`

If keeping: Change foreign key from `volunteerId` to `churchMemberId`

### ServingOpportunity Model → Becomes VolunteerEvent

This is part of the Volunteer Events feature, not this migration. But note the model exists and will be repurposed.

---

## 7. Enums Becoming Strings

We're moving from rigid enums to flexible strings. This allows:

- Adding new values without migrations
- Per-church customization (future)
- Simpler client code

| Current Enum          | New Field             | Default Values                                                                  |
| --------------------- | --------------------- | ------------------------------------------------------------------------------- |
| MemberType            | journeyStatus         | "visitor", "returning", "regular", "member"                                     |
| VolunteerStatus       | volunteerStatus       | "active", "on_break", "inactive", "pending"                                     |
| BackgroundCheckStatus | backgroundCheckStatus | "not_started", "in_progress", "pending_review", "cleared", "flagged", "expired" |
| AutomationStatus      | automationStatus      | "pending", "day1_sent", "day3_sent", "responded", "expired"                     |
| VolunteerCategoryType | volunteerCategories[] | "general", "greeter", "usher", "kids_ministry", etc.                            |

**Keep enums in code for type safety:** Define TypeScript const arrays with the valid values. Use Zod for validation. Just don't enforce at database level.

---

## 8. New Fields (For Upcoming Features)

These fields support the Volunteer Events and Messaging features:

| Field             | Type     | Purpose                          |
| ----------------- | -------- | -------------------------------- |
| isVolunteer       | boolean  | Role flag (vs. journey status)   |
| isStaff           | boolean  | Role flag                        |
| isLeader          | boolean  | Role flag                        |
| reliabilityScore  | float    | Calculated from event attendance |
| totalEventsServed | int      | Cached count for display         |
| lastServedDate    | datetime | Cached for filtering             |
| locationId        | string   | Home campus (may already exist)  |

---

## 9. Index Strategy

**Primary query patterns:**

1. List all members in org (filtered by journey, role, location)
2. Find volunteers for event invite (category, bg check, status, location)
3. Messaging filters (tags, keywords, dates, journey)
4. Duplicate detection (email lookup)

**Recommended indexes:**

```
@@index([organizationId])
@@index([organizationId, journeyStatus])
@@index([organizationId, isVolunteer])
@@index([organizationId, isVolunteer, volunteerStatus])
@@index([organizationId, locationId])
@@index([email])
```

**For array fields (if using Postgres):**

```
@@index([organizationId, volunteerCategories]) // GIN index
@@index([organizationId, tags]) // GIN index
```

---

## 10. Migration Approach

### Phase 1: Add New Fields

1. Add all new fields to ChurchMember (nullable where appropriate)
2. Add `isVolunteer` boolean defaulting to false
3. Add array fields with defaults
4. Deploy schema changes
5. Verify application still works (no breaking changes yet)

### Phase 2: Data Migration

1. Write migration script that:
   - For each Volunteer record:
     - Set `ChurchMember.isVolunteer = true`
     - Copy all volunteer fields to ChurchMember
     - Copy categories to array (if flattening)
     - Copy skills to array (if flattening)
2. Run in staging, verify data integrity
3. Run in production during low-traffic window

### Phase 3: Update Application Code

1. Update all queries to use unified model
2. Update all mutations to write to unified fields
3. Update UI to read from unified model
4. Remove all Volunteer model references

### Phase 4: Cleanup

1. Drop Volunteer model from schema
2. Drop VolunteerCategory if flattened
3. Drop VolunteerSkill if flattened
4. Remove dead models (Task, Appointment, Message if confirmed)
5. Drop old enums from schema

---

## 11. Code Areas to Update

These areas will need changes. This is not exhaustive—use as a starting checklist:

| Area                 | Files/Folders                               | Change Type                |
| -------------------- | ------------------------------------------- | -------------------------- |
| Schema               | `prisma/schema.prisma`                      | Add fields, remove models  |
| Volunteer data layer | `lib/data/volunteers.ts`                    | Query unified model        |
| Contact data layer   | `lib/data/contacts.ts`                      | Already uses ChurchMember  |
| Connect card save    | `actions/connect-card/save-connect-card.ts` | Write to unified model     |
| Volunteer actions    | `actions/volunteers/*.ts`                   | Query/mutate unified model |
| Volunteer UI         | `components/dashboard/volunteers/`          | Read from unified fields   |
| Export functions     | Export-related files                        | Transform unified model    |
| GHL service          | `lib/ghl/service.ts`                        | Read from unified model    |
| Type definitions     | Various                                     | Update types               |
| Zod schemas          | `lib/zodSchemas.ts`                         | Update validation          |

---

## 12. Validation Checklist

After migration, verify:

### Data Integrity

- [ ] All Volunteer records have corresponding ChurchMember with `isVolunteer = true`
- [ ] All volunteer field values copied correctly
- [ ] All category assignments preserved (as array or junction)
- [ ] All skill assignments preserved
- [ ] No orphaned records

### Functionality

- [ ] Volunteer list page shows same data as before
- [ ] Volunteer detail page shows all fields
- [ ] Connect card → volunteer flow creates correct data
- [ ] Background check status updates work
- [ ] Export produces correct output
- [ ] Filters work (category, status, bg check, location)

### Performance

- [ ] Volunteer list query time equal or better
- [ ] No N+1 queries introduced
- [ ] Index utilization verified (EXPLAIN ANALYZE)

---

## 13. What I Need Back for Confirmation

Once migration is complete, provide:

1. **Schema diff:** Show the final ChurchMember model

2. **Decision log:** Document choices made on:

   - Model name (kept ChurchMember or renamed)
   - MemberType approach (journey + booleans, or other)
   - VolunteerCategory (flattened or kept)
   - VolunteerSkill (flattened or kept)
   - Dead models removed

3. **Sample queries:** Show the updated queries for:

   - Find volunteers for event invite (with all filters)
   - Messaging filter (members by tags + keywords + date range)
   - Connect card save (creating/updating member with volunteer interest)

4. **Removed items list:** Confirm what was deleted:

   - Models
   - Enums
   - Files
   - Dead code

5. **Any blockers or deviations:** Where did you need to deviate from this spec and why?

---

## 14. Questions for Me

If the team has questions during implementation, document them. Common areas of uncertainty:

- How to handle edge cases in data migration
- Whether a field should be required vs optional
- How to handle existing API contracts
- Performance concerns with specific queries

Capture the question, your decision, and rationale. This becomes part of the project knowledge.

---

**Document Status:** Ready for team handoff

**Next Steps:**

1. Team reviews and confirms decisions (Section 5)
2. Create feature branch for migration
3. Execute phases 1-4
4. Return confirmation items (Section 13)
