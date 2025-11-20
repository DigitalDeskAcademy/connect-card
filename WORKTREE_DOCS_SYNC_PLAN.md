# Worktree Documentation Sync Plan

**Date:** 2025-11-16
**Purpose:** Sync new SSOT documentation structure from main → volunteer & prayer worktrees

---

## 📊 Current State Analysis

### Main Branch (Source of Truth)

**New Structure:**

```
docs/
├── README.md                    # ✨ NEW - Navigation index
├── ROADMAP.md                   # 🔄 REFACTORED (455→139 lines, 69% reduction)
├── STATUS.md                    # 🔄 REFACTORED (543→204 lines, 62% reduction)
├── features/                    # ✨ NEW DIRECTORY
│   ├── connect-cards/vision.md
│   ├── member-management/vision.md
│   ├── prayer-management/vision.md
│   └── volunteer-management/vision.md
├── essentials/
│   ├── development.md           # 🔄 UPDATED (link to archived worktree-setup.md)
│   └── [other files unchanged]
└── technical/
    └── [files unchanged]
```

**Files Removed/Archived (moved to .archive/docs/):**

- ❌ DOCUMENTATION_GUIDE.md
- ❌ PROJECT_OVERVIEW.md
- ❌ PRAYER_MANAGEMENT_PLAN.md
- ❌ worktree-database-setup.md
- ❌ worktree-setup.md
- ❌ volunteer-feature-roadmap.md

**New Commits:**

- 89c20b2 - feat: bulletproof documentation enforcement (feature-wrap-up Stage 8)
- 0fcfa00 - docs: harsh refactor and archival (32% reduction)
- 4ce03ea - docs: lightweight dashboard refactoring (SSOT pattern)

---

### Volunteer Worktree (feature/volunteer-management)

**Current State:**

```
docs/
├── DOCUMENTATION_GUIDE.md       # ⚠️ WILL BE ARCHIVED
├── PRAYER_MANAGEMENT_PLAN.md    # ⚠️ WILL BE ARCHIVED
├── PROJECT_OVERVIEW.md          # ⚠️ WILL BE ARCHIVED
├── ROADMAP.md                   # ⚠️ UNMODIFIED (clean)
├── STATUS.md                    # ⚠️ MODIFIED (minor change)
├── volunteer-feature-roadmap.md # ⚠️ WILL BE ARCHIVED
├── worktree-database-setup.md   # ⚠️ WILL BE ARCHIVED
├── worktree-setup.md            # ⚠️ WILL BE ARCHIVED
├── essentials/
├── technical/
└── volunteer/                   # ⚠️ VOLUNTEER-SPECIFIC (preserved?)
```

**Modified Files:**

- `docs/STATUS.md` - Changed "6 locations" → "5 locations" (line 11)

**Untracked Files:**

- `public/prayer_request_3.png` (not docs-related)

**Conflict Risk:** 🟢 **LOW**

- Only 1 line modified in STATUS.md
- No ROADMAP.md changes
- All other changes are new files or deletions

---

### Prayer Worktree (feature/prayer-management)

**Current State:**

```
docs/
├── DOCUMENTATION_GUIDE.md       # ⚠️ WILL BE ARCHIVED
├── PRAYER_MANAGEMENT_PLAN.md    # ⚠️ WILL BE ARCHIVED
├── PROJECT_OVERVIEW.md          # ⚠️ WILL BE ARCHIVED
├── ROADMAP.md                   # ⚠️ MODIFIED (substantial)
├── STATUS.md                    # ⚠️ MODIFIED (substantial)
├── volunteer-feature-roadmap.md # ⚠️ WILL BE ARCHIVED
├── worktree-database-setup.md   # ⚠️ WILL BE ARCHIVED
├── worktree-setup.md            # ⚠️ WILL BE ARCHIVED
├── essentials/
├── technical/
└── volunteer/
```

**Modified Files:**

1. **docs/STATUS.md** - Added two completion entries:

   - "Prayer Management E2E Testing ✅ COMPLETED (Nov 16, 2025)" (33 lines)
   - "Workspace Color Persistence Fix ✅ COMPLETED (Nov 16, 2025)" (27 lines)
   - Modified "E2E Test Suite" line (10 tests → 8 tests)

2. **docs/ROADMAP.md** - Updated prayer management section:
   - Changed "10 comprehensive security and workflow tests" → "8 comprehensive E2E tests (PR #27) covering..."

**Conflict Risk:** 🟡 **MEDIUM**

