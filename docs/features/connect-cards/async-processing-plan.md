# Async Card Processing Implementation Plan

**Feature:** Parallel card processing during scanning
**Status:** 🟡 Phase 4 Complete - Ready for Testing & PR
**Created:** 2025-12-22
**Branch:** `feature/connect-card`

---

## Terminology

| Term               | Path                                       | Description                          |
| ------------------ | ------------------------------------------ | ------------------------------------ |
| **Dashboard scan** | `/church/[slug]/admin/connect-cards/scan/` | Logged-in staff scanning via web app |
| **QR/Mobile scan** | `/church/[slug]/scan/`                     | Phone scanning via QR code token     |

> **Tech Debt Note:** The `admin/` folder is misleadingly named - any staff member can access it, not just admins. It should be renamed to `dashboard/`. This refactor is tracked for the `e2e` worktree to handle alongside test updates.

---

## Problem Statement

When staff scan 25-50 connect cards, they currently wait for the entire batch to process sequentially (~3-5 seconds per card = 2-3 minutes total). Cards only appear in the review queue after all processing completes.

**Goal:** Process cards in parallel so earlier cards appear in the review queue while later ones are still being scanned. Target: 50 cards in < 2 minutes, first card in queue within 10 seconds.

---

## Architecture Overview

```
Current Flow (Sequential):
Capture → Wait → Capture → Wait → ... → ALL cards upload → ALL extract → Review Queue

New Flow (Parallel):
Capture ──► Upload ──► Create PENDING ──► Extract ──► Update to EXTRACTED
Capture ──► Upload ──► Create PENDING ──► Extract ──► Update to EXTRACTED
Capture ──► Upload ──► Create PENDING ──► Extract ──► Update to EXTRACTED
   │           │              │               │              │
   └── User continues scanning while earlier cards process ──┘
```

**Key Insight:** Split `saveConnectCard` into two actions:

1. `createPendingCard` - Lightweight placeholder immediately after S3 upload
2. `updateCardExtraction` - Updates card with extracted data after Claude completes

---

## Files to Create

| File                                             | Purpose                                        |
| ------------------------------------------------ | ---------------------------------------------- |
| `hooks/use-async-card-processor.ts`              | Core processing engine with parallel pipelines |
| `actions/connect-card/create-pending-card.ts`    | Create PENDING card after S3 upload            |
| `actions/connect-card/update-card-extraction.ts` | Update card with extracted data                |

## Files to Modify

| File                                                                | Changes                            |
| ------------------------------------------------------------------- | ---------------------------------- |
| `app/church/[slug]/admin/connect-cards/scan/scan-wizard-client.tsx` | Replace sequential with async hook |
| `app/church/[slug]/scan/scan-wizard-client.tsx`                     | Same changes for phone flow        |

---

## Concurrency & Rate Limits

| Stage          | Concurrent | Rate Limit | Duration |
| -------------- | ---------- | ---------- | -------- |
| S3 Upload      | 5          | 100/min    | ~1-2s    |
| Create Pending | 5          | 60/min     | <1s      |
| Claude Extract | 3          | 60/min     | ~3-5s    |
| Update Card    | 3          | 30/min     | <1s      |

**Throughput:** ~15-20 cards/minute (vs ~12/min sequential)

---

## UI Design: Compact Stats (Non-Intrusive Progress)

**Problem:** A scrollable queue list distracts from scanning. Users need progress feedback without losing focus on the camera.

**Solution:** Compact inline stats with expandable detail drawer.

```
┌────────────────────────────────────────┐
│  ← Back   Card #12   ✓8 🔄3 ❌1  Done  │  ← Compact stats inline
├────────────────────────────────────────┤
│                                        │
│           CAMERA VIEWFINDER            │
│                                        │
│                                        │
├────────────────────────────────────────┤
│        [Capture Button]  [Switch]      │
└────────────────────────────────────────┘
```

**Stats Component:**

- `✓5` - Complete (green)
- `🔄3` - Processing (blue, pulse animation while active)
- `❌1` - Failed (red, only shows if > 0)

**Interactions:**

1. **Tap stats** → Drawer slides up with full queue details
2. **Failure toast** → "Card #7 failed" with retry action (only on failure)
3. **All complete** → Stats turn green, "Done" button pulses

**Drawer Content (when expanded):**

