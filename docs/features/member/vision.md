# Member Management - Product Vision

> 📋 **STATUS: FUTURE WORK (Dec 2025)**
>
> This feature is not yet built and is planned for a future phase.
> Post-demo priorities focus on: Planning Center API, Deduplication,
> Keyword Detection, and Volunteer Event Tracking.

**Status:** ❌ **NOT YET BUILT**
**Planned Phase:** Phase 3+ (January 2026+)
**Last Updated:** 2025-12-17

---

## 🎯 The Problem We Solve

Churches struggle to track visitor journey from first-time visitor → returning → regular → member:

- **No centralized member directory** - Spreadsheets, paper lists, outdated databases
- **Lost visitor follow-up** - First-time visitors fall through cracks (30-40% drop-off)
- **No pipeline visibility** - Can't see who's moving from visitor → member
- **Manual status tracking** - Staff manually update "new visitor" tags
- **Duplicate records** - Same person entered multiple times from different connect cards

**Real-World Impact:** Churches lose 60-70% of first-time visitors due to inconsistent follow-up. Manual tracking means staff don't know who needs outreach this week.

---

## ✅ Our Solution: Automated Member Lifecycle Tracking

**N2N Workflow (Newcomer to Next-Step):**

1. **First Visit** - Connect card scanned → Auto-creates member profile
2. **Returning Visitor** - 2nd/3rd visit detected → Status auto-updates
3. **Regular Attender** - 4+ visits → Flagged for membership conversation
4. **Member** - Completes membership class → Full member status

**Automation:** System tracks visit frequency, auto-updates status, flags who needs follow-up this week.

---

## 🚀 Planned Features (Phase 4)

### Member Directory

- [ ] **Searchable Member List** - Filter by status, tags, location, attendance
  - TanStack Table with sorting, pagination
  - Search by name, email, phone
  - Filter by member type (visitor, returning, member, volunteer, staff)
  - Export member lists (CSV/Excel)
- [ ] **Member Profiles** - Individual history, notes, connect cards, attendance
  - View all connect cards submitted by this member
  - Track attendance trends (first visit date, last attendance)
  - Notes and interactions log
  - Tags and custom fields (small group, serving team, etc.)
- [ ] **Member Import** - Bulk upload existing member database (CSV import)
  - Map CSV columns to member fields
  - Duplicate detection during import
  - Validation and error reporting
- [ ] **Duplicate Detection** - Warn when connect card matches existing member
  - Fuzzy matching on name/email/phone
  - Merge duplicate profiles
  - Manual review for uncertain matches

### N2N (Newcomer to Next-Step) Workflow

- [ ] **Visitor Pipeline** - Visual funnel from first-time → member
  - Dashboard showing counts at each stage
  - Track conversion rates (first-time → returning → member)
  - Identify drop-off points in pipeline
- [ ] **Status Tracking** - Auto-update member type based on visit frequency
  - VISITOR: 1 visit
  - RETURNING: 2-3 visits
  - REGULAR: 4+ visits
  - MEMBER: Completed membership process
  - VOLUNTEER: Serving in ministry
  - STAFF: Church employee
- [ ] **Follow-up Dashboard** - See who needs outreach this week
  - First-time visitors from last Sunday (needs welcome message)
  - Returning visitors who haven't been back in 2 weeks
  - Members who haven't attended in 1 month
  - Auto-create follow-up tasks
- [ ] **Notes & History** - Track all interactions with each visitor/member
  - Log phone calls, emails, visits
  - Prayer requests history
  - Serving history
  - Giving history (read-only from external system)

### Data Management

- [ ] **Merge Duplicates** - Combine multiple records for same person
  - Side-by-side comparison of duplicate profiles
  - Choose which data to keep from each record
  - Preserve history from both records
- [ ] **Bulk Actions** - Tag multiple members, export lists, send bulk messages
  - Select multiple members in table
  - Apply tags (small group, ministry team, etc.)
  - Export to CSV for mail merge
  - Trigger bulk SMS/email campaigns (via GHL)
