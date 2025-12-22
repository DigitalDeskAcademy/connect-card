# Brief: Data Structures for Messaging Feature

**Created:** 2025-12-19
**Purpose:** Inform messaging filter UI design

---

## 1. Connect Card `extractedData` JSON Structure

**Source:** `lib/zodSchemas.ts:73-88`

```typescript
{
  name: string | null,           // max 200 chars
  email: string | null,          // max 255 chars
  phone: string | null,          // max 50 chars
  prayer_request: string | null, // max 5000 chars
  visit_status: string | null,   // e.g., "First Visit", max 100 chars
  first_time_visitor: boolean,   // optional
  interests: string[],           // max 20 items, each max 100 chars
  keywords: string[],            // max 10 items, each max 50 chars (campaign triggers)
  address: string | null,        // max 500 chars
  age_group: string | null,      // max 50 chars
  family_info: string | null,    // max 500 chars
  additional_notes: string | null // max 2000 chars
}
```

**Filterable/Searchable fields:**

- `name`, `email`, `phone` - text search
- `interests[]` - multi-select filter ("Kids Ministry", "Worship", etc.)
- `keywords[]` - campaign filter ("impacted", "coffee oasis")
- `visit_status` / `first_time_visitor` - visitor type filter
- `age_group` - demographic filter

---

## 2. ChurchMember Architecture (Lightweight Profile + Attributes)

**Source:** `prisma/schema.prisma:455-510`, `docs/features/member/vision.md`

```typescript
ChurchMember {
  // === Core Fields ===
  id: string,
  organizationId: string,        // Multi-tenant key
  name: string,
  email: string | null,
  phone: string | null,
  address: string | null,

  // === Member Classification ===
  memberType: MemberType,        // VISITOR | RETURNING | MEMBER | VOLUNTEER | STAFF
  visitDate: DateTime | null,    // First visit
  memberSince: DateTime | null,  // Official member date

  // === Flexible Attributes (YOUR FILTER TARGETS) ===
  tags: string[],                // CRM tags - user-defined, freeform
  detectedKeywords: Json,        // [{ keyword: string, detectedAt: DateTime }]
  customFields: Json | null,     // Arbitrary key-value pairs

  // === Future/Placeholder ===
  smallGroupId: string | null,   // String reference (not relation)
  servingTeamId: string | null,  // String reference (not relation)
  timezone: string | null,

  // === Relations ===
  volunteer: Volunteer?,         // One-to-one if they're a volunteer
  connectCards: ConnectCard[],
  notes: MemberNote[],
  // ... plus appointments, messages, tasks, payments
}
```

---

## 3. Implications for Messaging Filter UI

The architecture is **lightweight profile + attributes**, not old relational model.

| Filter Type            | Data Source                  | UI Pattern                                                       |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------- |
| **Member Type**        | `memberType` enum            | Dropdown/Checkbox (VISITOR, RETURNING, MEMBER, VOLUNTEER, STAFF) |
| **Tags**               | `tags[]` String array        | Multi-select (user-defined, pulled from existing tags in org)    |
| **Keywords**           | `detectedKeywords[]` JSON    | Multi-select (campaign-specific, 30-day retention)               |
| **Custom Fields**      | `customFields{}` JSON        | Dynamic - depends on what fields exist                           |
| **Location**           | `locationId` via relation    | Dropdown (from org locations)                                    |
| **Volunteer Status**   | `volunteer.status` if exists | ACTIVE, ON_BREAK, INACTIVE, PENDING                              |
| **Volunteer Category** | `volunteer.categories[]`     | Multi-select (GREETER, USHER, KIDS_MINISTRY, etc.)               |

**Key Design Decisions:**

1. **Tags are freeform strings** - Fetch distinct tags across the org for filter dropdown
2. **Keywords have timestamps** - Can filter by "keywords detected in last X days"
3. **CustomFields is schemaless JSON** - Would need separate config to know what fields exist per org
4. **No rigid small group / serving team relations** - Just string IDs for future flexibility

---

## 4. Relevant Code Paths

| Function               | Location                                 | Purpose                                   |
| ---------------------- | ---------------------------------------- | ----------------------------------------- |
| Keyword filter         | `lib/data/contacts.ts:99-103`            | Uses `string_contains` on JSON            |
| Get available keywords | `lib/data/contacts.ts:268-302`           | `getContactKeywords()` with 30-day filter |
| Get available tags     | `lib/data/contacts.ts:250-262`           | `getContactTags()`                        |
| Cleanup cron           | `app/api/cron/cleanup-keywords/route.ts` | Removes stale keywords                    |

---

## 5. Summary: What to Build Against

**BUILD filters for:**

- `memberType` (enum)
- `tags[]` (string array - fetch via `getContactTags()`)
- `detectedKeywords[]` (JSON array - fetch via `getContactKeywords()`)
- `volunteer?.status` and `volunteer?.categories[]` (if targeting volunteers)
- `locationId` (multi-campus filtering)

**DO NOT build against:**

- Old relational models (small groups, serving teams are just string placeholders)
- `customFields` without a schema definition system (future enhancement)

---

## 6. MemberType Enum Values

```typescript
enum MemberType {
  VISITOR
  RETURNING
  MEMBER
  VOLUNTEER
  STAFF
}
```

## 7. Volunteer Category Enum Values

```typescript
const volunteerCategoryTypes = [
  "GENERAL",
  "GREETER",
  "USHER",
  "KIDS_MINISTRY",
  "WORSHIP_TEAM",
  "PARKING",
  "HOSPITALITY",
  "AV_TECH",
  "PRAYER_TEAM",
  "OTHER",
];
```

## 8. Volunteer Status Enum Values

```typescript
const volunteerStatuses = [
  "ACTIVE",
  "ON_BREAK",
  "INACTIVE",
  "PENDING_APPROVAL",
];
```