- Substantial changes to STATUS.md (60+ lines added)
- Changes to ROADMAP.md (prayer section)
- Both files were refactored in main (moved content to feature visions)

---

## 🔮 Expected Conflicts

### Volunteer Worktree

**1. docs/STATUS.md**

- **Conflict Location:** Line 11
- **Main:** "1 pilot church (6 locations)"
- **Volunteer:** "1 pilot church (5 locations)"
- **Resolution:** Accept volunteer's version (5 locations is more accurate)

**2. New Files/Directories**

- **No Conflict:** docs/README.md (new in main)
- **No Conflict:** docs/features/ (new in main)

**3. Archived Files**

- **Action Required:** Delete old files manually or via merge
  - DOCUMENTATION_GUIDE.md
  - PROJECT_OVERVIEW.md
  - PRAYER_MANAGEMENT_PLAN.md
  - worktree-database-setup.md
  - worktree-setup.md
  - volunteer-feature-roadmap.md

**4. docs/volunteer/ Directory**

- **Status:** Exists in volunteer worktree but NOT in main
- **Resolution:** **PRESERVE** - This is volunteer-specific documentation
- **Action:** Keep docs/volunteer/ in volunteer worktree only

---

### Prayer Worktree

**1. docs/STATUS.md** ⚠️ **HIGH CONFLICT RISK**

**Section:** Prayer Management (lines 107-140 in prayer worktree)

**Main Version (Refactored - Lightweight Dashboard):**

```markdown
### Prayer Requests ✅ COMPLETE

**Multi-tenant prayer request tracking with security isolation**

- TanStack Table UI with privacy controls
- Auto-categorization (8 categories) and sensitive keywords
- E2E test suite (8 tests) covering multi-tenant isolation

**See `/docs/features/prayer-management/vision.md` for full details**
```

**Prayer Version (Detailed Status):**

```markdown
### Prayer Requests ✅ COMPLETE

- ✅ Database schema (PrayerRequest model with JSONB metadata)
- ✅ Data access layer with multi-tenant scoping (`/lib/data/prayer-requests.ts`)
- ✅ TanStack Table UI with search, filtering, sorting, pagination
- ✅ Privacy controls (Staff can only see public + assigned private requests)
- ✅ Auto-categorization (8 categories) and sensitive keyword detection
- ✅ E2E test suite (8 test cases covering multi-tenant isolation, privacy controls, and batch workflow)
- ✅ Git worktree isolation with dedicated database (ep-long-feather-ad7s8ao0)
- ❌ Server actions (create, update, delete, assign, mark answered) - **NEXT PRIORITY**
- ❌ Detail view/dialog for viewing full prayer request
```

**Resolution Strategy:**

1. Accept main's lightweight summary (SSOT pattern)
2. Move prayer's detailed checklist → `/docs/features/prayer-management/vision.md`
3. Update vision.md with current status from prayer worktree

**Section:** Recent Completions (lines 254-305 in prayer worktree)

**Prayer Added:**

```markdown
### Prayer Management E2E Testing ✅ COMPLETED (Nov 16, 2025)

[33 lines of detailed completion notes]

### Workspace Color Persistence Fix ✅ COMPLETED (Nov 16, 2025)

[27 lines of detailed completion notes]
```

**Main Version:**

- Does NOT have these entries (main is older)

**Resolution Strategy:**

1. **PRESERVE prayer's completion entries** (they're newer)
2. Add to main's STATUS.md "Recent Completions" section
3. Keep lightweight format (3-5 bullets max per entry)

---

**2. docs/ROADMAP.md** ⚠️ **MEDIUM CONFLICT RISK**

**Section:** Phase 6 - Prayer & Volunteer Management (line 278 in prayer)

**Main Version (Refactored):**

```markdown
## 🔮 Future Phases

### Phase 6: Prayer & Volunteer Management (Mar 2026)

- **Prayer Requests** - See `/docs/features/prayer-management/vision.md`
- **Volunteer Onboarding** - See `/docs/features/volunteer-management/vision.md`
```

**Prayer Version (Detailed Checklist):**

```markdown
### Prayer Request System (Phase 5)

**✅ COMPLETED (Nov 2025)** - Prayer Management MVP

- [x] **Prayer Request Database** - Multi-tenant schema with privacy levels
- [x] **Prayer Request Table UI** - TanStack Table with search, filter, sort, pagination
- [x] **Status Management** - Pending, Approved, Answered, Archived workflow
- [x] **Privacy Levels** - Public, Members Only, Leadership, Private to Requester
- [x] **Assignment Workflow** - Assign requests to staff for pastoral care
- [x] **Multi-Tenant Security** - Organization-level data isolation tested
- [x] **E2E Test Suite** - 8 comprehensive E2E tests (PR #27) covering multi-tenant isolation, privacy controls, and batch workflow
- [x] **Worktree Development** - Isolated database branching (ep-long-feather-ad7s8ao0)
- [x] **Seed Data** - 30 test prayer requests with varied statuses and categories
```

