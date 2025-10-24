# Security Implementation Plan - Multi-Tenant & Production Readiness

## 🎯 Objective

Implement comprehensive security measures for the Sidecar Platform, addressing both multi-tenant isolation and production security requirements before launch.

**Security Score Goal**: 9/10 (up from current 7.5/10)
**Total Implementation Time**: ~2 days
**Critical Path**: Phase 1A + Phase 2A must be complete before production

---

## 🚨 Current Security Issues

### Multi-Tenant Architecture Issues

1. **No middleware protection for `/agency/*` routes** - Any logged-in user can attempt access
2. **PLATFORM_ADMIN can access `/agency/*` routes** - Should be completely blocked
3. **UserDropdown shows incorrect navigation** - Hardcoded routes don't respect role boundaries
4. **Missing role validation at middleware level** - Only page-level protection exists
5. **Missing Member record creation** - Better Auth multi-tenant security model violated

### Production Security Gaps

1. **No rate limiting on `/auth/callback`** - Vulnerable to brute force
2. **No error handling in auth flows** - Exposes stack traces
3. **No audit logging** - Cannot track security events
4. **Console.log in production** - Information disclosure risk
5. **No graceful error pages** - Poor user experience and potential info leak

---

## 📋 Implementation Phases

### Phase 1A: Authentication & Session Security 🔴 CRITICAL (Day 1 - Morning)

**Status**: In Progress
**Branch**: `feat/agency-signup-flow`
**Time Estimate**: 2-3 hours

#### Tasks:

##### Better Auth Organization Fix (COMPLETED ✅)

- [x] Add Member record creation in organization setup
- [ ] Update OrganizationSetupForm redirect to `/auth/callback`
- [ ] Test organization creation with Member association

##### Auth Callback Hardening

- [ ] Add Arcjet rate limiting to `/auth/callback`
  ```typescript
  const aj = arcjet.withRule(
    fixedWindow({ mode: "LIVE", window: "1m", max: 10 })
  );
  ```
- [ ] Implement try-catch error handling
- [ ] Add graceful fallbacks for database errors
- [ ] Create `/app/error/page.tsx` for error display

##### Audit Logging System

- [ ] Add AuditLog model to Prisma schema
- [ ] Create `/lib/audit.ts` service
- [ ] Log events: AUTH_CALLBACK, LOGIN_SUCCESS, LOGIN_FAILED
- [ ] Integrate logging in auth callback flow

##### Production Cleanup

- [ ] Remove console.log from `/lib/auth.ts` (OTP logging)
- [ ] Replace console.warn with audit logs in middleware
- [ ] Ensure all errors log server-side only

---

### Phase 1B: Middleware Security Layer 🔴 CRITICAL (Day 1 - Afternoon)

**Status**: Not Started
**Branch**: `fix/multi-tenant-security`
**Time Estimate**: 3-4 hours

#### Tasks:

##### Route Protection

- [ ] Update `middleware.ts` with comprehensive role validation
  ```typescript
  // Enforcement rules:
  - /platform/* → Only PLATFORM_ADMIN
  - /agency/[slug]/* → Only users with matching organizationId
  - /agency/[slug]/admin/* → Only AGENCY_OWNER/AGENCY_ADMIN
  - /agency/[slug]/learning/* → Any organization member
  ```

##### Organization Validation

- [ ] Validate organization slug matches user's organizationId
- [ ] Block cross-tenant access attempts
- [ ] Add Member table validation for Better Auth compliance

##### Security Logging

- [ ] Log all access violations to AuditLog
- [ ] Track: userId, attempted route, violation type, timestamp
- [ ] Add rate limiting for repeated violations

---

### Phase 2A: Role-Aware Components (Day 1 - Evening)

**Status**: Not Started
**Time Estimate**: 2 hours

#### Tasks:

##### Component Creation

- [ ] Create `PlatformAdminDropdown` component

  - Home → /platform/admin
  - Platform-specific navigation only

- [ ] Create `AgencyAdminDropdown` component

  - Home → /agency/[slug]/admin
  - Organization-scoped navigation

- [ ] Create `EndUserDropdown` component
  - Home → /agency/[slug]/learning
  - Limited navigation options

##### Integration

- [ ] Update `Navbar` to use role-specific dropdowns
- [ ] Remove hardcoded routes from current `UserDropdown`
- [ ] Test navigation for all role types

---

### Phase 2B: Data Access Security (Day 2 - Morning)

**Status**: Not Started
**Time Estimate**: 3 hours

#### Tasks:

##### Query Security

- [ ] Audit all Prisma queries for organization scoping
- [ ] Create utility functions:
  ```typescript
  // lib/data-utils.ts
  export function orgScopedWhere(orgId: string, where = {}) {
    return { ...where, organizationId: orgId };
  }
  ```

##### Data Mutations

- [ ] Add organization validation to all create/update/delete operations
- [ ] Ensure Member table checks for multi-tenant operations
- [ ] Implement soft deletes where appropriate

##### Query Logging

- [ ] Log all data access attempts
- [ ] Track: userId, model, operation, organizationId
- [ ] Flag suspicious patterns (bulk reads, cross-org attempts)

