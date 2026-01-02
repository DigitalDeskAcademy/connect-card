# Pilot Church Demo Briefing - December 2025

**Date:** 2025-12-15
**Status:** Planning Complete - Ready for Implementation
**Next Meeting:** ~January 2026
**Audience:** All worktrees - read this to understand current priorities

---

## Executive Summary

Demo with pilot church was **positive**. They validated our core value prop (10-15 hours/week saved per location) and identified deduplication as the **biggest selling point**. Planning Center API research confirms we can achieve full automation with workflow triggering via list-based integration.

**Key Outcomes:**

- ✅ Time savings validated (10-15 hrs/week per location)
- ✅ Deduplication is THE selling point
- ✅ Planning Center integration path confirmed (API + list-based workflow triggers)
- ⬇️ Prayer feature deprioritized (PC handles it)
- 🆕 Volunteer event tracking requested (fills PC gap)
- 🆕 Keyword detection requested (campaign tracking)

---

## Part 1: Raw Demo Feedback

### What They Liked

| Feedback                                                     | Implication                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **10-15 hours/week saved per location** in data entry        | Core value prop validated - this is real ROI                                 |
| **Deduplication capability**                                 | BIGGEST SELLING POINT - they have 20k entries but ~10k actual unique members |
| Ability to **vet entries before pushing** to Planning Center | They want clean data, not more duplicates                                    |
| Only push **truly unique changes/additions**                 | Quality over quantity                                                        |

### What They Need

| Request                  | Details                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Volunteer management** | Planning Center's volunteer module is too complex - they don't use it                                      |
| **Event tracking**       | How many volunteers needed vs signed up                                                                    |
| **Quick capacity view**  | At-a-glance "what do we have vs what we need"                                                              |
| **Easy outreach**        | Quick way to message volunteers about events                                                               |
| **Keyword detection**    | Church announces trigger words at services (e.g., "write 'impacted' on your card") - need to extract these |

### What They Don't Need

| Feature               | Reason                                |
| --------------------- | ------------------------------------- |
| **Prayer management** | Planning Center handles this for them |
| Prayer team workflows | Already have process in PC            |
| Prayer analytics      | Not a priority                        |

### Edge Cases Identified

| Issue                     | Details                                                   |
| ------------------------- | --------------------------------------------------------- |
| **Couples sharing email** | Same email for John & Jane Smith - need handling strategy |
| **Duplicate entries**     | 20k database entries, only ~10k unique people             |

---

## Part 2: Product Positioning

### Where We Sit in the Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│  THE SUNDAY MORNING PROBLEM                                          │
│                                                                      │
│  Physical World              →    Digital World                      │
│  ──────────────────────────────────────────────────────────────     │
│  Handwritten cards           →    Clean database entries             │
│  Messy data                  →    Deduplicated records               │
│  Volunteer interest          →    Ready-to-schedule volunteer        │
│  Campaign keywords           →    Actionable follow-up lists         │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│  THIS GAP IS OURS                                                    │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│  Planning Center is great AFTER data is in the system.               │
│  We solve GETTING it into the system cleanly.                        │
└─────────────────────────────────────────────────────────────────────┘
```

### We Are NOT a ChMS Replacement

| What We Do                | What Planning Center Does |
| ------------------------- | ------------------------- |
| Scan physical cards       | Store member records      |
| AI handwriting extraction | Member database           |
| Vet & deduplicate         | Volunteer scheduling      |
| Clean data export         | Groups & check-in         |
| Simple event capacity     | Complex workflows         |
| Campaign keyword tracking | Prayer management         |

**We're the bridge, not the destination.**

### Why This Is Viable

1. **No one else does AI connect card scanning well** - genuinely novel
2. **Data quality is universal pain** - every church has duplicate problems
3. **ROI math works** - 10-15 hrs/week × $15/hr = $600-900/month labor savings per location
4. **Volunteer gap is real** - PC module too complex, churches don't use it

---

## Part 3: Planning Center Integration Strategy

### The Critical Question (Answered)

> "When we push data to Planning Center via API, does it trigger the same workflows as their digital connect card form submission?"

**Answer:** Not directly, BUT we can trigger workflows via list-based automation.

### API Research Findings

| Capability                         | Status          |
| ---------------------------------- | --------------- |
| Create people via API              | ✅ Works        |
| Update people via API              | ✅ Works        |
| Query for duplicates               | ✅ Works        |
| Submit forms via API               | ❌ Not possible |
| Trigger workflows directly         | ❌ Not possible |
| Add people to lists via API        | ✅ Works        |
| List automation triggers workflows | ✅ Works        |

**The workaround IS the solution:** Add person to list → List automation triggers workflow

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  CHURCH CONNECT HUB                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  1. Scan card                                                        │
│  2. AI extracts data                                                 │
│  3. Staff vets & approves                                           │
│  4. Click "Push to Planning Center"                                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PLANNING CENTER API                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Step 1: Query - Does this person already exist?                     │
│          GET /people?where[search_name]=John%20Doe                   │
│          GET /emails?where[address]=john@email.com                   │
│          → If match: Update existing                                 │
│          → If no match: Create new                                   │
│                                                                      │
│  Step 2: POST /people/v2/people                                      │
│          → Creates/updates person record                             │
│          → Use remote_id to track our ConnectCard ID                 │
│                                                                      │
│  Step 3: POST /lists/{list_id}/list_results                         │
│          → Adds person to "Connect Card Intake" list                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PLANNING CENTER AUTOMATION (configured by church, one-time)         │
├─────────────────────────────────────────────────────────────────────┤
│  List: "Connect Card Intake"                                         │
│  Automation: When person added → Trigger "Welcome Workflow"          │
│                                                                      │
│  Result: Person gets welcome email, tags, follow-up tasks            │
│          EXACTLY like native form submission                         │
└─────────────────────────────────────────────────────────────────────┘
```