```
┌────────────────────────────────────────┐
│  Processing Queue              [Close] │
├────────────────────────────────────────┤
│  ✓ Card #1   Complete                  │
│  ✓ Card #2   Complete                  │
│  🔄 Card #3  Extracting...             │
│  🔄 Card #4  Uploading...              │
│  ❌ Card #5  Failed - Retry | Remove   │
│  ⏳ Card #6  Queued                    │
└────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Server Actions ✅ COMPLETE

**Goal:** Create the split save pattern

**Tasks:**

- [x] Create `actions/connect-card/create-pending-card.ts`

  - Auth: Better Auth session OR scan session cookie
  - Rate limit: 60/min (Arcjet)
  - Call `getOrCreateActiveBatch()` to get/create batch
  - Create card with `status: 'PENDING'`, all extracted fields null
  - Return `{ cardId, batchId, batchName }`

- [x] Create `actions/connect-card/update-card-extraction.ts`

  - Auth: Better Auth session OR scan session cookie
  - Rate limit: 30/min (Arcjet)
  - Verify card belongs to user's organization
  - Apply normalization (visit status, interests, keywords) from existing `save-connect-card.ts`
  - Update card with extracted data, set `status: 'EXTRACTED'`

- [x] Extract normalization functions to shared utility (`lib/utils/connect-card-normalization.ts`)
- [x] Update `save-connect-card.ts` to use shared normalization functions
- [x] TypeScript check passes

---

### Phase 2: Async Processor Hook ✅ COMPLETE

**Goal:** Create the core processing engine

**Tasks:**

- [x] Create `hooks/use-async-card-processor.ts` with full implementation

  ```typescript
  interface ProcessingItem {
    id: string;
    frontImage: CapturedImage;
    backImage: CapturedImage | null;
    status:
      | "queued"
      | "uploading"
      | "creating"
      | "extracting"
      | "complete"
      | "failed"
      | "duplicate";
    progress: number;
    cardId?: string;
    batchId?: string;
    batchName?: string;
    error?: string;
    retryCount: number;
  }

  function useAsyncCardProcessor(options) {
    return {
      addCard,
      retryCard,
      removeCard,
      items,
      stats,
      isProcessing,
      hasFailures,
      batchInfo,
      reset,
      hasPendingSession,
      resumeSession,
      discardSession,
    };
  }
  ```

- [x] Implement upload pipeline

  - Semaphore class for concurrency control (5 concurrent uploads)
  - Get presigned URL → Upload front → Upload back (if exists)
  - Calculate SHA-256 hashes during upload
  - Update item status: 'queued' → 'uploading' → 'creating'

- [x] Implement create-pending step

  - Call `createPendingCard` action after upload completes
  - Store `cardId`, `batchId`, `batchName` in item
  - Update status: 'creating' → 'extracting'

- [x] Implement extraction pipeline

  - Semaphore with 3 concurrent extractions
  - Call `/api/connect-cards/extract` with image data
  - Handle duplicate detection (409 → 'duplicate' status)
  - Call `updateCardExtraction` with extracted data
  - Update status: 'extracting' → 'complete' or 'failed'

- [x] Add sessionStorage persistence

  - Save queue state on each update
  - `hasPendingSession` flag on mount
  - `resumeSession()` / `discardSession()` methods
  - Graceful handling of lost blob data (mark as failed)

- [x] Add retry logic
  - Max 3 retries per stage (configurable)
  - Exponential backoff (2s, 4s, 8s)
  - Mark as 'failed' after max retries
  - `onFailure` callback for toast notifications

---

### Phase 3: Dashboard Scan Integration ✅ COMPLETE

**Goal:** Replace sequential processing with async processor + compact stats UI

**Tasks:**

- [x] Integrate `useAsyncCardProcessor` hook

  - Replace `processQueueItem()` with hook
  - Replace `processingRef` lock with hook's built-in concurrency
  - Call `processor.addCard()` on capture complete

- [x] Create compact stats header component

  - Inline stats: `✓8 🔄3 ❌1` with color coding
  - Pulse animation on processing count while active
  - Tap to expand drawer (see UI Design section)

- [x] Create queue drawer component

  - Slides up from bottom when stats tapped
  - Shows all cards with status icons
  - Retry/Remove buttons for failed cards
  - Close button returns to camera

- [x] Add failure toast notifications

  - Toast appears only on failure: "Card #7 failed"
  - Toast action button: "Retry" or "View"
  - Auto-dismiss after 5 seconds

- [x] Add session recovery

  - Check sessionStorage on mount
  - If incomplete session found, show "Resume?" dialog
  - Resume processing or start fresh

- [ ] Test with 25+ cards
  - Verify cards appear in review queue as they complete
  - Test page refresh recovery
  - Test error handling (disconnect network mid-upload)

**Files Created (shared components):**

- `components/dashboard/connect-cards/scan/processing-stats.tsx` - Compact stats display
- `components/dashboard/connect-cards/scan/queue-drawer.tsx` - Expandable drawer
- `components/dashboard/connect-cards/scan/session-recovery-dialog.tsx` - Resume dialog
- `components/dashboard/connect-cards/scan/token-expired-error.tsx` - Token expiration error
- `components/dashboard/connect-cards/scan/index.ts` - Barrel export

**Files Modified:**

- `app/church/[slug]/admin/connect-cards/scan/scan-wizard-client.tsx` - Full rewrite with async hook

---

### Phase 4: QR/Mobile Scan Integration ✅ COMPLETE

**Goal:** Same improvements for QR code mobile flow

**Tasks:**

- [x] Integrate `useAsyncCardProcessor` into QR scan `scan-wizard-client.tsx`

  - Same pattern as dashboard integration
  - Cards process as captured (not on "Done" click)
  - Changed from dataURL strings to CapturedImage (blob + dataUrl)
  - Preserved mobile-specific features (fullscreen, iOS, landscape)

- [x] Use shared UI components from `/components/dashboard/connect-cards/scan/`

  - Components use CSS variables for theming (works in any context)
  - No duplicate "dark-themed" components needed

- [ ] Test mobile flow
  - Verify works with scan session cookie auth
  - Test camera capture → immediate processing

**Files Modified:**

- `app/church/[slug]/scan/scan-wizard-client.tsx` - Full rewrite with async hook
- `app/church/[slug]/scan/page.tsx` - Updated imports to shared location

**Key Changes:**

- Replaced `useConnectCardUpload` with `useAsyncCardProcessor`
- Changed from batch submit to real-time processing
- Store both blob (for upload) and dataUrl (for preview) in CapturedImage
- Removed "submitting" step since cards process immediately

---

### Phase 5: Polish & PR

**Goal:** Final testing, documentation, PR creation

**Tasks:**

- [ ] Performance testing

  - 50 cards < 2 minutes target
  - First card in queue < 10 seconds

- [ ] Edge case testing

  - Duplicate detection mid-batch
  - Rate limit hit (should queue and retry)
  - Network disconnect/reconnect

- [ ] Update WORKTREE-STATUS.md

  - Mark async processing as complete
  - Note performance improvements

- [ ] Create PR with:
  - Summary of changes
  - Performance comparison (before/after)
  - Testing instructions

---

## Error Handling

| Error                | Action                                  |
| -------------------- | --------------------------------------- |
| S3 upload fails      | Retry 3x with backoff, then mark failed |
| Create pending fails | Retry 3x, then mark failed              |
| Extraction fails     | Mark failed, allow manual retry         |
| Duplicate detected   | Mark as duplicate, show existing card   |
| Rate limited         | Queue and retry after delay             |

**Failed Card UI:**

```
┌────────────────────────────────────────┐
│ Card #7                        [FAILED]│
│ "Extraction failed: API error"         │
│ [Retry]  [Skip]  [Remove]              │
└────────────────────────────────────────┘
```

---

## Success Criteria

- [ ] 50 cards complete in < 2 minutes
- [ ] First card appears in review queue within 10 seconds
- [ ] Page refresh doesn't lose in-progress cards
- [ ] Failed cards can be retried or skipped
- [ ] Works for both dashboard and QR/mobile scan flows

---

## Reference Files

**Patterns to follow:**

- `hooks/use-connect-card-upload.ts` - Existing upload patterns
- `actions/connect-card/save-connect-card.ts` - Normalization logic to reuse
- `lib/data/connect-card-batch.ts` - Batch creation with serializable transaction
- `app/api/connect-cards/extract/route.ts` - Claude Vision extraction API

**Starting command:**

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/connect-card
pnpm dev  # Port 3001
```
