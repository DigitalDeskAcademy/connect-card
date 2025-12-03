# ChMS Integration - Feature Vision

**Status:** In Development
**Worktree:** `feature/integrations`
**Last Updated:** 2025-11-29

---

## Core Purpose

**We are NOT a ChMS.** We help churches speed up the manual data entry process of getting visitor data INTO their existing Church Management Software (Planning Center, Breeze, etc.).

```
┌─────────────────────────────────────────────────────────────────────┐
│                      THE PROBLEM WE SOLVE                           │
│                                                                     │
│   Sunday: Visitors fill out connect cards                           │
│   Monday: Staff scans cards into our system (fast, AI-assisted)     │
│   Monday: Staff MANUALLY re-types same data into their ChMS (slow)  │
│                                                                     │
│   We eliminate the "manually re-types" step with smart CSV exports  │
│   formatted exactly how their ChMS expects the data.                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Mental Model: Sync Status

The critical question for every record is: **What needs to happen in their ChMS?**

### Three Sync States

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. NEW TO ChMS                                                      │
│     Person doesn't exist in their ChMS yet                          │
│     → Export as "Add New Person"                                    │
│     → Staff imports into ChMS People section                        │
├─────────────────────────────────────────────────────────────────────┤
│  2. UPDATE EXISTING                                                  │
│     Person already in ChMS but has new data                         │
│     → Wants to volunteer (new interest)                             │
│     → Updated contact info                                          │
│     → New prayer request                                            │
│     → Export with flag: "Update Existing"                           │
├─────────────────────────────────────────────────────────────────────┤
│  3. ALREADY SYNCED                                                   │
│     Person exported before, no new data                             │
│     → Skip by default (don't re-export)                             │
│     → Option to include in "All Records" export                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Simplified Data Model

### On ConnectCard (What We Have)

```prisma
model ConnectCard {
  // ... existing fields ...

  // Export tracking
  lastExportedAt    DateTime?   // When this card was last exported
  lastExportedBy    String?     // Who exported it
  lastExportFormat  String?     // "PLANNING_CENTER_CSV", "BREEZE_CSV", etc.

  // ChMS sync status (future enhancement)
  chmsStatus        ChMSStatus? // NEW, SYNCED, NEEDS_UPDATE
  chmsExternalId    String?     // Their ID in the external ChMS (if known)
}

enum ChMSStatus {
  NEW           // Not yet in their ChMS
  SYNCED        // Exported and assumed added to ChMS
  NEEDS_UPDATE  // Has new data since last export (volunteer interest, etc.)
}
```

### Export History (What We Have)

```prisma
model DataExport {
  id             String           @id
  organizationId String
  format         DataExportFormat
  filters        Json?            // { locationId, dateRange, onlyNew }
  recordCount    Int
  fileName       String
  fileKey        String           // S3 storage
  fileSizeBytes  Int?
  exportedBy     String
  exportedAt     DateTime
}
```

---

## Export Settings (Sync-Focused)

### Key Insight: Sync Status, Not Dates

Staff don't think "I want to export data from Jan 5 to Jan 12."
They think "What needs to go to my ChMS?"

**Mental model:** "What's new since my last sync?"

### Settings (Phase 1 - Complete)

| Setting                           | Why It Matters                                                     |
| --------------------------------- | ------------------------------------------------------------------ |
| **Format**                        | Planning Center, Breeze, Generic - each has different column names |
| **Location**                      | Multi-site churches can filter per campus                          |
| **Auto-filter: Not Yet Exported** | Always shows only unsynced records - no toggle needed              |
| **Auto-dedupe by Email**          | Keeps most recent card per email, prevents duplicates              |

### Future Settings (Phase 2+)

| Setting                    | Why It Matters                       |
| -------------------------- | ------------------------------------ |
| **Include/Exclude Fields** | Some ChMS have limited import fields |
| **Scheduled Exports**      | Auto-email weekly CSV to admin       |

---

## What We DON'T Track (And Why)

| Not Tracking                | Reason                                |
| --------------------------- | ------------------------------------- |
| Actual ChMS person ID       | We don't have API access to verify    |
| Whether import succeeded    | Staff responsibility in their ChMS    |
| Duplicate detection in ChMS | Their ChMS handles this               |
| Background check results    | Liability - churches track separately |
| Giving/financial data       | Never touches connect cards           |

**Philosophy:** We're a bridge, not a replacement. We make the export easy; they handle the import.

---

## Export Flow (Sync-Focused)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Export to ChMS                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────┬─────────────────────────┐              │
│  │  LAST SYNCED            │  READY TO SYNC          │              │
│  │  3 days ago             │  12                     │              │
│  │  Nov 26, 2:45 PM        │  new visitors           │              │
│  └─────────────────────────┴─────────────────────────┘              │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  FORMAT: [Planning Center ▼]     LOCATION: [All Locations ▼]       │
│                                                                      │
│  [12 records ready]  [2 duplicates merged]                          │
│                                                                      │
│  ℹ️ Planning Center matches by email - duplicates auto-merge         │
│                                                                      │
│  PREVIEW                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ First Name │ Last Name │ Email           │ Phone      │ ...    ││
│  │ John       │ Smith     │ john@email.com  │ 555-1234   │         ││
│  │ Sarah      │ Jones     │ sarah@email.com │ 555-5678   │         ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│                                            [Download CSV]            │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  ✓ All caught up! (when no records to export)                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Future: API Integration (Phase 2+)

When we add direct API sync to Planning Center/Breeze:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Instead of:                                                         │
│  1. Download CSV                                                     │
│  2. Open Planning Center                                             │
│  3. Navigate to People → Import                                      │
│  4. Upload CSV                                                       │
│  5. Map columns                                                      │
│  6. Confirm import                                                   │
│                                                                      │
│  With API:                                                           │
│  1. Click "Sync to Planning Center"                                  │
│  Done.                                                               │
└─────────────────────────────────────────────────────────────────────┘
```

But CSV export remains the universal fallback for churches using any ChMS.

---

## Success Metrics

| Metric               | Target                               |
| -------------------- | ------------------------------------ |
| Time to export       | < 5 seconds                          |
| Clicks to download   | 3 or fewer                           |
| Format accuracy      | 100% (passes ChMS import validation) |
| Duplicate prevention | 95%+ (via "not yet exported" filter) |

---

## Implementation Status

### ✅ Phase 1 Complete

- [x] Export page with format selection (Planning Center, Breeze, Generic)
- [x] Location filter (multi-campus support)
- [x] Auto-filter to unsynced records only
- [x] Email deduplication (keeps most recent per email)
- [x] Preview with full data table
- [x] Download CSV to S3
- [x] Export history (re-download past exports)
- [x] NavTabs pattern (Export/History)
- [x] Sync status summary card ("Last Synced" + "Ready to Sync" count)
- [x] ChMS-specific guidance (Planning Center, Breeze tips)
- [x] "All caught up" state when no records pending
- [x] Badge styling for status counts

### 📋 Phase 2 Planned

- [ ] Field selection (include/exclude columns)
- [ ] Planning Center API integration (direct sync)

### 📋 Phase 3 Future

- [ ] Breeze API integration
- [ ] Scheduled exports (auto-email weekly CSV)
- [ ] Export templates (save filter presets)

---

## Related Documents

- [Church Software Sync Spec](./church-software-sync-spec.md) - Detailed technical specification
- [Connect Cards Vision](../connect-cards/vision.md) - Source data for exports
