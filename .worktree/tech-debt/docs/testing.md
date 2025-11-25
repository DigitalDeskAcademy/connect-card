# Tech-Debt - Testing Strategy

---

## E2E Test Coverage

### Multi-Tenant Isolation Tests

- [ ] Cannot remove member from different organization (CRITICAL-001)
- [ ] Cannot create volunteer in different organization (CRITICAL-003)
- [ ] Location filtering works for staff members
- [ ] Admin cannot access other org's data

### Volunteer Management Tests

- [ ] Volunteer creation uses auth context organizationId
- [ ] Volunteer skills filtered by organizationId
- [ ] Volunteer availability filtered by organizationId

---

## Manual Testing Checklist

### As Platform Admin

- [ ] Can access audit logs (if implemented)
- [ ] Cannot bypass multi-tenant isolation

### As Church Owner (Account Owner)

- [ ] Can remove team members from own organization
- [ ] Cannot remove members from other organizations
- [ ] Can create volunteers in own organization

### As Church Admin

- [ ] Limited to own organization data
- [ ] Cannot see other organizations

### As Staff

- [ ] Limited to own location data
- [ ] Cannot access other locations (unless canSeeAllLocations = true)

---

## Security Verification

### Multi-Tenant Isolation

- [ ] All Prisma queries include organizationId WHERE clause
- [ ] No user input used for organizationId (auth context only)
- [ ] Error messages don't leak data structure

### PII Protection

- [ ] No console.log/error statements in production code
- [ ] No sensitive data in error messages
- [ ] Validation errors are generic

---

## Test Data

**Database:** Shared with main (connect_card)

**Test Organizations:**

- Church Connect Demo (from seed data)

**Test Users:**

- owner@example.com (church_owner)
- admin@example.com (church_admin)
- staff@example.com (user with defaultLocationId)

---

## Automated Tests to Run

```bash
# Build verification
pnpm build

# TypeScript checks
pnpm tsc --noEmit

# ESLint (should show NO console warnings)
pnpm lint

# E2E tests
pnpm test:e2e
```

---

## Known Issues

- [ ] None (add as discovered)

---

## Regression Testing

After fixes, verify:

- [ ] Team management still works
- [ ] Volunteer creation still works
- [ ] Prayer request management still works
- [ ] Connect card processing still works