**Resolution Strategy:**

1. Accept main's lightweight reference format
2. Move prayer's detailed checklist → `/docs/features/prayer-management/vision.md`
3. Update ROADMAP.md to mark Phase 5 as complete with vision link

---

## 🛠️ Merge Strategy

### Step-by-Step Process

#### Phase 1: Volunteer Worktree (Low Risk - Do First)

```bash
# 1. Navigate to volunteer worktree
cd /home/digitaldesk/Desktop/connect-card/volunteer

# 2. Fetch latest from main
git fetch origin main

# 3. Attempt merge
git merge origin/main

# 4. Handle STATUS.md conflict (if any)
# Accept volunteer's "5 locations" change

# 5. Verify new structure
ls -la docs/              # Should see README.md and features/
ls -la docs/features/     # Should see 4 vision files

# 6. Manual cleanup (if needed)
# Remove old files that weren't deleted by merge:
git rm docs/DOCUMENTATION_GUIDE.md
git rm docs/PROJECT_OVERVIEW.md
git rm docs/PRAYER_MANAGEMENT_PLAN.md
git rm docs/worktree-database-setup.md
git rm docs/worktree-setup.md
git rm docs/volunteer-feature-roadmap.md

# 7. Preserve volunteer-specific docs
# Keep docs/volunteer/ directory (don't delete)

# 8. Commit merge
git commit -m "merge: sync SSOT documentation from main

- New SSOT structure with feature visions
- Lightweight STATUS/ROADMAP dashboards
- Preserved volunteer-specific docs in docs/volunteer/"

# 9. Push to volunteer branch
git push origin feature/volunteer-management
```

---

#### Phase 2: Prayer Worktree (Medium Risk - Requires Manual Conflict Resolution)

```bash
# 1. Navigate to prayer worktree
cd /home/digitaldesk/Desktop/connect-card/prayer

# 2. Fetch latest from main
git fetch origin main

# 3. Attempt merge (WILL CONFLICT)
git merge origin/main

# Expected conflicts:
# - docs/STATUS.md (prayer section + recent completions)
# - docs/ROADMAP.md (prayer section)
```

**Conflict Resolution Steps:**

**A. docs/STATUS.md Conflict**

```bash
# 1. Open file in editor
code docs/STATUS.md

# 2. Find conflict markers (<<<<<<< HEAD)

# 3. Resolve "Prayer Requests" section:
#    - Accept main's lightweight format
#    - Remove prayer's detailed checklist
#    - Keep link to vision.md

# 4. Resolve "Recent Completions" section:
#    - Keep BOTH main's and prayer's entries
#    - Add prayer's two new completion entries at top
#    - Keep lightweight format (max 5 bullets)

# 5. Accept prayer's "5 locations" change (if present)
```

**Example Resolution (Recent Completions):**

```markdown
## 🎯 RECENT COMPLETIONS

### Prayer Management E2E Testing ✅ COMPLETED (Nov 16, 2025)

- E2E test suite (8 tests) covering multi-tenant isolation and privacy
- Database backend verified with isolated Neon branch
- Batch workflow and assignment tested

**See `/docs/features/prayer-management/vision.md` for full details**

### Workspace Color Persistence Fix ✅ COMPLETED (Nov 16, 2025)

- Untracked .vscode/settings.json from git in all worktrees
- Added to .gitignore to prevent future tracking
- Each worktree maintains local colors: Main=Red, Prayer=Blue, Volunteer=Green

### [Keep existing completions from main...]
```

**B. docs/ROADMAP.md Conflict**

```bash
# 1. Open file in editor
code docs/ROADMAP.md

# 2. Find conflict in Phase 6 section

# 3. Resolution:
#    - Accept main's lightweight format
#    - Add note that prayer is COMPLETE
#    - Keep link to vision.md
```

**Example Resolution:**

```markdown
### Phase 5: Prayer Management ✅ COMPLETE (Nov 2025)

**See `/docs/features/prayer-management/vision.md` for full details**

- Multi-tenant prayer request tracking
- Privacy levels and auto-categorization
- E2E test suite (8 comprehensive tests)
```

