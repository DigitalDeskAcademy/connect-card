---
description: Deep multi-tenant safety audit - verify complete data isolation
---

# Check Multi-Tenant

Deep audit of multi-tenant data isolation to prevent cross-tenant data leakage.

**Critical:** This audit prevents catastrophic data breaches where one church can access another church's member data.

## Your Tasks:

### Phase 1: Database Query Analysis

**Step 1: Find All Prisma Queries**

```bash
# Find all database queries in codebase
grep -r "prisma\." --include="*.ts" --include="*.tsx" app/ actions/ lib/ | grep -v "node_modules"
```

**Step 2: Categorize Queries by Scope**

For each query, determine:

- **Church-scoped**: Should filter by organizationId
- **Platform-scoped**: Platform admin only, no org filter needed
- **Public**: Publicly accessible data

**Step 3: Analyze Each Church-Scoped Query**

For church-scoped queries, check for organizationId filter:

```typescript
// ❌ CRITICAL VIOLATION: Missing organizationId
await prisma.churchMember.findMany({
  where: { email: userEmail },
});
// Risk: Returns members from ALL churches!

// ❌ CRITICAL VIOLATION: Partial filter
await prisma.churchMember.findUnique({
  where: { id: memberId },
});
// Risk: Can access any church's member by ID!

// ✅ CORRECT: organizationId filter present
await prisma.churchMember.findMany({
  where: {
    organizationId: organization.id,
    email: userEmail,
  },
});

// ✅ CORRECT: Composite unique constraint includes organizationId
await prisma.churchMember.findUnique({
  where: {
    organizationId_email: {
      organizationId: organization.id,
      email: userEmail,
    },
  },
});
```

**Step 4: Check Query Methods**

All these methods need organizationId filtering:

- [ ] `findMany()` - ALWAYS needs where filter
- [ ] `findUnique()` - Should use composite key with organizationId
- [ ] `findFirst()` - ALWAYS needs where filter
- [ ] `update()` - ALWAYS needs where filter with organizationId
- [ ] `updateMany()` - ALWAYS needs where filter with organizationId
- [ ] `delete()` - ALWAYS needs where filter with organizationId
- [ ] `deleteMany()` - ALWAYS needs where filter with organizationId
- [ ] `count()` - ALWAYS needs where filter
- [ ] `aggregate()` - ALWAYS needs where filter

**Step 5: Generate Query Isolation Report**

````markdown
# Database Query Isolation Analysis

Total Queries Found: X
✅ Properly Scoped: X
❌ Missing organizationId: X
⚠️ Needs Review: X

CRITICAL VIOLATIONS (Data Leakage):

1. File: app/church/[slug]/admin/members/page.tsx:23
   Query: prisma.churchMember.findMany({ where: { email } })
   Issue: No organizationId filter
   Risk: CRITICAL - Returns members from ALL organizations
   Impact: Complete data breach - Church A can see Church B's members
   Fix:
   ```typescript
   where: {
     organizationId: organization.id,
     email: email
   }
   ```
````

2. File: actions/church/members/actions.ts:45
   Query: prisma.churchMember.update({ where: { id } })
   Issue: No organizationId in where clause
   Risk: CRITICAL - Can update any church's member
   Impact: Data corruption across tenants
   Fix:

   ```typescript
   where: {
     id: memberId,
     organizationId: organization.id
   }
   ```

3. File: app/church/[slug]/admin/connectcards/page.tsx:18
   Query: prisma.connectCard.findMany({})
   Issue: No where clause at all
   Risk: CRITICAL - Returns ALL connect cards from ALL churches
   Impact: Privacy violation, GDPR breach
   Fix:
   ```typescript
   where: {
     organizationId: organization.id;
   }
   ```

````

---

### Phase 2: Server Action Isolation

**Step 6: Find All Server Actions**

```bash
find actions -name "*.ts" -type f
grep -l '"use server"' actions/**/*.ts
````

**Step 7: Check organizationId in Mutations**

For CREATE operations:

```typescript
// ❌ VIOLATION: Missing organizationId
await prisma.churchMember.create({
  data: {
    firstName: data.firstName,
    lastName: data.lastName,
    // Missing organizationId!
  },
});