### What We Get Access To

**We request `people` scope ONLY:**

| We CAN Access         | We CANNOT Access       |
| --------------------- | ---------------------- |
| People/members        | 💰 Giving/donations    |
| Contact info          | 📅 Services scheduling |
| Lists                 | ✅ Check-ins           |
| Tags                  | 👥 Groups              |
| Workflows (read-only) | 📆 Calendar            |

### What The Church Needs To Do (One-Time, 5 min)

1. Click "Connect to Planning Center" in our settings
2. Approve OAuth connection in Planning Center
3. Select their intake list (or create one)
4. Configure list automation in PC to trigger their workflow

**After setup, everything is automatic.**

### Trust & Security Answers

| Concern                           | Our Answer                                                              |
| --------------------------------- | ----------------------------------------------------------------------- |
| "You'll see all our member data"  | We query to deduplicate, don't bulk download or store their database    |
| "Can you modify/delete our data?" | We create/update only. Cannot delete. All writes are staff-approved.    |
| "What if you get hacked?"         | OAuth tokens encrypted. No passwords stored. They can revoke instantly. |
| "Who can see our data?"           | Multi-tenant isolation. Their data is theirs only.                      |
| "Can we revoke access?"           | Yes, instantly, from our app or Planning Center settings                |

---

## Part 4: Feature Priority Matrix

### What To Build (Priority Order)

```
1. 🔴 CRITICAL   - Planning Center API Integration
2. 🔴 CRITICAL   - Deduplication Enhancement
3. 🟢 QUICK WIN  - Keyword Detection
4. 🟡 HIGH VALUE - Volunteer Event Tracking
5. ⬇️ DEPRIORITIZE - Prayer Feature Enhancements
```

### Detailed Breakdown

#### 1. Planning Center API Integration (CRITICAL)

**Why:** Enables full automation, real deduplication against their actual database

| Task            | Description                             |
| --------------- | --------------------------------------- |
| OAuth 2.0 flow  | Connect to PC with proper scopes        |
| People API      | Create/update people                    |
| Duplicate query | Check if person exists before creating  |
| List API        | Add to intake list (triggers workflow)  |
| Settings UI     | Connect/disconnect, select list         |
| Setup guide     | Help churches configure list automation |

#### 2. Deduplication Enhancement (CRITICAL)

**Why:** BIGGEST SELLING POINT - they have 20k entries, only 10k unique

| Task                      | Description                                         |
| ------------------------- | --------------------------------------------------- |
| Fuzzy name matching       | Bob = Robert, typo tolerance                        |
| Multi-identifier matching | Email + phone + name                                |
| Shared email handling     | Flag for review when email matches but name differs |
| Export preview            | Show new/update/flagged breakdown                   |
| PC duplicate check        | Query Planning Center before creating               |

**Shared Email Strategy (Couples):**

- When email matches but name is significantly different
- Flag for staff review: "Same email as John Smith - same person?"
- Staff decides: Update existing OR Create new (different household member)

#### 3. Keyword Detection (QUICK WIN)

**Why:** Simple feature, shows responsiveness to feedback