**C. Update Feature Vision with Prayer Details**

```bash
# 1. Open feature vision
code docs/features/prayer-management/vision.md

# 2. Add prayer's detailed checklist to "Current Status" section

# 3. Update "Planned Features" based on what's NOT done
#    (server actions, detail view/dialog)
```

**D. Complete Merge**

```bash
# 1. Stage resolved files
git add docs/STATUS.md
git add docs/ROADMAP.md
git add docs/features/prayer-management/vision.md

# 2. Remove old files
git rm docs/DOCUMENTATION_GUIDE.md
git rm docs/PROJECT_OVERVIEW.md
git rm docs/PRAYER_MANAGEMENT_PLAN.md
git rm docs/worktree-database-setup.md
git rm docs/worktree-setup.md
git rm docs/volunteer-feature-roadmap.md

# 3. Commit merge
git commit -m "merge: sync SSOT documentation from main with prayer updates

- New SSOT structure with feature visions
- Lightweight STATUS/ROADMAP dashboards
- Added prayer E2E testing completion (Nov 16)
- Added workspace color persistence fix
- Updated prayer-management/vision.md with current status"

# 4. Push to prayer branch
git push origin feature/prayer-management
```

---

## ✅ Verification Checklist

After merging both worktrees, verify:

### Volunteer Worktree

- [ ] docs/README.md exists
- [ ] docs/features/ directory exists with 4 vision files
- [ ] docs/ROADMAP.md is lightweight (139 lines)
- [ ] docs/STATUS.md is lightweight (204 lines)
- [ ] Old files removed (DOCUMENTATION_GUIDE.md, etc.)
- [ ] docs/volunteer/ directory preserved (if it contains volunteer-specific docs)
- [ ] Build passes: `pnpm build`
- [ ] No git conflicts remaining

### Prayer Worktree

- [ ] docs/README.md exists
- [ ] docs/features/ directory exists with 4 vision files
- [ ] docs/ROADMAP.md includes prayer completion
- [ ] docs/STATUS.md includes prayer E2E testing entry
- [ ] docs/features/prayer-management/vision.md updated with current status
- [ ] Old files removed (DOCUMENTATION_GUIDE.md, etc.)
- [ ] Build passes: `pnpm build`
- [ ] No git conflicts remaining

---

## 🚨 Expected Conflicts Summary

| Worktree  | File            | Conflict Type | Severity | Resolution                                  |
| --------- | --------------- | ------------- | -------- | ------------------------------------------- |
| Volunteer | STATUS.md       | Line change   | 🟢 LOW   | Accept volunteer's "5 locations"            |
| Prayer    | STATUS.md       | Section merge | 🟡 MED   | Keep both + move details to vision.md       |
| Prayer    | ROADMAP.md      | Section merge | 🟡 MED   | Accept main format + update vision.md       |
| Both      | Old files       | Deletion      | 🟢 LOW   | Remove manually with `git rm`               |
| Both      | New files/dirs  | Addition      | 🟢 NONE  | No conflict (new files auto-added by merge) |
| Volunteer | docs/volunteer/ | Preservation  | 🟢 LOW   | Keep directory (volunteer-specific)         |

---

## 📋 Post-Merge Tasks

1. **Update Main Branch**

   - Add prayer's completion entries to main's STATUS.md
   - Mark Phase 5 (Prayer) as complete in ROADMAP.md
   - Ensure feature visions are up-to-date

2. **Test Documentation**

   - Verify all links work (no 404s)
   - Check that vision files have current status
   - Ensure no duplicate information exists

3. **Clean Up Archive**

   - Verify archived files are in `.archive/docs/`
   - Check that archive README explains rationale

4. **Future Prevention**
   - New feature-wrap-up Stage 8 will enforce doc updates
   - Every PR must update STATUS, ROADMAP, feature visions
   - Validation checks prevent stale content

---

## 🎯 Success Criteria

- ✅ Both worktrees have SSOT documentation structure
- ✅ No duplicate information across STATUS, ROADMAP, feature visions
- ✅ All prayer-specific updates preserved in feature vision
- ✅ Volunteer-specific docs preserved in docs/volunteer/
- ✅ All old files archived or removed
- ✅ Builds pass in all worktrees
- ✅ No git conflicts remaining
- ✅ Documentation reflects reality (not outdated plans)

---

**Last Updated:** 2025-11-16
**Author:** Claude Code AI Assistant
**Reference:** Documentation SSOT Refactoring (Commits: 4ce03ea, 0fcfa00, 89c20b2)
