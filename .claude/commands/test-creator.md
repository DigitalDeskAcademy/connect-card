# Test Creator Command

**Purpose:** Create industry-standard Playwright E2E tests by analyzing actual UI implementation, not assumptions.

**Critical principle:** ALWAYS read the actual component code BEFORE writing tests. Never assume UI structure.

---

## Command Usage

```bash
/test-creator [feature-name]
```

**Examples:**

```bash
/test-creator connect-card-upload
/test-creator member-management
/test-creator team-permissions
```

---

## What This Command Does

**Phase 1: Discovery & Analysis**

1. Ask user which feature/component to test
2. Read the actual UI implementation files
3. Map out the REAL navigation flow (tabs, buttons, links)
4. Identify actual selectors (text, roles, test IDs)
5. Document user journey steps

**Phase 2: Test Structure Planning**

1. Determine test categories:
   - Happy path workflows
   - Edge cases
   - Error handling
   - Security scenarios
2. Identify required test data
3. Map authentication requirements
4. Document expected outcomes

**Phase 3: Implementation**

**⚠️ MANDATORY PRE-WRITE CHECKLIST FOR EVERY TEST ASSERTION:**

Before writing ANY `page.click()`, `page.locator()`, or `page.getByRole()`:

1. ✅ **Grep verification**: Run grep to find the text in the component file
2. ✅ **Read context**: Use Read tool to view the surrounding 10-20 lines
3. ✅ **Identify element type**: Is it Button, Link, Button asChild, Input, etc.?
4. ✅ **Choose correct selector**: Match the actual rendered element type
5. ✅ **Document in comment**: Add comment above test showing which file/line you verified

**Then proceed with:**

1. Create test file in `/tests/e2e/`
2. Write tests matching REAL UI flow
3. Use VERIFIED selectors from actual code
4. Include descriptive test names
5. Add helpful console.log statements
6. Handle async operations properly

**Example of proper verification workflow:**

```typescript
// Before writing this test assertion:
await page.click('button:has-text("Review Cards")');

// You MUST do this first:
// 1. grep -n "Review Cards" app/church/[slug]/admin/connect-cards/batches/batches-client.tsx
// 2. Read lines 205-217 to see the actual code
// 3. See: <Button asChild><Link>Review Cards</Link></Button>
// 4. Conclusion: It's an <a> tag, NOT a button

// Correct test with verification comment:
// Verified in batches-client.tsx:205-217 - <Button asChild><Link>
await page.click('a:has-text("Review Cards")');
```

**Phase 4: Verification**

1. Run tests to verify they work
2. Check for flaky selectors
3. Ensure proper timeouts
4. Validate test isolation
5. Verify cleanup between tests

---

## Critical Rules

### ❌ NEVER Assume UI Structure

**Wrong Approach:**

```typescript
// Assuming there's a "Review Queue" tab
await page.click('text="Review Queue"');
```

**Right Approach:**

```typescript
// First, read the actual component
// See that tabs are: Upload | Batches | Analytics
// Review happens INSIDE batches
await page.click('text="Batches"');
await page.click('a[href*="/batches/"]').first();
// Now we're in the review interface
```

### ✅ ALWAYS Read Implementation First

**Required reading before writing tests:**

1. Page component (`page.tsx`)
2. Client component (`client.tsx`)
3. Related server actions
4. Navigation config (`/lib/navigation.ts`)
5. Form components
6. Tab structures

### 🔍 MANDATORY: Verify Every Selector Before Writing Test

**For EVERY button/link/element in your test, you MUST:**

1. **Grep the component file** to confirm the selector exists:

   ```bash
   # Example: Before writing page.click('button:has-text("Review Cards")')
   grep -n "Review Cards" app/church/[slug]/admin/connect-cards/batches/batches-client.tsx
   ```

2. **Read the surrounding code** to confirm element type:

   ```bash
   # Use Read tool to see lines 200-220 where "Review Cards" appears
   # Check if it's <Button>, <Link>, <Button asChild><Link>, etc.
   ```

3. **Choose correct selector**:
   - `<Button onClick={...}>` → `button:has-text("...")`
   - `<Link href={...}>` → `a:has-text("...")`
   - `<Button asChild><Link>` → `a:has-text("...")` (renders as `<a>`)
   - `<input id="name">` → `input#name`

**NEVER assume the element type. ALWAYS verify the actual implementation.**

### 🎯 Map Real User Flow

**Process:**

1. Start at entry point (e.g., `/church/[slug]/admin/connect-cards`)
2. Document each click/interaction needed
3. Note actual text on buttons/tabs
4. Identify loading states
5. Map success/error states

---

## Test Structure Template

