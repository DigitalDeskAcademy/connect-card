# Volunteer Management Feature - Vision & Roadmap

**Last Updated:** 2025-11-21
**Status:** Phase 2 In Progress (50% complete)
**Owner:** Church Connect Card Team

**📋 AI Session Handoff:** See `/docs/AI_HANDOFF.md` for current implementation status and next steps

---

## 🎯 The Differentiator

**Our competitive advantage is not volunteer management - it's automated volunteer onboarding from connect cards.**

### The Problem

Churches struggle with volunteer onboarding:

- Paper connect cards with "I want to volunteer" checked sit in piles for weeks
- Staff manually email volunteers with background check forms
- Volunteers get lost in the shuffle between sign-up and first shift
- No centralized tracking of onboarding status
- Slow response = volunteers lose interest and never serve

**Industry Benchmark:** Planning Center, Breeze, Church Community Builder have volunteer **directories** but require manual data entry.

**Our Edge:** Connect Card AI Vision → Automated Onboarding Pipeline

---

## 🚀 The Workflow (Core User Journey)

### Step 1: Volunteer Signs Up (Automated)

1. Person fills out **paper connect card** at church
2. Checks box: "I want to volunteer in: [Kids Camp / Greeter / Worship Team]"
3. Staff scans connect card with phone camera
4. **Claude Vision AI extracts**:
   - Name, email, phone
   - "I want to volunteer" flag
   - Ministry categories checked

### Step 2: Shows in "Pending Volunteers" Tab (Staff Workflow)

- New volunteer appears in **"Pending Volunteers"** tab
- Staff sees: Name, Contact Info, Requested Categories, Date Submitted
- **Action buttons:**
  - "Process Volunteer" - Opens processing dialog
  - "Assign Category" - Dropdown of ministry teams
  - "Send Onboarding Package" - Triggers automation

### Step 3: Automated Onboarding (The Magic)

When staff clicks "Send Onboarding Package", system automatically:

1. **Sends email with:**
   - Welcome message personalized to their ministry
   - Background check form link (if required for that ministry)
   - Calendar invite to next team meeting/training
   - Link to volunteer portal for availability
2. **Updates status** from PENDING → IN_PROGRESS
3. **Creates calendar reminders** for staff follow-up
4. **Moves volunteer** to "All Volunteers" directory

### Step 4: Background Check Tracking

- Status automatically updates when background check submitted
- Expiration reminders (background checks expire after 2-3 years)
- Flagged checks alert ministry leaders

---

## 🏗️ Feature Architecture

### Shared Component Pattern (IMPORTANT)

**Problem:** We need similar table UIs for Members, Staff (Team), and Volunteers.

**Solution:** Create reusable `MemberDataTable` component (similar to prayer table pattern).

**Shared Features Across All Three:**

- Search by name/email
- Checkbox selection
- Export to CSV (PCO/Breeze format)
- Pagination
- Filter by status/category
- Empty states
- Row click → Detail page

**Component Locations:**

```
/components/dashboard/shared/
├── member-data-table.tsx       # Reusable table (Members, Staff, Volunteers)
├── member-columns.tsx          # Shared column patterns
└── csv-export-button.tsx       # Reusable export logic
```

**Usage:**

```typescript
// Members view
<MemberDataTable
  data={members}
  type="member"
  showColumns={["name", "email", "phone", "status"]}
/>

// Staff view
<MemberDataTable
  data={staff}
  type="staff"
  showColumns={["name", "email", "role", "location"]}
/>

// Volunteers view (current)
<MemberDataTable
  data={volunteers}
  type="volunteer"
  showColumns={["name", "email", "phone", "backgroundCheck", "categories"]}
/>
```

**Benefits:**

- ✅ Write table logic once, use 3 times
- ✅ Consistent UX across all member views
- ✅ Export functionality shared
- ✅ Easier to maintain/update
- ✅ Follows DRY principle

**Note:** Build this when implementing Member Management feature (Phase 4). Current volunteer table can be refactored to use this pattern.

---

### Two-Tab Structure

#### Tab 1: "Pending Volunteers" (The Differentiator)

**Purpose:** Process new volunteer signups from connect cards

**Table Columns:**

- [ ] Checkbox (bulk selection)
- Name + Email
- Phone
- Requested Categories (Kids Camp, Greeter, etc.)
- Date Submitted
- Actions: "Process" button

**Features:**

- ✅ Clean, focused workflow for processing
- ✅ Bulk actions: "Process Selected" (assign category + send package to multiple)
- ✅ Filter by requested category
- ✅ Sort by date (oldest first = longest waiting)
- ✅ Empty state: "No pending volunteers" with illustration

