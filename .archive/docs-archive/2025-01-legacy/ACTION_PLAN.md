# ACTION PLAN - Sidecar Platform

**Last Updated**: 2025-01-21
**Status**: MVP Complete - Refactoring for Maintainability
**Current Branch**: main
**Next Work Session**: Component Refactoring (6-8 hours)

---

## 🚨 IMMEDIATE PRIORITIES (Next 48 Hours)

### 1. Component Refactoring Sprint (6-8 hours) ⭐ CRITICAL

**Problem**: 1,662 lines of duplicated code causing maintenance nightmare
**Solution**: Extract shared components while keeping routes separate
**Reference**: `/docs/critical-docs/component-refactoring-plan.md`

#### Day 1 Tasks (Tomorrow):

- [ ] **Hour 1-2**: Create `refactor/component-composition` branch
- [ ] **Hour 3-5**: Extract EditCourseForm.tsx (331 lines × 2)
  - Create `/components/courses/EditCourseForm.tsx`
  - Update both platform and agency pages
  - Add cancel button ONCE
  - Test both contexts work
- [ ] **Hour 6-7**: Extract CourseStructure.tsx (497 lines × 2)
  - Create `/components/courses/CourseStructure.tsx`
  - Make it accept `basePath` prop
  - Test drag-and-drop in both contexts
- [ ] **Hour 8**: Test everything, commit, push

**Success Metric**: Cancel button exists in ONE place, works everywhere

### 2. Record First Course Content ⭐ URGENT

**Why Critical**: Can't launch without actual content!

- [ ] Record/create complete course modules
- [ ] Upload videos to S3
- [ ] Test full learning flow
- [ ] Verify progress tracking works

### 3. Fix Production Blockers (2-3 hours)

- [ ] Remove all console.log statements (security risk)
- [ ] Fix Stripe webhook for production
- [ ] Enable CSRF protection in production
- [ ] Test with real emails (not console OTP)

---

## 🔴 CRITICAL PRODUCTION BLOCKERS

### 1. Code Duplication Crisis (40% of codebase)

- **Impact**: Every feature takes 3x longer to build
- **Example**: Adding cancel button requires changes in 3 places
- **Solution**: Component refactoring (see above)
- **Timeline**: 6-8 hours for immediate fix, 40 hours for complete solution

### 2. Mobile Navigation Completely Broken

- **Impact**: Site unusable on mobile devices
- **Issue**: No hamburger menu, no way to login
- **Priority**: After component refactoring

### 3. Stripe Architecture Mismatch

- **Issue**: Schema requires per-course pricing, platform uses subscription
- **Impact**: Can't create courses without dummy Stripe price IDs
- **Solution**: Refactor to subscription model at org level

### 4. Security Issues

- \*\*Console logging in production (OTP codes visible)
- \*\*Missing rate limiting on some routes
- \*\*CSRF protection disabled in dev

---

## 📋 TECHNICAL DEBT BACKLOG

### Phase 1: Component Extraction (6-8 hours) - TOMORROW

- Extract EditCourseForm and CourseStructure
- Create shared component library
- Establish patterns for future extractions

### Phase 2: Complete Refactoring (30+ hours) - POST-MVP

- Migrate all duplicated CRUD operations
- Create service layer for business logic
- Unify server actions
- Full details in `/docs/critical-docs/TECHNICAL-DEBT.md`

### Phase 3: Testing & Performance (20 hours)

- Add integration tests for critical paths
- E2E tests for user workflows
- Performance optimization
- Bundle size reduction

---

## ✅ RECENTLY COMPLETED

### Documentation Improvements

- [x] Created comprehensive Technical Debt document
- [x] Designed Component Refactoring Plan
- [x] Aligned all critical documents
- [x] Updated AI session handoff

### Architecture Analysis

- [x] Identified 1,662 lines of duplicated code
- [x] Discovered root cause: route-based segregation
- [x] Planned migration to component-based composition
- [x] Validated approach against industry standards

---

## 📂 DEPRECATED/POSTPONED PLANS

### Documentation Reorganization (From Old Plan)

**Status**: POSTPONED - Not critical for MVP

- Creating PROJECT.md as single source of truth
- Archiving session files
- Restructuring docs folder

**Why Postponed**: Code duplication is blocking development, must fix first

### S3 Course Organization

**Status**: MODIFIED APPROACH

- Original: Create `feat/s3-course-organization` branch
- Current: Different implementation in `feature/s3-user-organization`
- Decision: Current approach is working, no changes needed

---

## 🎯 SUCCESS METRICS

### Immediate (After Component Refactoring)

- [ ] Cancel button works from single implementation
- [ ] 1,662 lines of duplication eliminated
- [ ] Both platform and agency admins can edit courses
- [ ] No functionality regression

### Short-term (Next Sprint)

- [ ] First course fully recorded and uploaded
- [ ] Mobile navigation fixed
- [ ] All production blockers resolved
- [ ] MVP ready for first customers

### Long-term (Next Month)

- [ ] 80% code duplication eliminated
- [ ] 50% faster feature development
- [ ] Comprehensive test coverage
- [ ] Performance optimized

---

## 🔗 KEY REFERENCES

### Must Read Before Starting:

1. `/docs/critical-docs/component-refactoring-plan.md` - Tomorrow's work plan
2. `/docs/critical-docs/TECHNICAL-DEBT.md` - Full 40-hour strategy
3. `/CODING_PATTERNS.md` - Project patterns (MUST FOLLOW)
4. `/docs/critical-docs/ai-session-handoff.md` - Current state

### Quick Commands:

```bash
# Start work
git checkout -b refactor/component-composition

# Test changes
pnpm lint && pnpm build

# Run dev server (user monitors for OTP)
pnpm dev
```

---

## 📝 NOTES FOR NEXT SESSION

**Starting Point**: Begin with Phase 1 of component refactoring. The plan is detailed and ready to execute. Follow `/docs/critical-docs/component-refactoring-plan.md` exactly.

**Key Context**:

- We discovered the "cancel button problem" - needing to add it in multiple places
- This revealed 40% code duplication across platform/agency routes
- Solution is proven by Linear, Stripe, and Vercel

**Remember**:

- Use `select` pattern, never `include` in Prisma
- Keep routes separate for security
- Share components for maintainability
- Test both contexts after each extraction

---

_This is a living document. Update immediately when priorities change or tasks complete._
