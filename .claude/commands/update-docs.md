---
description: Comprehensive documentation audit - sync, verify consistency, remove outdated content
argument-hint: [what changed]
model: claude-opus-4-5-20251101
---

# Update Documentation

Complete documentation audit: analyze changes, update all docs, detect contradictions, consolidate duplicates, remove obsolete content.

**Usage:** `/update-docs [what changed]`

**Note:** This is the documentation-only portion of `/feature-wrap-up`. Use this when you want to update docs without committing or creating PRs.

## Your Tasks:

### Phase 1: Analyze What Changed

**Step 1: Review Recent Changes**

```bash
git diff --stat
git status
```

Based on `$ARGUMENTS` and git diff, understand what was modified.

**Step 2: Categorize Changes**

- [ ] New routes/pages
- [ ] Server actions
- [ ] Database schema
- [ ] New components
- [ ] New patterns introduced
- [ ] Old patterns removed
- [ ] Integrations added/removed
- [ ] Bug fixes
- [ ] Refactoring

**Step 3: Read Changed Files**

Read the actual code to understand:

- What patterns were used
- What new patterns were introduced
- What old patterns were deprecated
- What architectural decisions were made

---

### Phase 2: Scan All Documentation

**Step 4: Read All Documentation Files**

```bash
find docs -name "*.md" -type f
```

Read completely:

- docs/STATUS.md
- docs/ROADMAP.md
- docs/essentials/coding-patterns.md
- docs/essentials/architecture.md
- docs/essentials/development.md
- docs/essentials/deployment.md
- docs/essentials/shadcn.md
- docs/technical/architecture-decisions.md
- docs/technical/integrations.md
- CLAUDE.md
- docs/FORK_SETUP_GUIDE.md
- docs/PROJECT_OVERVIEW.md
- All other .md files

---

### Phase 3: Detect Contradictions

**Step 5: Find Conflicting Guidance**

Search for contradictions:

- coding-patterns.md says one thing, CLAUDE.md says another
- STATUS.md shows complete, ROADMAP.md shows in progress
- architecture.md describes old pattern, code uses new pattern
- Examples that violate rules in same document

**For each contradiction:**

1. **Document it:**

   ```
   Contradiction #1:
   - File 1: coding-patterns.md line 245
     Says: "Use variant='padded' for tables"
   - File 2: CLAUDE.md line 128
     Says: "Use variant='default' for standard pages"
   - Issue: Unclear which variant for table pages
   ```

2. **Determine truth by checking actual code**

3. **Resolve:**
   - Update incorrect doc
   - Add clarifying decision tree if both correct in context

**Step 6: Create Contradiction Report**

```markdown
Contradictions Found: X

1. <Contradiction summary>
   - Resolution: <how fixed>
   - Files updated: <list>

2. <Another contradiction>
   - Resolution: <how fixed>
```

---

### Phase 4: Consolidate Duplicates

**Step 7: Find Duplicate Code Examples**

Search for repeated examples across docs:

- Server action template in multiple files
- PageContainer example repeated
- Authentication example duplicated
- Same pattern explained in 3 places

**Step 8: Consolidate**

For each duplicate:

1. **Choose canonical location:**

   - Detailed patterns → coding-patterns.md
   - Architecture → architecture.md
   - Quick reference → CLAUDE.md

2. **Keep ONE detailed version**

3. **Replace others with references:**
   ```markdown
   For full pattern, see [Server Actions](essentials/coding-patterns.md#server-actions-pattern).
   ```

**Step 9: Update Cross-References**

Add "See also" sections linking to canonical sources.

---

### Phase 5: Remove Obsolete Content

**Step 10: Identify Outdated Content**

Check for content that no longer applies:

- [ ] Features removed from codebase
- [ ] Old file paths (app/agency → app/church)
- [ ] Deprecated patterns (Named Slots)
- [ ] Removed dependencies
- [ ] Unused environment variables
- [ ] Old integrations

**Verify by checking codebase:**

```bash
# For each file path in docs, verify exists
find app -name "page.tsx" | grep agency  # Should be empty
grep -r "@header" app/  # Should be empty (Named Slots removed)
```