**Success Metric:** Time from connect card scan → onboarding email sent < 24 hours

---

#### Tab 2: "All Volunteers" (Directory)

**Purpose:** Searchable directory of all processed volunteers

**Table Columns:**

- [ ] Checkbox (bulk selection)
- Name + Email
- Phone
- Background Check Status (Badge with color coding)
- Categories (Tags: Kids Camp, Greeter, etc.)
- Last Served (Date)

**Features:**

- ✅ Search by name
- ✅ Filter by category (multi-select dropdown)
- ✅ Filter by background check status
- ✅ Export to CSV (PCO/Breeze compatible format)
- ✅ Bulk actions: "Send Background Check Reminder" to selected
- ✅ Click row → Volunteer detail page

**Export Format (CSV - Industry Standard):**

```csv
First Name, Last Name, Email, Phone, Background Check Status, Background Check Date, Background Check Expiration, Categories, Start Date, Emergency Contact Name, Emergency Contact Phone
```

Matches Planning Center Online and Breeze ChMS import format.

---

## 📋 Background Check Workflow

**Industry Research:** Checkr, Sterling, Planning Center Services

### Status Flow

```
NOT_STARTED → (staff clicks "Send Info") → IN_PROGRESS → CLEARED
                                                ↓
                                             FLAGGED (requires review)

CLEARED → (2 years later) → EXPIRED → (send renewal) → IN_PROGRESS
```

### "Send Background Check Info" Action

**When:** Staff clicks button in NOT_STARTED or EXPIRED status

**What Happens:**

1. System sends **automated email** to volunteer:
   - Instructions on how to submit background check
   - Link to background check provider (church-specific)
   - What documents they need (ID, authorization form)
   - Deadline (7 days to complete)
2. Status changes to **IN_PROGRESS**
3. Volunteer receives follow-up reminder after 3 days if not submitted

**Future Enhancement (Phase 2):**

- Integration with Checkr/Sterling API
- Automatic status updates via webhook
- Background check costs tracked in billing

---

## 🎨 UI/UX Standards

### Visual Design

- **Match prayer table pattern**: Clean card layout, integrated create button, checkbox selection
- **Bottom border on table**: Prevents "open" look on last row
- **Horizontal scroll**: When columns overflow (responsive design)
- **Color-coded badges**:
  - CLEARED: Green
  - IN_PROGRESS: Blue
  - NOT_STARTED: Gray outline
  - FLAGGED: Red
  - EXPIRED: Orange

### Industry Patterns We Follow

- **Planning Center Online**: Tab-based navigation, clean table design
- **Breeze ChMS**: Simple bulk actions, CSV export
- **Church Community Builder**: Category filtering, status badges

---

## 🔄 Automation Triggers (Future)

**Phase 1 (Current):** Manual "Send Onboarding Package" button

**Phase 2 (Planned - GHL Integration):**

- Auto-send onboarding email 1 hour after connect card scan
- Send reminder if volunteer doesn't respond in 48 hours
- Auto-invite to calendar events based on availability
- SMS check-in before first shift

**Phase 3 (Planned - AI Matching):**

- AI suggests best ministry fit based on skills/experience
- Predict volunteer burnout risk
- Auto-schedule based on availability + team needs

---

## 📊 Success Metrics

### Phase 1 Goals (MVP)

- [ ] 90% of connect card volunteers processed within 24 hours
- [ ] 80% of volunteers receive onboarding package automatically
- [ ] 50% reduction in staff time spent on volunteer coordination
- [ ] Background check tracking for 100% of volunteers

### Phase 2 Goals (Automation)

- [ ] 95% of volunteers auto-onboarded (no manual trigger)
- [ ] 70% background check completion rate (vs 30% industry average)
- [ ] 60% volunteer retention at 6 months (vs 40% industry average)

---

## 🚧 Development Phases

### ✅ Phase 1: Foundation (COMPLETE)

- [x] Database schema (Volunteer, Category, Skills tables)
- [x] Prayer table UI pattern adopted
- [x] Basic table with name, email, phone, background check
- [x] Checkbox selection
- [x] Create volunteer dialog

### 🔄 Phase 2: Two-Tab Structure (IN PROGRESS)

- [ ] Add tab navigation (Pending / All Volunteers)
- [ ] Pending Volunteers tab with "Process" workflow
- [ ] Category filtering (multi-select dropdown)
- [ ] Export to CSV (PCO/Breeze format)
- [ ] Background check status actions
- [ ] Bottom border + horizontal scroll fix

### 📅 Phase 3: Automated Onboarding (PLANNED)

- [ ] "Send Onboarding Package" action
- [ ] Email templates (background check, calendar invite, welcome)
- [ ] Background check form integration
- [ ] Calendar event creation
- [ ] Status workflow automation

