# Prayer Management Feature Vision

**Status:** Complete
**Owner:** Product Team
**Related Features:** Connect Cards, Member Management

---

## Purpose

Multi-tenant prayer request tracking system with privacy controls, auto-categorization, and batch assignment workflows for routing requests to prayer team members.

**What it does:** Capture prayer requests → Categorize by topic → Respect privacy levels → Assign to prayer teams → Track follow-up

---

## Problems Solved

1. **Scattered prayer requests** - Requests come from cards, emails, texts with no central system
2. **Privacy concerns** - Not clear which requests are safe to share publicly vs. keep private
3. **No follow-up tracking** - Hard to remember who requested prayer 2 weeks ago
4. **Manual distribution** - Copy/paste requests into email every week
5. **Sensitive topics** - Need to flag requests mentioning addiction, suicide, abuse for pastoral care

---

## Technical Approach

### Database Schema
- `PrayerRequest` model with JSONB metadata
- `PrayerBatch` for bulk assignment workflows
- Privacy levels: PUBLIC, MEMBERS_ONLY, LEADERSHIP, PRIVATE
- Auto-categorization: 8 categories (Health, Family, Work, Spiritual, etc.)
- Multi-tenant organizationId + locationId scoping

### Privacy Controls
- **Public:** Anyone can see
- **Members Only:** Logged-in church members can see
- **Leadership:** Only pastors/staff can see
- **Private:** Only requester and assigned prayer partner can see
- **Sensitive keyword detection:** Auto-flags addiction, suicide, abuse

### UI Components
- TanStack Table with search, filter, sort, pagination
- Row selection for batch operations
- Privacy badges (color-coded indicators)
- Bulk assignment controls

### Server Actions
- `assignSelectedPrayers()` - Assign specific prayers to team member
- `assignAllPrayers()` - Assign entire batch to team member
- Arcjet rate limiting (5 requests/minute)
- Multi-tenant organizationId verification

---

## Feature Roadmap

### Phase 1: Prayer Management MVP ✅ COMPLETE
- [x] Database schema (PrayerRequest with privacy levels)
- [x] TanStack Table UI (search, filter, sort, pagination)
- [x] Privacy controls (4 levels + staff-only private requests)
- [x] Auto-categorization (8 categories + sensitive keywords)
- [x] E2E test suite (8 tests covering isolation, privacy, workflow)

### Phase 2: Prayer Batch Management ✅ COMPLETE
- [x] Batch model with organizationId scoping
- [x] Bulk assignment UI (TanStack Table row selection)
- [x] Assign selected prayers server action
- [x] Assign all prayers server action
- [x] E2E test suite (10 tests, 8 passing)

### Phase 3: Follow-Up Workflows (Planned)
- [ ] Prayer request status tracking (PENDING, IN_PROGRESS, ANSWERED, ARCHIVED)
- [ ] Follow-up reminders (check-in after 1 week, 2 weeks)
- [ ] Answered prayer tracking (celebrate answered prayers)
- [ ] Prayer partner assignments (recurring assignments)

### Phase 4: Communication & Automation (Planned)
- [ ] SMS/email prayer requests to prayer team
- [ ] Two-way responses (team replies via SMS/email)
- [ ] Automated weekly prayer digest
- [ ] Template library (confirmation messages, follow-up templates)

---

## Testing Strategy

### E2E Tests (Complete)
- Multi-tenant isolation (staff can only see their org's prayers)
- Privacy controls (staff can't see other staff's private requests)
- Role-based access (church_admin sees more than user)
- Batch workflow (create batch, assign prayers, verify)
- Search functionality (SQL injection protection)

### Manual Testing
- Process 100+ real prayer requests from pilot church
- Test privacy levels with actual sensitive content
- Verify multi-campus routing (locationId filtering)
- Load testing (bulk assignment of 50+ requests)

---

## Success Metrics

### Request Capture
- 60% → 95% of prayer requests from connect cards captured

### Privacy Compliance
- 70% → 95% sensitive topics auto-detected and flagged

### Distribution Time
- 30 minutes → 5 minutes per week (automated workflows)

### Follow-Up Rate
- 50% → 80% (reminder system for answered prayers)

---

## Deployment Plan

### Database Migrations
- PrayerRequest model in production ✅
- PrayerBatch model in production ✅
- No breaking changes planned

### Feature Flags
- None required (feature complete)

### Rollback Plan
- Manual prayer tracking still available (spreadsheets, paper)

---

## Known Issues

### E2E Test Failures (2 tests)
**Status:** Known issue, not blocking production

**Failing Tests:**
1. `BASIC: Verify batches exist in system`
2. `DATA: No orphaned cards (all cards have batchId)`

**Root Cause:** Playwright test isolation - seed data not shared between test contexts

**Workaround:** Tests pass individually, fail when run together

**Follow-up:** Future PR to improve test isolation and seed data strategy

---

## Future Enhancements

- **Prayer analytics:** Category trends, response rates, answered prayer metrics
- **Prayer templates:** Pre-built batch settings (weekly prayer meeting, crisis response)
- **Integration with GHL:** SMS delivery via GoHighLevel sub-accounts
- **Mobile app:** Native iOS/Android for prayer team members

---

**Last Updated:** 2025-11-23
**Next Review:** After Phase 3 completion