**Step 11: Remove or Archive**

For obsolete content:

- **Completely irrelevant:** Remove entirely
- **Historically relevant:** Move to archive section with "DEPRECATED" marker

**Example:**

```markdown
<!-- REMOVE -->

## Using Named Slots for Headers

...

<!-- REPLACE WITH -->

Headers now handled via /lib/navigation.ts config.
Named Slots pattern deprecated October 2025.
See [Navigation Pattern](essentials/coding-patterns.md#navigation-configuration-pattern).
```

**Step 12: Update File Path References**

```bash
grep -r "app/agency" docs/  # Find old paths
grep -r "@header" docs/     # Find Named Slots references
```

Update all obsolete paths to current structure.

**Step 13: Clean Up TODOs**

```bash
grep -r "TODO" docs/
grep -r "FIXME" docs/
```

For each TODO:

- Done? Remove and update doc
- Still relevant? Keep
- Obsolete? Remove

---

### Phase 6: Verify Pattern Compliance

**Step 14: Check Code Matches Documented Patterns**

For the changes, verify compliance:

**Multi-Tenant:**

- [ ] All queries filter by organizationId
- [ ] No cross-tenant leakage
- [ ] Multi-tenant fingerprinting

**Server Actions:**

- [ ] Rate limiting (Arcjet)
- [ ] Authentication checks
- [ ] ApiResponse type
- [ ] Zod validation
- [ ] Generic errors

**UI:**

- [ ] PageContainer correct variant
- [ ] No duplicate headers
- [ ] Navigation config updated
- [ ] Shadcn components used

**If not followed:**

- Document deviation in ADR
- Update pattern if intentional evolution
- Flag as technical debt

---

### Phase 7: Document New Patterns

**Step 15: Identify New Patterns**

Check if code introduces:

- [ ] New component pattern
- [ ] New PageContainer variant
- [ ] New server action approach
- [ ] New authentication pattern
- [ ] New database pattern
- [ ] New integration pattern

**Step 16: Document in coding-patterns.md**

For each new pattern:

````markdown
## 🎯 <Pattern Name>

### Overview

<What problem this solves>

### When to Use

<Decision criteria>

### Implementation

```typescript
// Real code from actual feature (include file path)
```
````

### Rules

✅ DO: <best practices>
❌ DON'T: <common mistakes>

### Example

<Real code with file:line reference>
```

**Step 17: Create ADR if Architectural Decision**

In docs/technical/architecture-decisions.md:

```markdown
## ADR-XXX: <Decision Title>

**Date:** <Month Year>
**Status:** Accepted

**Context:** <Why needed>
**Decision:** <What decided>
**Consequences:** <Trade-offs>
**Alternatives:** <Other options>
**Implementation:** <Where in code>
```

---

### Phase 8: Update All Relevant Docs

**Step 18: STATUS.md**

```markdown
## 🎯 RECENT COMPLETIONS

### <Feature> ✅ COMPLETED (<Month Year>)

- <What built>
- <Patterns used>
- PR #<number>
```

**Step 19: ROADMAP.md**

- Mark [x] complete
- Update metrics
- Add lessons learned

**Step 20: coding-patterns.md**

- Add new patterns
- Remove deprecated
- Update examples to current code
- Fix contradictions
- Consolidate duplicates

**Step 21: CLAUDE.md**

- Update priorities
- Add new rules
- Update examples
- Remove obsolete
- Fix contradictions

**Step 22: architecture.md**

- Update schema if changed
- Update auth flows
- Update integrations
- Remove obsolete

**Step 23: Other docs as needed**

- shadcn.md - Add used components
- integrations.md - Update APIs
- development.md - Update setup
- deployment.md - Update config

---

### Phase 9: Consistency Verification

**Step 24: Cross-Reference Check**

Verify consistency:

- [ ] Dates match (STATUS.md ↔ ROADMAP.md)
- [ ] Feature status aligned
- [ ] Pattern guidance consistent
- [ ] File paths exist
- [ ] Tech stack current

**Step 25: Validate Examples Are Real**

For every code example:

- [ ] File exists at path
- [ ] Code matches actual implementation
- [ ] Still follows current patterns
- [ ] No obsolete syntax

**Step 26: Check Links Work**

```bash
grep -r "\[.*\](.*\.md" docs/
```

Verify all internal links resolve.

---

### Phase 10: Generate Reports

**Step 27: Create Audit Report**

```markdown
# Documentation Audit Report

