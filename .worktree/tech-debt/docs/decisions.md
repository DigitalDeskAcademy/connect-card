# Tech-Debt - Design Decisions

**Purpose:** Document decisions made during security fixes

---

## Decision 1: Database Sharing (Tech-Debt Worktree)

**Context:** Most worktrees have isolated databases (prayer, volunteer), but tech-debt is different

**Options Considered:**

1. **Create isolated database** - Consistent with other worktrees

   - Pros: Full isolation, safer for testing
   - Cons: Extra setup time, no real benefit for bug fixes

2. **Share main database** - Use same database for bug fixes
   - Pros: Faster setup, no schema changes expected, test against real data
   - Cons: Shared state (low risk for read-only fixes)

**Decision:** Share main database (Option 2)

**Reasoning:**

- Tech-debt worktree is for **bug fixes only**, not feature additions
- No schema changes expected (no new tables/columns)
- Faster iteration on security fixes
- Low risk of data conflicts (fixes are read-heavy, not write-heavy)
- If we need schema changes, we'll create a new feature worktree

---

## Decision 2: Remove All Console Statements vs Sanitized Logging

**Context:** CRITICAL-002 found 13 files logging PII to production

**Options Considered:**

1. **Remove all console statements** (CLAUDE.md directive)

   - Pros: Simple, clear policy, GDPR compliant
   - Cons: No production debugging (mitigated by error tracking)

2. **Sanitized logging** (log metadata only, no PII)

   - Pros: Some production visibility
   - Cons: Risk of accidental PII leakage, maintenance burden

3. **Development-only logging** (NODE_ENV check)
   - Pros: Debugging in dev, clean in prod
   - Cons: Easy to forget checks, NODE_ENV misconfiguration risk

**Decision:** Remove all console statements (Option 1)

**Reasoning:**

- Aligns with CLAUDE.md directive: "NO console.log"
- GDPR compliance (no PII in third-party logs)
- Production error tracking via Sentry/Arcjet (structured logging)
- Simpler to audit (zero console statements = compliant)

---

## Decision 3: Generic Error Messages (HIGH-001, HIGH-002)

**Context:** Error messages currently expose validation details and permission structure

**Options Considered:**

1. **Specific error messages** (current state)

   - Pros: Developer-friendly, easier debugging
   - Cons: Information disclosure, schema enumeration risk

2. **Generic error messages** (coding-patterns.md standard)
   - Pros: Security best practice, no data leakage
   - Cons: Harder client-side debugging (mitigated by E2E tests)

**Decision:** Generic error messages (Option 2)

**Reasoning:**

- Follows coding-patterns.md: "Generic error messages - Don't expose validation details"
- Industry standard for production APIs
- Error details available in server logs (not client)
- Client-side validation provides user-friendly messages

**Standardized Messages:**

- Validation errors: "Invalid form data"
- Permission errors: "You don't have permission to perform this action"
- Not found errors: "Resource not found"

---

## Decision 4: Fix Strategy (All Fixes in One PR vs Separate PRs)

**Context:** 4 CRITICAL + 2 HIGH severity issues found

**Options Considered:**

1. **Single PR** - All security fixes together

   - Pros: Faster merge, related changes grouped
   - Cons: Large PR, harder to review

2. **Separate PRs** - One PR per CRITICAL issue
   - Pros: Easier review, granular commits
   - Cons: Slower merge, potential conflicts

**Decision:** Single PR with organized commits (Option 1)

**Reasoning:**

- All fixes are related (multi-tenant security theme)
- Faster deployment to production
- Easier to track in changelog
- Commits organized by severity (CRITICAL → HIGH)

**Commit Structure:**

```
fix(security): add organizationId to remove-member WHERE clause (CRITICAL-001)
fix(security): remove PII logging from 13 files (CRITICAL-002)
fix(security): use auth context for volunteer organizationId (CRITICAL-003)
fix(security): add organizationId to volunteer queries (CRITICAL-004)
fix(security): generic validation error messages (HIGH-001)
fix(security): standardize permission error messages (HIGH-002)
```

---

## Important Architectural Decisions

**No ADRs needed for main docs** - All fixes align with existing patterns:

- ADR-009: Dual role system (already correct)
- coding-patterns.md: Multi-tenant isolation (enforce existing rules)
- CLAUDE.md: No console.log directive (enforce existing rules)

These fixes **enforce existing architecture**, not change it.
