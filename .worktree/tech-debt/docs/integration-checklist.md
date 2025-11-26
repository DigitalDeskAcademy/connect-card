# Integration Checklist - Tech-Debt

**Purpose:** Pre-merge checklist before integrating security fixes to main

**Note:** This file is gitignored (stays local to worktree)

---

## Pre-Integration Requirements

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed (especially console statements)
- [ ] Build passes successfully
- [ ] **Zero console.log/error statements** in production code

### Testing

- [ ] E2E tests written for multi-tenant isolation
- [ ] Manual testing on all user roles (owner, admin, staff)
- [ ] Multi-tenant isolation verified (cannot access other org data)
- [ ] Location-based filtering tested (staff cannot see other locations)

### Database

- [ ] No schema changes (tech-debt is bug-fix only)
- [ ] No migrations needed
- [ ] Seed data unchanged

### Security (CRITICAL)

- [ ] **CRITICAL-001:** organizationId in remove-member.ts WHERE clause
- [ ] **CRITICAL-002:** All PII logging removed (13 files verified)
- [ ] **CRITICAL-003:** Volunteer creation uses auth context (not user input)
- [ ] **CRITICAL-004:** All volunteer queries have organizationId filtering
- [ ] **HIGH-001:** Validation error messages are generic
- [ ] **HIGH-002:** Permission error messages standardized

### Documentation

- [ ] No ADRs needed (enforcing existing patterns)
- [ ] STATUS.md updated (tech debt fixes completed)
- [ ] Audit findings marked as resolved in codebase-audit.md

### Performance

- [ ] No new N+1 query patterns introduced
- [ ] Bundle size unchanged (only removing code)
- [ ] No unnecessary client components

### Integration Plan

- [ ] Code changes reviewed
- [ ] All tests passing
- [ ] Ready to merge directly to main

---

## Security Verification Checklist

### Multi-Tenant Isolation (CRITICAL)

```bash
# Verify all Prisma queries have organizationId
grep -r "prisma\\..*\\.update(" actions/ | grep -v "organizationId"
# Should return ZERO results

grep -r "prisma\\..*\\.delete(" actions/ | grep -v "organizationId"
# Should return ZERO results (or very few justified cases)
```

### PII Logging Removal (CRITICAL)

```bash
# Verify zero console statements
grep -r "console\\.log\|console\\.error" actions/ app/api/
# Should return ZERO results
```

### Organization Context Usage (CRITICAL)

```bash
# Verify no user input used for organizationId
grep -r "validatedData\\.organizationId" actions/
# Should return ZERO results
```

---

## Merge Workflow

\`\`\`bash

# 1. Ensure on tech-debt branch

cd /home/digitaldesk/Desktop/connect-card/tech-debt
git branch --show-current

# Should show: feature/tech-debt

# 2. Update from main (get latest changes)

git pull origin main

# 3. Resolve conflicts (if any)

# ... conflict resolution ...

# 4. Run full test suite

pnpm build
pnpm lint
pnpm test:e2e

# 5. Switch to main worktree

cd /home/digitaldesk/Desktop/connect-card/main

# 6. Merge tech-debt branch

git merge feature/tech-debt

# 7. Verify only code merged (dev docs stay in worktree)

git status

# Should NOT show .worktree/ files (gitignored)

# 8. Push to main

git push origin main

# 9. Deploy to production

# (follow deployment checklist)

\`\`\`

---

## Post-Merge Verification

- [ ] Production build succeeds
- [ ] E2E tests pass in production environment
- [ ] No console errors in browser
- [ ] Multi-tenant isolation verified with test users
- [ ] Sentry shows no new errors

---

## Rollback Plan (if needed)

\`\`\`bash

# If issues found after merge:

git revert <merge-commit-hash>
git push origin main
\`\`\`

---

**Complete this checklist before merging to main**