// ✅ CORRECT: organizationId included
await prisma.churchMember.create({
  data: {
    ...validation.data,
    organizationId: session.user.organizationId, // REQUIRED
  },
});
```

For UPDATE/DELETE operations:

```typescript
// ❌ VIOLATION: No organizationId check
await prisma.churchMember.update({
  where: { id: memberId },
  data: updatedData,
});
// Risk: Can update any church's member!

// ✅ CORRECT: organizationId in where clause
await prisma.churchMember.update({
  where: {
    id: memberId,
    organizationId: organization.id,
  },
  data: updatedData,
});
```

**Step 8: Check Rate Limiting Fingerprints**

```bash
grep -A 5 "fingerprint:" actions/ -r --include="*.ts"
```

Verify multi-tenant fingerprinting:

```typescript
// ❌ VIOLATION: Single-tenant fingerprinting
const decision = await aj.protect(req, {
  fingerprint: session.user.id,
});
// Risk: User can abuse rate limit by hitting multiple orgs

// ✅ CORRECT: Multi-tenant fingerprinting
const decision = await aj.protect(req, {
  fingerprint: `${session.user.id}_${organizationId}`,
});
// Each org has separate rate limit quota
```

**Step 9: Generate Server Action Report**

```markdown
# Server Action Isolation Analysis

Total Server Actions: X
✅ Properly Isolated: X
❌ Tenant Isolation Violations: X

CRITICAL VIOLATIONS:

1. File: actions/church/members/actions.ts
   Function: createChurchMember
   Issue: Missing organizationId in data
   Risk: CRITICAL - Creates orphan records or wrong org
   Fix: Add organizationId: session.user.organizationId

2. File: actions/church/connectcards/actions.ts
   Function: deleteConnectCard
   Issue: No organizationId check before delete
   Risk: CRITICAL - Can delete other church's connect cards
   Fix: Verify ownership before delete

3. File: actions/church/volunteers/actions.ts
   Function: assignVolunteer
   Issue: Single-tenant rate limiting
   Risk: MEDIUM - Can abuse rate limits across orgs
   Fix: Use multi-tenant fingerprinting
```

---

### Phase 3: Route Protection Analysis

**Step 10: Check Church Admin Routes**

```bash
find app/church -name "page.tsx" -type f
```

For each route, verify:

- [ ] Uses `requireDashboardAccess(slug)`
- [ ] Extracts organization from result
- [ ] Uses organization.id in all queries

```typescript
// ❌ VIOLATION: Using slug directly
export default async function MembersPage({ params }) {
  const { slug } = await params;
  // No auth check! No organization lookup!
  const members = await prisma.churchMember.findMany();
}

// ✅ CORRECT: Proper auth and org extraction
export default async function MembersPage({ params }) {
  const { slug } = await params;
  const { dataScope, organization } = await requireDashboardAccess(slug);

  const members = await prisma.churchMember.findMany({
    where: { organizationId: organization.id },
  });
}
```

**Step 11: Check Platform Admin Routes**

```bash
find app/platform -name "page.tsx" -type f
```

For each route, verify:

- [ ] Uses `requireAdmin()`
- [ ] Can access all orgs (intentional)
- [ ] Documented why no org filter

**Step 12: Generate Route Protection Report**

```markdown
# Route Protection Analysis

Church Routes: X
✅ Properly Protected: X
❌ Missing Protection: X

Platform Routes: X
✅ Admin Only: X
❌ Missing Admin Check: X

CRITICAL VIOLATIONS:

1. File: app/church/[slug]/admin/members/page.tsx
   Issue: Not using requireDashboardAccess()
   Risk: CRITICAL - No auth, no org validation
   Impact: Anyone can access any org's data
   Fix: Add const { dataScope, organization } = await requireDashboardAccess(slug)

2. File: app/church/[slug]/admin/settings/page.tsx
   Issue: Using slug directly without validation
   Risk: HIGH - Can manipulate slug to access other orgs
   Impact: Settings exposure, potential takeover
   Fix: Use organization from requireDashboardAccess()