### 📅 Phase 4: Detail Pages (PLANNED)

- [ ] Volunteer profile page (click row → detail view)
- [ ] Edit volunteer information
- [ ] View serving history
- [ ] Track background check documents
- [ ] Emergency contact management

### 📅 Phase 5: GHL Integration (PLANNED - Feb 2026)

- [ ] Auto-send onboarding emails via GHL
- [ ] SMS reminders for shifts
- [ ] Campaign templates for volunteer engagement
- [ ] Two-way sync with GHL contacts

---

## 🎯 Key Differentiators vs Competition

| Feature                   | Planning Center | Breeze ChMS     | Church Connect Card    |
| ------------------------- | --------------- | --------------- | ---------------------- |
| Connect card AI scanning  | ❌ Manual entry | ❌ Manual entry | ✅ Automated           |
| Automated onboarding      | ❌ Manual       | ❌ Manual       | ✅ One-click           |
| Background check tracking | ✅ Yes          | ✅ Yes          | ✅ Yes + Auto-expire   |
| Category filtering        | ✅ Yes          | ✅ Yes          | ✅ Yes                 |
| CSV export                | ✅ Yes          | ✅ Yes          | ✅ Yes (compatible)    |
| Processing workflow       | ❌ No           | ❌ No           | ✅ Pending → Processed |
| Calendar integration      | ⚠️ Manual       | ⚠️ Manual       | ✅ Auto-invite         |

**Our Edge:** Connect Card → Onboarding happens in minutes, not weeks.

---

## 📤 Export Queue Architecture (DECIDED)

**Approach:** Pending Export Queue (staff-controlled batch exports)

### How It Works

**1. Connect Card Processing (Primary Entry Point):**

- Staff reviews connect card in Connect Cards feature
- Assigns volunteer categories during review
- Clicks "Save & Close"
- System:
  - Creates/updates ChurchMember record
  - Creates Volunteer record if "wants to volunteer" checked
  - **Adds to "Pending Export" queue** (new flag or table)

**2. Export Dashboard (in Connect Cards feature):**

- Badge shows count: "23 members pending export"
- Click "Review Pending Exports" button
- Table shows all members waiting to be exported
- Staff can:
  - Remove duplicates
  - Fix errors before export
  - Select which to export (checkbox selection)
- Click "Export to CSV" → downloads file
- **Marks exported members** (prevents re-export)

**3. CSV Format (PCO/Breeze Compatible):**

```csv
First Name, Last Name, Email, Phone, Member Type, Background Check Status, Background Check Date, Background Check Expiration, Volunteer Categories, Start Date, Emergency Contact Name, Emergency Contact Phone, Address, Notes
```

**4. Re-export Protection:**

- Track `lastExportedAt` timestamp on ChurchMember
- Don't include already-exported members in queue
- Staff can "Force Re-export" if needed (checkbox option)

**5. Duplicate Detection:**

- When creating ChurchMember from connect card, check for existing by email/phone
- If found → **Update** existing record (don't create duplicate)
- If not found → Create new record
- Always add to export queue (even if updated)

**Benefits:**

- ✅ Staff reviews batch before sending (catch errors)
- ✅ Efficient: Process 50 cards, export once
- ✅ Flexible timing: Daily, weekly, or on-demand
- ✅ Prevents duplicate exports
- ✅ Clear visibility into what's being exported

---

## 💡 Open Questions (To Resolve)

1. **Tab Names:** "Pending Volunteers" / "All Volunteers" vs "New Signups" / "Directory"?
2. **Default tab:** Which tab should load first? (Pending has more urgency)
3. **Pending filter:** Should it auto-filter to show only volunteers from last 30 days?
4. ~~**Export scope:** Export all volunteers or only filtered/selected?~~ ✅ RESOLVED: Pending export queue with staff control
5. **Background check provider:** Which service should we integrate with first? (Checkr, Sterling, Ministry Safe)

---

## 📚 References

**Industry Research:**

- Planning Center Services: Volunteer scheduling model
- Breeze ChMS: CSV export format
- Church Community Builder: Category management
- Checkr: Background check automation API
- Sterling: Church background check best practices

**Related Docs:**

- `/docs/features/connect-cards/vision.md` - Connect card AI extraction
- `/docs/features/member-management/vision.md` - Member directory (similar pattern)
- `/docs/ROADMAP.md` - Overall product roadmap

---

**Next Steps:**

1. Answer open questions with user
2. Build two-tab structure with URL-based navigation
3. Implement Pending Volunteers workflow
4. Add category filtering to All Volunteers
5. Create CSV export action
6. Build "Send Background Check Info" automation