Feature: <feature-name>

## Updates Applied (X files)

- docs/STATUS.md - Moved to RECENT COMPLETIONS
- docs/ROADMAP.md - Marked tasks complete
- docs/essentials/coding-patterns.md - Added pattern
- CLAUDE.md - Updated priorities

## New Patterns Documented (X)

- <Pattern 1>: <description>
- <Pattern 2>: <description>

## Contradictions Resolved (X)

1. <Contradiction> → <Resolution>
2. <Contradiction> → <Resolution>

## Duplicates Consolidated (X)

1. Server action template in 3 files → coding-patterns.md
2. PageContainer example duplicated → consolidated

## Obsolete Content Removed (X)

1. Named Slots documentation → removed
2. app/agency references → updated to app/church
3. IV therapy examples → removed

## Pattern Compliance

✅ Feature follows documented patterns
✅ Multi-tenant safety verified
✅ Security patterns applied

## Consistency Check

✅ All docs aligned
✅ Examples are real code
✅ File paths verified
✅ Dates consistent
✅ No contradictions
✅ Links work

Ready for review.
```

**Step 28: Show Changes Summary**

```bash
# Show what would be committed
git add docs/ CLAUDE.md
git diff --cached --stat
```

**Step 29: Present to User**

Show user:

- Files that will be updated
- Contradictions resolved
- Duplicates consolidated
- Obsolete content removed
- New patterns documented
- Consistency verified

Ask: **"Documentation audit complete. These changes are staged. Review the report above."**

---

## What This Command Does:

**1. Analyzes** - Understands what code changed
**2. Reads** - Scans ALL documentation files
**3. Detects** - Finds contradictions across docs
**4. Consolidates** - Removes duplicate examples
**5. Removes** - Deletes obsolete content
**6. Documents** - Adds new patterns
**7. Verifies** - Checks consistency
**8. Reports** - Comprehensive summary
**9. Stages** - Prepares changes for commit

**Does NOT:**

- Run builds
- Run linters
- Create commits (just stages changes)
- Create PRs
- Merge anything
- Switch branches

Use `/commit` after this to commit the documentation changes.
Use `/feature-wrap-up` for complete workflow including build/commit/PR/merge.

---

## Important Rules:

**Comprehensive:**

- ✅ Read ALL docs completely
- ✅ Check for contradictions
- ✅ Consolidate duplicates
- ✅ Remove obsolete content
- ✅ Verify all examples

**Resolution:**

- ✅ Check actual code for truth
- ✅ Update all conflicting docs
- ✅ Add clarifying decision trees
- ✅ Document resolution

**Consolidation:**

- ✅ One canonical detailed example
- ✅ Replace duplicates with references
- ✅ Maintain quick ref vs detailed guide

**Removal:**

- ✅ Check files/patterns exist
- ✅ Remove irrelevant content
- ✅ Archive deprecated if historical
- ✅ Update old paths

**Documentation:**

- ✅ Use real code examples
- ✅ Include file:line paths
- ✅ Document why, not just what
- ✅ Create ADRs for decisions

**Never:**

- ❌ Leave contradictions
- ❌ Keep duplicates
- ❌ Document obsolete patterns
- ❌ Use hypothetical examples
- ❌ Skip consistency checks

---

## When to Use:

✅ **After completing feature** (before commit)
✅ **After introducing new patterns**
✅ **After major refactoring**
✅ **Weekly documentation maintenance**
✅ **When docs feel out of sync**
✅ **Before creating PR**

**Workflow:**

1. Complete feature code
2. Run `/update-docs <feature-name>`
3. Review audit report
4. Run `/commit` to commit doc changes
5. Run `/feature-wrap-up` for full workflow

OR just run `/feature-wrap-up` which calls this automatically.