```

---

### Phase 4: Database Schema Analysis

**Step 13: Review Prisma Schema**

```bash
cat prisma/schema.prisma
```

**Step 14: Check Models for organizationId**

For each tenant-scoped model, verify:

- [ ] Has `organizationId` field
- [ ] Has relation to Organization
- [ ] Has indexes including organizationId
- [ ] Has unique constraints including organizationId

```prisma
// ❌ VIOLATION: Missing organizationId
model ChurchMember {
  id        String @id @default(cuid())
  email     String @unique  // ← WRONG: Should be composite unique
  firstName String
  lastName  String
}

// ✅ CORRECT: organizationId present
model ChurchMember {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  email          String
  firstName      String
  lastName       String

  @@unique([organizationId, email]) // ← Composite unique
  @@index([organizationId])          // ← Performance index
}
```

**Step 15: Check for Global Unique Constraints**

Find problematic unique constraints:

```bash
grep "@unique" prisma/schema.prisma
```

Violations:

- Email unique globally → Should be unique per org
- Slug unique globally → Should be unique per org
- Phone unique globally → Should be unique per org

**Step 16: Generate Schema Report**

```markdown
# Database Schema Analysis

Tenant-Scoped Models: X
✅ Has organizationId: X
❌ Missing organizationId: X

Unique Constraints: X
✅ Composite with organizationId: X
❌ Global unique (wrong): X

CRITICAL ISSUES:

1. Model: ChurchMember
   Issue: email field has @unique
   Risk: CRITICAL - Prevents same email across orgs
   Impact: User can't be member of multiple churches
   Fix: Change to @@unique([organizationId, email])

2. Model: ConnectCard
   Issue: No organizationId field
   Risk: CRITICAL - No tenant isolation possible
   Impact: Complete data mixing
   Fix: Add organizationId field and relation

3. Model: VolunteerAssignment
   Issue: Missing index on organizationId
   Risk: MEDIUM - Slow queries, table scans
   Impact: Performance degradation
   Fix: Add @@index([organizationId])
```

---

### Phase 5: Data Access Pattern Analysis

**Step 17: Check for Cross-Organization Relations**

```bash
# Find includes/relations in queries
grep -r "include:" app/ actions/ --include="*.ts" | grep -v node_modules
```

Verify relations don't leak data:

```typescript
// ❌ VIOLATION: Including data without org check
const member = await prisma.churchMember.findUnique({
  where: { id: memberId },
  include: {
    connectCards: true, // ← Could return cards from other orgs!
    volunteerAssignments: true,
  },
});

// ✅ CORRECT: Verified ownership first
const member = await prisma.churchMember.findUnique({
  where: {
    id: memberId,
    organizationId: organization.id,
  },
  include: {
    connectCards: {
      where: { organizationId: organization.id },
    },
    volunteerAssignments: {
      where: { organizationId: organization.id },
    },
  },
});
```

**Step 18: Check Aggregation Queries**

```bash
grep -r "aggregate\|count\|groupBy" app/ actions/ --include="*.ts"
```

Verify aggregations are scoped:

```typescript
// ❌ VIOLATION: Global count
const totalMembers = await prisma.churchMember.count();
// Returns count across ALL orgs!

// ✅ CORRECT: Org-scoped count
const totalMembers = await prisma.churchMember.count({
  where: { organizationId: organization.id },
});
```

**Step 19: Generate Data Access Report**

```markdown
# Data Access Pattern Analysis

Include Relations Found: X
✅ Properly Scoped: X
❌ Potential Leakage: X

Aggregation Queries: X
✅ Org-Scoped: X
❌ Global (wrong): X

VIOLATIONS:

1. File: app/church/[slug]/admin/dashboard/page.tsx:34
   Issue: Global member count
   Risk: HIGH - Shows wrong statistics
   Impact: Dashboard shows data from all orgs
   Fix: Add where: { organizationId: organization.id }

2. File: app/church/[slug]/admin/members/[id]/page.tsx:18
   Issue: Including connectCards without org filter
   Risk: CRITICAL - Could show other org's connect cards
   Impact: Data leakage through relations
   Fix: Add org filter to include clause