- [ ] **Custom Fields** - Church-specific data (small group, serving team, etc.)
  - Define custom field types (text, dropdown, date, yes/no)
  - Per-organization custom fields
  - Show in member profiles and table columns

---

## 🎯 Success Metrics (Phase 4)

### Visitor Retention

- **50% first-time → returning conversion** (up from 20-30% typical)
- **80% follow-up rate** with first-time visitors (up from 30%)
- **Response within 24 hours** to first-time visitor welcome

### Member Engagement

- **500+ members in directory** (pilot church target)
- **10+ follow-ups completed per week** (automated task creation)
- **90% duplicate detection accuracy** (prevent multiple records)

### System Adoption

- **100% connect cards** auto-create member profiles
- **Staff use dashboard daily** to see who needs follow-up
- **Membership pipeline visible** at weekly staff meetings

---

## 🔮 Future Enhancements (Phase 5+)

### Attendance Tracking

- [ ] **Check-in Integration** - Track who attended each Sunday
- [ ] **Attendance Trends** - Identify declining attendance before they leave
- [ ] **At-Risk Member Alerts** - Flag members with 3+ week absence

### Small Groups & Ministry Teams

- [ ] **Small Group Assignment** - Track which small group member belongs to
- [ ] **Ministry Team Roster** - Link members to serving teams
- [ ] **Leadership Tracking** - Identify leaders and leadership pipeline

### Giving Integration

- [ ] **Read-Only Giving Data** - Link to external giving platform
- [ ] **Generosity Trends** - Identify new givers, lapsed givers
- [ ] **Member Stewardship** - Track giving history (privacy-protected)

---

## 🔗 Integration Points

### Connect Cards → Members

- Connect card scanning auto-creates/updates member profiles
- Duplicate detection during connect card review
- First visit date captured from connect card
- Prayer requests linked to member profile

### Members → Volunteer Management

- Member status includes VOLUNTEER type
- Track which ministries member is serving in
- Background check status visible in member profile
- Skills and certifications linked to member

### Members → Prayer Requests

- All prayer requests linked to submitter's member profile
- Prayer history visible in member profile
- Follow-up on answered prayers tracked

### Members → Communication (GHL)

- Sync member data to GoHighLevel for SMS/email campaigns
- Automated welcome series for first-time visitors
- Follow-up sequences based on member status
- Birthday/anniversary messages

---

## 📚 Database Schema (Existing - Ready to Use)

**ChurchMember Model:** (Already in Prisma schema)

- Basic info: firstName, lastName, email, phone
- Member type enum: VISITOR | RETURNING | MEMBER | VOLUNTEER | STAFF
- Dates: firstVisitDate, lastAttendance, createdAt, updatedAt
- Relationships: connectCards[], prayerRequests[], volunteerAssignments[]
- Custom data: tags (string[]), notes (string), customFields (JSON)
- Multi-tenant: organizationId, locationId

**No schema changes needed** - ChurchMember model is production-ready.

---

## 🚧 Implementation Plan (Phase 4)

### Step 1: Member Directory (2-3 weeks)

- Build TanStack Table for member list
- Search, filter, sort functionality
- Member profile page (view-only)
- CSV import wizard

### Step 2: N2N Workflow (2-3 weeks)

- Auto-update member status based on visit frequency
- Follow-up dashboard (who needs outreach this week)
- Notes and interaction logging
- Pipeline visualization

### Step 3: Data Management (1-2 weeks)

- Duplicate detection and merge UI
- Bulk actions (tagging, export)
- Custom fields management

### Step 4: Integration & Testing (1 week)

- Connect card → member auto-creation
- E2E tests for member lifecycle
- Pilot church testing and feedback

---

## 📖 Related Documentation

- **Database Schema**: `/prisma/schema.prisma` - ChurchMember model
- **Project Roadmap**: `/docs/PROJECT.md` - Timeline and phases
- **Connect Cards**: `/docs/features/connect-cards/vision.md` - Integration point
- **Volunteer**: `/docs/features/volunteer/vision.md` - Integration point

---

**Last Updated:** 2025-12-17 (Planning Phase - Not Yet Built)
