# Multi-Tenant Security Fix - Phase Plan

## 🎯 Objective

Fix critical security issues in the multi-tenant architecture to ensure proper role-based access control and prevent cross-tenant data access.

## 🚨 Current Security Issues

1. **No middleware protection for `/agency/*` routes** - Any logged-in user can attempt access
2. **PLATFORM_ADMIN can access `/agency/*` routes** - Should be completely blocked
3. **UserDropdown shows incorrect navigation** - Hardcoded routes don't respect role boundaries
4. **Missing role validation at middleware level** - Only page-level protection exists

## 📋 Implementation Phases

### Phase 1: Middleware Security Layer 🔴 CRITICAL

**Status**: Not Started  
**Branch**: `fix/multi-tenant-security`

#### Tasks:

- [ ] Update `middleware.ts` to validate user roles for all routes
- [ ] Block PLATFORM_ADMIN from `/agency/*` routes entirely
- [ ] Block agency users from `/platform/*` routes entirely
- [ ] Validate organization slug matches user's organization
- [ ] Add security logging for all access violations
- [ ] Test all role-based access scenarios

#### Implementation Details:

```typescript
// Middleware should enforce:
- /platform/* → Only PLATFORM_ADMIN
- /agency/[slug]/* → Only users with matching organizationId
- /agency/[slug]/admin/* → Only AGENCY_OWNER/AGENCY_ADMIN
- /agency/[slug]/learning/* → Any organization member
```

---

### Phase 2: Role-Aware Navigation Components

**Status**: Not Started

#### Tasks:

- [ ] Create `PlatformAdminDropdown` component
  - Home → /platform/admin
  - Remove agency-specific links
- [ ] Create `AgencyAdminDropdown` component
  - Home → /agency/[slug]/admin
  - Organization-scoped navigation
- [ ] Create `EndUserDropdown` component
  - Home → /agency/[slug]/learning
  - Limited navigation options
- [ ] Update `Navbar` to use role-specific dropdowns
- [ ] Remove hardcoded routes from `UserDropdown`

---

### Phase 3: Data Access Layer Security

**Status**: Not Started

#### Tasks:

- [ ] Audit all Prisma queries for organization scoping
- [ ] Create utility functions for org-scoped queries
- [ ] Add organization validation to all data mutations
- [ ] Implement query logging for security auditing
- [ ] Review and update all data access functions

---

### Phase 4: Testing & Validation

**Status**: Not Started

#### Test Scenarios:

- [ ] PLATFORM_ADMIN cannot access `/agency/*` routes
- [ ] AGENCY_OWNER cannot access other agencies
- [ ] AGENCY_ADMIN cannot access `/platform/*` routes
- [ ] END_USER cannot access admin areas
- [ ] Cross-tenant data access is blocked
- [ ] Navigation shows correct links per role
- [ ] Unauthorized access redirects properly

---

### Phase 5: Documentation & Monitoring

**Status**: Not Started

#### Tasks:

- [ ] Document access control matrix
- [ ] Add security event logging
- [ ] Create monitoring alerts for violations
- [ ] Update developer documentation
- [ ] Create security testing checklist

---

## 🔒 Security Principles

1. **Fail Secure**: Default to denying access
2. **Defense in Depth**: Multiple layers of security
3. **Least Privilege**: Users only access what they need
4. **Audit Trail**: Log all access attempts
5. **Clear Boundaries**: No ambiguity in access rules

## 📊 Success Criteria

- [ ] All middleware tests pass
- [ ] No cross-tenant access possible
- [ ] Correct navigation per role
- [ ] Security logs capture violations
- [ ] Performance impact < 50ms

## 🗑️ Cleanup

**IMPORTANT**: When all phases are complete, delete this file:

```bash
rm -rf docs/phase-plans/multi-tenant-security
```

This ensures we don't keep stale documentation in the codebase.

---

_Created: 2025-01-13_  
_Branch: fix/multi-tenant-security_  
_Parent Branch: feat/multi-tenant-route-migration_