```

---

### Phase 6: URL/Slug Validation

**Step 20: Check Slug Usage**

```bash
# Find slug usage in church routes
grep -r "params.*slug" app/church --include="*.tsx"
```

**Step 21: Verify Slug → Organization Validation**

```typescript
// ❌ VIOLATION: Using slug without validation
const { slug } = await params;
const data = await prisma.organization.findUnique({
  where: { slug: slug }, // ← No verification user has access!
});

// ❌ VIOLATION: Manual org lookup (don't do this)
const { slug } = await params;
const org = await prisma.organization.findUnique({ where: { slug } });
const member = await prisma.churchMember.findMany({
  where: { organizationId: org.id },
});
// Risk: No check if user can access this org!

// ✅ CORRECT: Using requireDashboardAccess
const { slug } = await params;
const { dataScope, organization } = await requireDashboardAccess(slug);
// ← Validates user has access to this org
```

**Step 22: Check for Slug Manipulation**

Test cases to verify:

- [ ] User from Church A can't access Church B by changing slug in URL
- [ ] Invalid slug returns proper error
- [ ] Platform admin can access all slugs
- [ ] Church admin can only access their slug

**Step 23: Generate Slug Validation Report**

```markdown
# Slug/URL Validation Analysis

Slug Uses Found: X
✅ Validated via requireDashboardAccess: X
❌ Direct slug usage (unsafe): X

CRITICAL VIOLATIONS:

1. File: app/church/[slug]/admin/settings/page.tsx
   Issue: Using slug directly without validation
   Code: const org = await prisma.organization.findUnique({ where: { slug }})
   Risk: CRITICAL - Can access any org's settings
   Impact: Organization takeover possible
   Fix: Use requireDashboardAccess(slug)

2. File: app/church/[slug]/admin/api/route.ts
   Issue: Slug from URL used in query without auth
   Risk: CRITICAL - API endpoint accessible cross-tenant
   Impact: Data breach via API manipulation
   Fix: Validate slug ownership before query
```

---

### Phase 7: Testing Recommendations

**Step 24: Manual Test Scenarios**

Provide test checklist:

```markdown
# Multi-Tenant Security Test Checklist

Test these scenarios to verify isolation:

1. Data Access Test

   - [ ] Log in as Church A admin
   - [ ] Note a member ID from Church A
   - [ ] Change URL slug to Church B
   - [ ] Try to access Church A member ID
   - [ ] Expected: 403 Forbidden or redirect
   - [ ] Actual: \***\*\_\*\***

2. API Manipulation Test

   - [ ] Log in as Church A user
   - [ ] Intercept API request
   - [ ] Change organizationId in request body
   - [ ] Submit request
   - [ ] Expected: Validation error or 403
   - [ ] Actual: \***\*\_\*\***

3. Slug Manipulation Test

   - [ ] Log in as Church A admin
   - [ ] Navigate to /church/church-a/admin/members
   - [ ] Change URL to /church/church-b/admin/members
   - [ ] Expected: Access denied or redirect
   - [ ] Actual: \***\*\_\*\***

4. ID Guessing Test

   - [ ] Log in as Church A user
   - [ ] Get a resource ID from Church A
   - [ ] Increment/decrement ID
   - [ ] Try to access via API or URL
   - [ ] Expected: 404 or 403
   - [ ] Actual: \***\*\_\*\***

5. Aggregate Query Test
   - [ ] Log in as Church A admin
   - [ ] View dashboard with statistics
   - [ ] Note total member count
   - [ ] Verify count matches only Church A members
   - [ ] Expected: Count for Church A only
   - [ ] Actual: \***\*\_\*\***