```typescript
import { test, expect } from "@playwright/test";
import { loginWithOTP, TEST_USERS } from "../helpers/auth";
import path from "path";

/**
 * [Feature Name] E2E Tests
 *
 * Tests complete workflow: [describe workflow]
 *
 * Test coverage:
 * - Happy path: [describe]
 * - Edge cases: [list]
 * - Error handling: [list]
 * - Security: [list]
 */

test.describe("[Feature Name] - Main Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithOTP(page, TEST_USERS.churchOwner.email);
    await page.goto("[starting-url]");
  });

  test("SUCCESS: [describe happy path]", async ({ page }) => {
    // Step 1: [action]
    // Log progress
    console.log("Step 1: [what's happening]");

    // Perform action
    await page.click("[actual-selector-from-code]");

    // Verify outcome
    await expect(page.locator("[expected-element]")).toBeVisible();

    // Step 2: [next action]
    // ... continue
  });

  test("EDGE: [describe edge case]", async ({ page }) => {
    // Test edge case scenario
  });

  test("ERROR: [describe error scenario]", async ({ page }) => {
    // Test error handling
  });
});
```

---

## Common Gotchas - shadcn/ui Patterns

### ⚠️ Button asChild Pattern

**The shadcn `<Button asChild>` pattern is a common source of test failures.**

When you see this code:

```tsx
<Button asChild size="sm">
  <Link href="/path">Click Me</Link>
</Button>
```

**It renders as:**

```html
<a href="/path" class="button-styles">Click Me</a>
```

**Your test selector MUST be:**

```typescript
// ❌ WRONG - This will never find the element!
await page.click('button:has-text("Click Me")');

// ✅ CORRECT - It's an <a> tag, not <button>
await page.click('a:has-text("Click Me")');
```

**How to identify this pattern:**

1. Grep for the button text: `grep -n "Click Me" component.tsx`
2. Read the surrounding code - look for `asChild` prop
3. If you see `<Button asChild><Link>`, use `a:has-text(...)`
4. If you see `<Button onClick={...}>`, use `button:has-text(...)`

**Real example from our codebase:**

```tsx
// batches-client.tsx line 205-216
<Button asChild size="sm">
  <Link href={`/church/${slug}/admin/connect-cards/review/${batch.id}`}>
    Review Cards
  </Link>
</Button>;

// Test MUST use:
page.locator('a:has-text("Review Cards")'); // ✅
// NOT:
page.locator('button:has-text("Review Cards")'); // ❌
```

---

## Selector Best Practices

### Priority Order (Most → Least Reliable)

1. **Test IDs** (most reliable)

   ```typescript
   page.locator('[data-testid="submit-button"]');
   ```

2. **Role + Name** (accessible, semantic)

   ```typescript
   page.getByRole("button", { name: "Save" });
   page.getByRole("tab", { name: "Upload" });
   ```

3. **Text content** (readable, but can break with copy changes)

   ```typescript
   page.locator('text="Review Queue"');
   ```

4. **CSS selectors** (last resort)
   ```typescript
   page.locator("button.submit-btn");
   ```

### Handling Multiple Matches

**Problem:** `strict mode violation: resolved to 2 elements`

**Solution:** Be specific

```typescript
// Bad
page.locator('input[type="file"]'); // Finds 2 inputs

// Good
page.locator('input[type="file"]').first(); // Desktop upload
page.locator('input[type="file"][capture]'); // Camera upload
```

---

## Test Data Management

### Using Test Images

```typescript
const testImage = path.join(
  __dirname,
  "../../public/connect-card-examples/Connect-Card-Test-01.png"
);
```

### Multiple Test Files

```typescript
const testCards = [
  "Connect-Card-Test-01.png",
  "Connect-Card-Test-02.png",
  "Connect-Card-Test-03.png",
].map(card => path.join(__dirname, "../../public/connect-card-examples", card));

await fileInput.setInputFiles(testCards);
```

### Cleanup Between Tests

```typescript
test.beforeEach(async ({ page }) => {
  // Clear database if needed
  await clearTestData();

  // Fresh authentication
  await loginWithOTP(page, TEST_USERS.churchOwner.email);
});
```

---

## Async Handling

### Network Requests

```typescript
// Wait for API call to complete
await page.waitForResponse(
  resp => resp.url().includes("/api/connect-cards") && resp.status() === 200
);
```

### Loading States

```typescript
// Wait for loading to finish
await expect(page.locator('text="Loading..."')).not.toBeVisible();
await expect(page.locator('text="Success"')).toBeVisible();
```

### Navigation

```typescript
// Wait for navigation to complete
await page.goto(url);
await page.waitForLoadState("networkidle");
```

---

## Debugging Failed Tests

### Screenshots

Playwright automatically captures screenshots on failure:

```
test-results/[test-name]/test-failed-1.png
```

### Videos

Videos saved on failure:

```
test-results/[test-name]/video.webm
```

### HTML Report

View interactive report:

```bash
npx playwright show-report
```

### Console Logs

Add debug output:

```typescript
console.log("✅ Step 1: Cards uploaded");
console.log("Current URL:", page.url());
const text = await page.textContent("body");
console.log("Page text:", text);
```