---

### Phase 3: Testing & Validation (Day 2 - Afternoon)

**Status**: Not Started
**Time Estimate**: 2-3 hours

#### Security Test Matrix:

##### Authentication Tests

- [ ] Rate limiting blocks after 10 attempts on `/auth/callback`
- [ ] Error pages display without exposing stack traces
- [ ] Audit logs created for all auth events
- [ ] Session refresh includes organization context

##### Multi-Tenant Tests

- [ ] PLATFORM_ADMIN cannot access `/agency/*` routes
- [ ] AGENCY_OWNER cannot access other agencies
- [ ] AGENCY_ADMIN cannot access `/platform/*` routes
- [ ] END_USER cannot access admin areas
- [ ] Cross-tenant data access blocked at all levels

##### Production Tests

- [ ] No console.log in production build
- [ ] All errors handled gracefully
- [ ] IP addresses and user agents logged correctly
- [ ] Foreign key constraints enforced

---

### Phase 4: Monitoring & Documentation (Week 1 Post-Launch)

**Status**: Planned
**Time Estimate**: 1 day

#### Monitoring Dashboard (`/platform/admin/security`)

- [ ] Display recent audit logs
- [ ] Show authentication metrics
- [ ] Track failed login attempts
- [ ] Monitor rate limit violations
- [ ] Organization access patterns

#### Alert System

- [ ] Email alerts for suspicious patterns
- [ ] Threshold alerting (>10 failed logins)
- [ ] Cross-tenant access attempts
- [ ] Rate limit violations

#### Documentation

- [ ] Update security best practices
- [ ] Document access control matrix
- [ ] Create incident response playbook
- [ ] Update CLAUDE.md with security notes

---

## 🔒 Security Principles

1. **Fail Secure**: Default to denying access
2. **Defense in Depth**: Multiple layers of security (middleware + page + data)
3. **Least Privilege**: Users only access what they need
4. **Audit Everything**: Comprehensive logging of security events
5. **Clear Boundaries**: No ambiguity in access rules
6. **Zero Trust**: Verify at every layer

---

## 📊 Success Metrics

### Immediate (Phase 1-2)

- ✅ Zero exposed error details to clients
- ✅ All auth events logged
- ✅ Rate limiting active on critical endpoints
- ✅ No cross-tenant access possible
- ✅ Clean production logs (no console.log)

### Short-term (Phase 3-4)

- 📊 <0.1% authentication error rate
- 📊 <5 second mean time to detect issues
- 📊 100% of security events captured
- 📊 Zero unauthorized access successful

### Long-term (Future)

- 🎯 SOC 2 compliance ready
- 🎯 <1 minute incident response time
- 🎯 Zero security breaches

---

## 🚀 Implementation Commands

```bash
# Phase 1A: Auth Security
npx prisma migrate dev --name add-audit-log-and-member-fixes
npm run dev # Test auth flow

# Phase 1B: Middleware Security
# Update middleware.ts
npm run dev # Test route protection

# Phase 2: Components & Data
# Implement components
npm run build # Ensure no type errors

# Phase 3: Testing
npm run test:security # Run security test suite
npx prisma studio # Verify audit logs

# Final: Production Check
npm run build
npm run lint
# Check for console.log warnings
```

---

## 🚨 Rollback Plan

If issues arise after deployment:

### Quick Fixes (< 5 minutes)

1. **Rate Limiting Issues**: Change Arcjet mode to "DRY_RUN"
2. **Audit Log Failures**: Disable logging (non-blocking by design)
3. **Middleware Too Strict**: Add temporary bypass flag

### Emergency Rollback (< 15 minutes)

```bash
git revert HEAD # Revert last commit
git push origin main --force-with-lease
# Trigger redeploy
```

---

## ✅ Pre-Production Checklist

### Must Have (Blocking)

- [ ] Member record creation for organizations
- [ ] Rate limiting on auth endpoints
- [ ] Error handling without stack traces
- [ ] Basic audit logging
- [ ] Middleware route protection
- [ ] Role-specific navigation

### Should Have (24 hours)

- [ ] Monitoring dashboard
- [ ] Alert system setup
- [ ] Enhanced audit queries

### Nice to Have (Week 1)

- [ ] Structured logging (Winston/Pino)
- [ ] Export to SIEM
- [ ] Advanced threat detection

---

## 📝 Notes

- **Current Branch**: `feat/agency-signup-flow`
- **Next Branch**: `fix/multi-tenant-security` (after Phase 1A)
- **Parent Issue**: #security-implementation
- **Created**: 2025-01-14
- **Target Completion**: 2025-01-16 (2 days)
- **Owner**: Platform Security Team

---

## 🗑️ Cleanup

When all phases are complete:

1. Archive this document to `/docs/completed/`
2. Update CLAUDE.md to remove security TODOs
3. Create maintenance security checklist
4. Delete temporary security test data

```bash
# After completion
mv docs/phase-plans/SECURITY_IMPLEMENTATION_PLAN.md docs/completed/
rm -rf docs/phase-plans/multi-tenant-security/
```