Results:
✅ All tests passed - Multi-tenant isolation verified
❌ Tests failed - CRITICAL security issue
```

---

### Phase 8: Generate Final Report

**Step 25: Consolidate All Findings**

````markdown
# Multi-Tenant Safety Audit Report

Generated: <timestamp>
Audit Scope: Full codebase
Risk Level: <CRITICAL/HIGH/MEDIUM/LOW>

## Executive Summary

Multi-Tenant Isolation Status: <PASS/FAIL>

Critical Issues: X (immediate fix required)
High Priority: X (fix within 24 hours)
Medium Priority: X (fix within 1 week)
Low Priority: X (fix when convenient)

**Overall Assessment:**
<brief summary of tenant isolation status>

## Findings Summary

### Database Query Isolation

Total Queries: X
✅ Properly Scoped: X
❌ Missing organizationId: X

### Server Action Isolation

Total Actions: X
✅ Properly Isolated: X
❌ Violations: X

### Route Protection

Church Routes: X
✅ Protected: X
❌ Unprotected: X

### Database Schema

Models: X
✅ Has organizationId: X
❌ Missing organizationId: X

### Data Access Patterns

Includes/Relations: X
✅ Scoped: X
❌ Potential Leakage: X

### Slug Validation

Slug Uses: X
✅ Validated: X
❌ Direct Use: X

## Critical Issues (Fix NOW)

1. **Cross-Tenant Data Leakage in Member Query**
   - Location: app/church/[slug]/admin/members/page.tsx:23
   - Issue: prisma.churchMember.findMany() without organizationId
   - Impact: CATASTROPHIC - Church A can see ALL churches' members
   - Risk Score: 10/10
   - Fix Complexity: Easy (5 minutes)
   - Fix:
   ```typescript
   where: {
     organizationId: organization.id;
   }
   ```
````

2. **Unprotected Update Endpoint**
   - Location: actions/church/members/actions.ts:45
   - Issue: Can update any organization's member
   - Impact: CRITICAL - Data corruption across tenants
   - Risk Score: 10/10
   - Fix Complexity: Easy (5 minutes)
   - Fix:
   ```typescript
   where: {
     id: memberId,
     organizationId: organization.id
   }
   ```

<continue listing all critical issues>

## High Priority Issues

<list all high priority issues with details>

## Remediation Plan

### Immediate Actions (Today)

1. Fix all CRITICAL issues (estimated time: X minutes)
2. Deploy hotfix to production
3. Audit production logs for evidence of exploitation
4. Notify security team

### Short-Term (This Week)

1. Fix all HIGH priority issues
2. Implement automated testing
3. Add pre-commit hooks for tenant checks
4. Review and update documentation

### Long-Term (This Month)

1. Fix MEDIUM/LOW priority issues
2. Implement monitoring/alerting
3. Conduct penetration testing
4. Security training for development team

## Testing Recommendations

Run manual tests to verify fixes:
<insert test checklist from Phase 7>

## Monitoring Recommendations

1. Alert on queries without organizationId filter
2. Log all cross-org access attempts
3. Monitor for slug manipulation attempts
4. Track suspicious API usage patterns

## Compliance Impact

Multi-tenant isolation failures could result in:

- GDPR violations (€20M or 4% revenue fine)
- Data breach notifications required
- Loss of customer trust
- Legal liability
- Contract violations

## Documentation Updates Needed

1. Update architecture.md with tenant isolation requirements
2. Document multi-tenant patterns in coding-patterns.md
3. Add ADR for tenant isolation strategy
4. Update security checklist for PRs

## Conclusion

<summary of overall tenant safety status>
<recommendation to proceed or block deployment>
```

**Step 26: Ask About Remediation**

Ask user: **"Found X critical multi-tenant violations. These are DATA BREACH risks. Would you like me to help fix them immediately? (yes/no)"**

If yes:

1. Prioritize CRITICAL issues
2. Fix each one systematically
3. Re-run audit to verify
4. Update documentation

---

## When to Use:

✅ **Before EVERY production deployment**
✅ **After adding any database queries**
✅ **After adding new routes**
✅ **Monthly security audits**
✅ **After tenant-related code changes**
✅ **Before customer demos**
✅ **After security incidents**

**CRITICAL:** Multi-tenant violations are the MOST SERIOUS security issue. They allow complete data breaches where one customer can access all other customers' data.

---

## Integration:

**Must be called by:**

- `/feature-wrap-up` (before merge)
- `/check-security` (part of security audit)

**Should block:**

- Production deployments
- PR approvals
- Feature completion

This audit is NON-NEGOTIABLE for multi-tenant SaaS platforms.