---

## Common Patterns

### Authentication Flow

```typescript
// Uses existing helper
await loginWithOTP(page, TEST_USERS.churchOwner.email);
```

### Form Submission

```typescript
// Fill form
await page.fill("input#name", "John Doe");
await page.fill("input#email", "john@example.com");

// Submit
await page.click('button[type="submit"]');

// Wait for success
await expect(page.locator('text="Saved"')).toBeVisible();
```

### Tab Navigation

```typescript
// Click tab (Radix UI pattern)
await page.click('button[role="tab"]:has-text("Upload")');

// Wait for tab content
await expect(page.locator('[role="tabpanel"]')).toBeVisible();
```

### File Upload

```typescript
const fileInput = page.locator('input[type="file"]').first();
await fileInput.setInputFiles(testFilePath);

// Wait for preview
await expect(page.locator('img[alt*="preview"]')).toBeVisible();
```

---

## Workflow Example

**Creating tests for Connect Card Upload:**

**Step 1: Read Implementation**

```bash
# Read actual components
cat app/church/[slug]/admin/connect-cards/client.tsx
cat app/church/[slug]/admin/connect-cards/upload/upload-client.tsx
cat app/church/[slug]/admin/connect-cards/batches/batches-client.tsx
```

**Step 2: Map Flow**

```
1. Navigate to /church/newlife/admin/connect-cards
2. Default tab: "Upload" (not "Review Queue" - that was wrong!)
3. Three tabs: Upload | Batches | Analytics
4. Upload flow:
   - Select files via input[type="file"].first()
   - Click "Process All Cards" button
   - Wait for success message
5. Review flow:
   - Click "Batches" tab
   - Click on a batch link
   - Now in review interface
   - Use "Save & Next" button
```

**Step 3: Write Tests**

```typescript
test("Upload 3 cards", async ({ page }) => {
  // Use actual selectors from code
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(cardPaths);

  const processButton = page.locator('button:has-text("Process")');
  await processButton.click();

  await expect(page.locator("text=/success|saved/i")).toBeVisible({
    timeout: 60000, // AI processing takes time
  });
});

test("Navigate to review", async ({ page }) => {
  // Upload first
  // ...

  // Navigate to batches (actual tab name)
  await page.click('button[role="tab"]:has-text("Batches")');

  // Click first batch
  const batchLink = page.locator('a[href*="/batches/"]').first();
  await batchLink.click();

  // Now we're in review interface
  await expect(page.locator('text="Review"')).toBeVisible();
});
```

---

## Quality Checklist

Before marking tests complete:

- [ ] Tests match ACTUAL UI flow (not assumptions)
- [ ] Selectors come from real component code
- [ ] Proper timeouts for async operations
- [ ] Tests run independently (no shared state)
- [ ] Cleanup between tests
- [ ] Descriptive test names
- [ ] Console logs for debugging
- [ ] Error cases covered
- [ ] Edge cases covered
- [ ] Screenshots/videos on failure
- [ ] Tests pass consistently

---

## When to Use This Command

**Use `/test-creator` when:**

- Creating new E2E tests
- Feature complete and needs test coverage
- Existing tests are failing due to UI changes
- Need to verify workflow end-to-end
- Adding critical user paths
- Security-sensitive features

**Don't use for:**

- Unit tests (use regular test files)
- Simple functions (use regular Jest)
- Component tests in isolation

---

## Output

Command produces:

1. Test file in `/tests/e2e/[feature-name].spec.ts`
2. Test data if needed (images, JSON, etc.)
3. Helper functions if needed
4. Documentation of test coverage
5. Instructions for running tests

---

## Example Session

```bash
User: /test-creator connect-card-upload

AI: I'll create E2E tests for connect card upload. Let me first analyze the actual UI implementation.

[Reads components]
- app/church/[slug]/admin/connect-cards/client.tsx
- app/church/[slug]/admin/connect-cards/upload/upload-client.tsx

I found:
- Tabs: Upload | Batches | Analytics (NOT "Review Queue")
- Upload has 2 file inputs (desktop + camera)
- Process button: "Process All Cards"
- Success state: Shows stats dashboard

[Creates test file]
Created: tests/e2e/08-connect-card-upload.spec.ts

Test coverage:
✅ Upload single card
✅ Upload multiple cards
✅ Navigate to batches
✅ Review workflow
✅ Edge: Empty upload
✅ Edge: Duplicate detection

Ready to run: npx playwright test tests/e2e/08-connect-card-upload.spec.ts
```

---

## Best Practices Summary

1. **Read code first, write tests second**
2. **Use actual selectors from implementation**
3. **Map real user flow, not assumed flow**
4. **Handle async properly (timeouts, waits)**
5. **Clean up between tests**
6. **Add debug logs**
7. **Test both happy and sad paths**
8. **Verify tests run consistently**

---

**Remember:** The best tests are ones that match reality. Always read the implementation before writing a single line of test code.