| Task             | Description                                  |
| ---------------- | -------------------------------------------- |
| Update AI prompt | Detect standalone keywords at bottom of card |
| Add schema field | `detectedKeywords: String[]`                 |
| Review UI        | Show keywords as editable chips              |
| Filter           | "Has keyword" filter in connect cards table  |
| Export           | Include keywords column                      |

**Use Case:** Church says "Write 'coffee oasis' on your card" - we extract it.

#### 4. Volunteer Event Tracking (HIGH VALUE)

**Why:** Fills gap - they don't use PC's volunteer module (too complex)

| Feature           | Description                            |
| ----------------- | -------------------------------------- |
| Event creation    | "Sunday Kids Check-in - Dec 22"        |
| Capacity tracking | Need 5, have 3                         |
| Status view       | ✅ Full / ⚠️ Partial / 🔴 Empty        |
| Quick outreach    | Select volunteers, send invite via GHL |

**NOT building:** Full scheduling, shift management, time tracking (PC's job)

#### 5. Prayer Features (DEPRIORITIZE)

**Why:** Planning Center handles this for them

- Keep existing functionality stable
- No new development
- May revisit for churches not using PC

---

## Part 5: Implementation Roadmap

### Phase 1: Planning Center Integration (Weeks 1-2)

- OAuth connection flow
- People API integration
- List-based workflow triggering
- Settings UI for connection management

### Phase 2: Deduplication Enhancement (Weeks 2-3)

- Fuzzy name matching
- PC duplicate checking
- Shared email handling
- Enhanced export preview

### Phase 3: Keyword Detection (Week 3)

- AI prompt update
- Schema changes
- Review UI updates
- Filter and export

### Phase 4: Volunteer Events MVP (Weeks 4-5)

- Event data model
- Capacity tracking UI
- GHL outreach integration

---

## Part 6: Success Metrics

| Metric                          | Current                   | Target                    |
| ------------------------------- | ------------------------- | ------------------------- |
| Time savings                    | "Significant" (anecdotal) | 10-15 hrs/week measured   |
| Duplicate prevention            | Basic email matching      | 90%+ caught before export |
| PC workflow trigger rate        | N/A (no integration)      | 100% via list automation  |
| Volunteer event fill visibility | N/A (no feature)          | At-a-glance dashboard     |

---

## Part 7: For The Next Meeting (January 2026)

### What We'll Demo

1. **Planning Center Integration**

   - One-click OAuth connect
   - Real duplicate checking against their PC database
   - Push to PC with workflow triggering

2. **Enhanced Deduplication**

   - "This person already exists" warnings
   - Fuzzy name matching in action
   - Export preview showing new/update breakdown

3. **Keyword Detection**

   - AI extracting campaign keywords
   - Keywords visible in review UI
   - Filter by keyword

4. **Volunteer Event View** (if time permits)
   - Simple capacity dashboard
   - "Need 5, have 3" at-a-glance

### What We'll Say

> "We've integrated directly with Planning Center. When you approve a card:
>
> 1. We check if they already exist in YOUR Planning Center
> 2. We create or update their record
> 3. We add them to your intake list, triggering your existing workflows
>
> No re-entering data. No copy/paste. No duplicates. Your workflows fire automatically."

---

## Appendix: Technical Reference

### Planning Center API Details

- **Auth:** OAuth 2.0 (register at `api.planningcenteronline.com/oauth/applications`)
- **Base URL:** `https://api.planningcenteronline.com/people/v2`
- **Rate Limits:** 100 requests per 20 seconds (~300/minute)
- **Format:** JSON:API 1.0 specification

### Key Endpoints

```
# Query for existing person
GET /people?where[search_name]=John%20Doe
GET /emails?where[address]=john@email.com

# Create person
POST /people
{
  "data": {
    "type": "Person",
    "attributes": {
      "first_name": "John",
      "last_name": "Doe",
      "remote_id": "our-connect-card-id"
    }
  }
}

# Add to list (triggers workflow)
POST /lists/{list_id}/list_results
{
  "data": {
    "type": "ListResult",
    "relationships": {
      "person": { "data": { "type": "Person", "id": "person_id" } }
    }
  }
}
```

### Webhook Events Available

| Event                 | Available? |
| --------------------- | ---------- |
| `person.created`      | ✅ Yes     |
| `person.updated`      | ✅ Yes     |
| `list_result.created` | ✅ Yes     |
| `form.submitted`      | ❌ No      |
| `workflow.triggered`  | ❌ No      |

---

**Document Owner:** Main Worktree
**Last Updated:** 2025-12-15
**Questions:** Coordinate in main worktree
