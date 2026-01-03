# E2E Async Processing Tests - Implementation Guide

**For:** `e2e` worktree
**Branch:** Create from `main` after merging connect-card PR
**Priority:** Phase 3 of Connect Card Battle Testing
**Estimated Effort:** 2-3 hours

---

## Overview

This document guides implementation of E2E tests for the async card processing flow introduced in PR #90. The test file skeleton has been created in the connect-card worktree and should be copied to the e2e worktree.

---

## Phase 1: Setup (15 min)

### 1.1 Copy Test File

```bash
cd /home/digitaldesk/Desktop/church-connect-hub/e2e

# After connect-card PR is merged to main, sync:
git fetch origin && git merge origin/main

# Test file should now be at:
# tests/e2e/15-async-processing.spec.ts
```

### 1.2 Verify Fixtures Exist

```bash
ls -la tests/fixtures/
# Should have:
# - Connect-Card-Test-01.png
# - Connect-Card-Test-02.png
# - Connect-Card-Test-03.png
# - keyword-test-card.jpg
```

### 1.3 Run Existing Tests (Smoke Check)

```bash
pnpm test tests/e2e/15-async-processing.spec.ts --headed
```

---

## Phase 2: Create Two-Sided Card Fixtures (30-45 min)

### 2.1 Option A: Use Real Scanned Cards (Recommended)

1. Get a blank connect card from the church
2. Fill out FRONT with:

   - Name: "Test TwoSided"
   - Email: "twosided@test.com"
   - Phone: "555-123-4567"
   - Check "First Time Visitor"
   - Check interests: "Kids Ministry", "Small Groups"

3. Fill out BACK with:

   - Prayer request: "Please pray for my family's health and my job search"
   - Additional notes: "Interested in volunteering on Sundays"
   - Family: "Spouse: Jane, Kids: Tommy (5), Sarah (3)"

4. Scan/photograph both sides
5. Save as:
   ```
   tests/fixtures/two-sided-card-01-front.png
   tests/fixtures/two-sided-card-01-back.png
   ```

### 2.2 Option B: Create Digital Test Cards

Use any image editor to create filled-out card images:

- Minimum 800x600 pixels
- Use handwriting-style font or actual handwriting
- Include realistic field data

### 2.3 Image Quality Checklist

- [ ] Images are sharp and readable
- [ ] No excessive shadows or glare
- [ ] Text is legible at zoom
- [ ] File size < 5MB each
- [ ] PNG or JPG format

---

## Phase 3: Run and Validate Tests (1-2 hours)

### 3.1 Test Execution Order

Run tests in order of criticality:

```bash
# 1. Batch Processing (most important)
pnpm test -g "Process multiple cards in parallel" --headed

# 2. Duplicate Detection
pnpm test -g "Detect duplicate single-sided card" --headed
pnpm test -g "Different cards with same person allowed" --headed

# 3. Two-Sided Extraction (requires fixtures)
pnpm test -g "Extract data from front and back" --headed

# 4. Session Recovery
pnpm test -g "Resume processing after page refresh" --headed
```

### 3.2 Expected Results

| Test                        | Expected Outcome                    |
| --------------------------- | ----------------------------------- |
| Batch Processing            | 3 cards processed, batch created    |
| Duplicate Detection         | Second upload shows duplicate error |
| Same Person Different Cards | Both cards process successfully     |
| Two-Sided Extraction        | JSON contains front AND back data   |
| Session Recovery            | Resume prompt after refresh         |

### 3.3 Debugging Failed Tests

```bash
# Run with trace for debugging
pnpm test -g "test name" --trace on

# View trace
pnpm exec playwright show-trace test-results/*/trace.zip
```

---

## Phase 4: Fix Failing Tests (varies)

### Common Issues and Fixes

**Issue: Test times out waiting for extraction**

```typescript
// Increase timeout in test
test.setTimeout(300000); // 5 minutes
```

**Issue: Fixture not found**

```bash
# Check fixture path
ls -la tests/fixtures/
# Ensure filename matches exactly (case-sensitive)
```

**Issue: Duplicate detection not working**

- Verify connect-card worktree has the PENDING status fix
- Check that both front AND back hashes match for two-sided

**Issue: Session recovery prompt not visible**

- Processing may complete before refresh
- Try with slower network (DevTools throttling)

---

## Phase 5: Document Results (15 min)

### 5.1 Update Test Coverage

After all tests pass, update `tests/README.md` with any new findings.

### 5.2 Create PR

```bash
git add tests/
git commit -m "test(e2e): add async processing tests for connect cards

- Batch processing with parallel uploads
- Duplicate detection for single and two-sided cards
- Two-sided card extraction via dev test page
- Session recovery after page refresh
- Added two-sided card fixtures"

gh pr create --fill
```

---

## Test File Reference

The test file `tests/e2e/15-async-processing.spec.ts` contains:

```
test.describe("Async Card Processing")
├── test.describe("Batch Processing")
│   ├── Process multiple cards in parallel
│   └── Show progress indicator during extraction
├── test.describe("Duplicate Detection")
│   ├── Detect duplicate single-sided card
│   └── Different cards with same person allowed
├── test.describe("Two-Sided Card Extraction")
│   ├── Extract data from front and back images via dev test page
│   └── Handle single image on two-sided test page
├── test.describe("Session Recovery")
│   └── Resume processing after page refresh
└── test.describe("Error Handling")
    ├── Handle extraction timeout gracefully
    └── Retry failed card

test.describe("API Direct Tests")
└── Extract API handles two-sided card request
```

---

## Dependencies

- Merged PR from connect-card worktree with:
  - Async processing hook (`use-async-card-processor.ts`)
  - Timeout fix in extract API
  - Duplicate detection fix (PENDING status exclusion)
  - Two-sided duplicate detection fix

---

## Questions?

If tests fail unexpectedly:

1. Check connect-card PR is fully merged
2. Verify database is seeded (`pnpm seed`)
3. Ensure ANTHROPIC_API_KEY is set
4. Check dev server is running on correct port
