---
description: Complete end-to-end feature workflow from build to merge to handoff (no file creation)
model: claude-sonnet-4-5-20250929
---

# Feature Wrap-Up

Complete feature workflow: build → commit → PR → merge → update worktrees → handoff text (copyable, no files created).

## Your Tasks:

### Stage 1: Quality Verification

**Step 1: Run Build**

```bash
pnpm build
```

If build fails:

- Report all TypeScript errors with file:line references
- STOP workflow
- Ask user: "Build failed. Would you like me to help fix the errors?"

**Step 2: Run ESLint**

```bash
pnpm lint
```

If lint fails:

- Report all ESLint errors/warnings
- STOP workflow
- Ask user: "ESLint found issues. Run \`pnpm lint --fix\` to auto-fix? (yes/no)"

**Step 3: Verify No Critical Issues**

- Check for console.log/console.error statements
- Check for TODO/FIXME comments in critical code
- Check for any \`.only()\` in tests (if tests exist)

If issues found, report them and ask user if acceptable to proceed.

---

### Stage 2: Commit & Documentation

**Step 4: Check Git Status**

```bash
git status
git diff --stat
```

Show user summary of changes.

**Step 5: Review Changes & Draft Commit**

Analyze changes and draft commit message:

- Determine type: feat/fix/refactor/docs/etc.
- Write clear, concise summary (1-2 sentences)
- Focus on "why" not "what"

**Commit message format:**

```
<type>: <short summary>

<optional detailed explanation>
```

**Step 6: Execute Commit**

```bash
# Build already passed, now commit
git add .
git commit -m "$(cat <<'EOF'
<commit message here>
EOF
)"
```

**IMPORTANT:** NO "Generated with Claude Code" or "Co-Authored-By: Claude" (CLAUDE.md lines 457-463)

**Step 7: Verify Commit Success**

```bash
git log -1 --oneline
git status
```

Should show clean working tree.

**Step 8: Update Documentation**

Update STATUS.md and ROADMAP.md:

- Move feature from "IN PROGRESS" to "RECENT COMPLETIONS"
- Mark tasks as [x] complete in ROADMAP.md
- Add completion date and details

**Step 9: Commit Documentation**

```bash
git add docs/STATUS.md docs/ROADMAP.md
git commit -m "docs: update STATUS and ROADMAP for <feature-name>"
```

---

### Stage 3: Pull Request

**Step 10: Push Branch**

```bash
git push origin <branch-name>
```

If branch doesn't exist on remote, push with \`-u\` flag.

**Step 11: Generate PR Description**

Analyze all commits in branch:

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

Draft PR description:

```markdown
## Summary

<1-3 bullet points describing what was built>

## Changes

- <key file changes>
- <new features>
- <bug fixes>

## Testing

<how to test this feature>

## Checklist

- [x] Build passes
- [x] ESLint clean
- [x] Documentation updated
- [x] Pattern compliance verified
- [ ] Manual testing completed (if needed)

## Screenshots (if applicable)

<add screenshots if UI changes>
```

**Step 12: Create PR**

Ask user: **"Create pull request now? (yes/no)"**

If yes:

```bash
gh pr create --title "feat: <feature-name>" --body "$(cat <<'EOF'
<PR description here>
EOF
)"
```

Store PR number for later use.

---

### Stage 4: Testing & Merge

**Step 13: Ask About Testing**

Ask user: **"Does this feature need manual testing before merge? (yes/no)"**

**If YES:**

1. Show testing checklist:
   ```
   Testing Checklist:
   - [ ] Feature works in dev environment
   - [ ] Mobile responsive (test phone viewport)
   - [ ] Authentication works correctly
   - [ ] Multi-tenant isolation verified
   - [ ] Error handling works
   - [ ] Loading states display correctly
   - [ ] Empty states display correctly
   ```
2. Wait for user confirmation: "Testing complete, ready to merge? (yes/no)"

**If NO:**

- Proceed to merge immediately

**Step 14: Squash and Merge PR**

Ask user: **"Ready to squash and merge PR? (yes/no)"**

If yes:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

This will:

- Squash all commits into one
- Merge to main
- Delete the feature branch on remote

**Step 15: Verify Merge Success**

```bash
gh pr view <pr-number>
```

Should show "Merged" status.

---

### Stage 5: Cleanup & Switch to Main

**Step 16: Switch to Main Branch**

```bash
git checkout main
```

**Step 17: Pull Latest Changes**

```bash
git pull origin main
```

**Step 18: Delete Local Feature Branch**

```bash
git branch -d <feature-branch-name>
```

**Step 19: Verify Clean State**

```bash
git status
git log -1 --oneline
```

Should show:

- On branch main
- Working tree clean
- Latest commit includes merged feature

---

### Stage 6: Update Other Worktrees 🆕

**⚠️ WORKTREE WORKFLOW GUIDE (Hand-Holding Mode)**

This project uses git worktrees. You just merged to \`main\`, but other worktrees (\`prayer\`, \`volunteer\`) need these changes too.

**Step 20: List All Worktrees**

```bash
git worktree list
```

Output will show something like:

```
/path/to/connect-card/.bare      (bare)
/path/to/connect-card/main       abc1234 [main]  ← You are here now
/path/to/connect-card/prayer     def5678 [feature/prayer-management]
/path/to/connect-card/volunteer  ghi9012 [feature/volunteer-management]
```

**Step 21: Identify Current Worktree**

```bash
pwd
git branch --show-current
```

**Step 22: For Each Other Worktree**

**IMPORTANT:** We need to bring your merged changes into the other feature branches so they don't become outdated.

For **EACH** worktree (prayer, volunteer) that is NOT the one you just worked in:

**Step 22a: Switch to Worktree Directory**

```bash
cd /path/to/connect-card/<worktree-name>
```

Example: \`cd /home/digitaldesk/Desktop/connect-card/prayer\`

**Step 22b: Check for Uncommitted Work**

```bash
git status
```

**If there are uncommitted changes:**

- ⚠️ **STOP and show warning:**

  ```
  ⚠️  WARNING: This worktree has uncommitted changes!

  Uncommitted files:
  <list files>

  Options:
  1. Commit these changes first (RECOMMENDED)
  2. Stash changes temporarily
  3. Skip this worktree (risky - will become outdated)

  What would you like to do? (1/2/3)
  ```

**If clean working tree:**

**Step 22c: Show Current State**

```bash
git log -1 --oneline
git branch --show-current
```

Show user:

```
📍 Current location: <worktree-name>
📌 Current branch: <branch-name>
📝 Last commit: <commit-message>

I'm about to merge the latest changes from 'main' into this branch.
This will bring in your just-merged feature: <feature-name>
```

**Step 22d: Merge Main into Feature Branch**

```bash
git merge main --no-edit
```

**If merge succeeds cleanly:**

```bash
✅ Merge successful! This worktree now has the latest changes from main.

Updated files:
<show git diff --stat main@{1}..HEAD>
```

**If merge has conflicts:**

```
⚠️  MERGE CONFLICT DETECTED

Conflicting files:
<list conflicted files>

📚 BEGINNER'S GUIDE TO RESOLVING CONFLICTS:

1. Open each conflicted file in your editor
2. Look for conflict markers:
   <<<<<<< HEAD (your changes)
   your code here
   =======
   their code here (from main)
   >>>>>>> main

3. Choose which version to keep (or combine both)
4. Remove the conflict markers (<<<<<<<, =======, >>>>>>>)
5. Save the file

After fixing ALL conflicts:

git add <fixed-files>
git commit -m "merge: resolve conflicts from main merge"

Then re-run this command to continue updating other worktrees.

For now, I'm stopping the worktree update. Fix conflicts first.
```

**If conflicts, STOP worktree updates until user resolves.**

**Step 22e: Verify Merge**

```bash
git log --oneline -3
git status
```

Show:

```
✅ Worktree '<worktree-name>' successfully updated!

Recent commits:
<show last 3 commits>

Status: Clean working tree ✅
```

**Step 23: Return to Main Worktree**

After updating all worktrees, return to main:

```bash
cd /path/to/connect-card/main
```

**Step 24: Summary of Worktree Updates**

Show user a summary:

```
📊 WORKTREE UPDATE SUMMARY
===========================

✅ main: Already up to date (this is where you merged)
✅ prayer: Updated successfully (merged main)
✅ volunteer: Updated successfully (merged main)

All worktrees now have your merged feature: <feature-name>

⚠️  IMPORTANT REMINDER:
The next time you work in the 'prayer' or 'volunteer' worktrees,
they will already have these changes. You won't need to merge again
unless main gets more updates.
```

---

### Stage 7: Next Feature Planning

**Step 25: Ask About Next Feature**

Ask user: **"What feature would you like to work on next?"**

Wait for user input describing next feature.

**Step 26: Display Handoff Summary**

Show user the handoff document as copyable text:

```
Feature Wrap-Up Complete! ✅
============================

✅ Build passed
✅ Commits created
✅ PR #<number> created and merged
✅ Switched to main branch
✅ All worktrees updated (main, prayer, volunteer)
✅ Documentation updated

Next Feature: <next-feature>
Current Worktree: main
Current Branch: main (clean)
Ready for: /session-start <next-feature>

---

📋 AI SESSION HANDOFF (Copy/Paste for Next Session)
===================================================

Paste this into your next Claude Code session to bring AI up to speed:

---START HANDOFF---

# AI Session Handoff

**Date:** <current-date>
**Previous Feature:** <just-completed-feature>
**Next Feature:** <user-provided-next-feature>
**Current Worktree:** main
**Current Branch:** main
**Last Commit:** <git log -1 --oneline>

## What We Just Completed

### Feature: <completed-feature-name>
**Status:** ✅ Merged to main (PR #<number>)

**What Was Built:**
<summary of completed feature>

**Files Changed:**
<list key files that were modified>

**Patterns Used:**
- PageContainer variant: <variant>
- Server actions: <list actions created>
- Navigation: Updated /lib/navigation.ts
- Multi-tenant: organizationId scoping applied
- Security: Rate limiting and auth implemented

**Key Decisions:**
<any important architectural decisions made>

**Lessons Learned:**
<anything notable about implementation>

## Worktree Status (All Updated ✅)

This project uses git worktrees:

- **main**: \`/path/to/connect-card/main\` (you are here)
- **prayer**: \`/path/to/connect-card/prayer\` (feature/prayer-management)
- **volunteer**: \`/path/to/connect-card/volunteer\` (feature/volunteer-management)

All worktrees have been updated with the merged changes from main.

**What this means:**
- All 3 worktrees now have <completed-feature>
- Next time you switch worktrees, you won't see merge conflicts from this feature
- Each worktree is working on a different feature but sharing the same base

## Current Project State

### Working Features
- Connect Card scanning with AI Vision ✅
- Review Queue with manual correction ✅
- Dashboard analytics with TanStack Table ✅
- <just-completed-feature> ✅

### In Progress (Other Worktrees)
- Prayer Management (prayer worktree)
- Volunteer Management (volunteer worktree)

### Next Feature
- <next-feature> (starting now)

### Known Issues
<any known issues or tech debt>

## Next Feature: <next-feature-name>

### Objective
<what needs to be built>

### Worktree Strategy

**Option 1: Work in 'main' worktree (quick features)**
\`\`\`bash
git checkout -b feature/<next-feature>
\`\`\`

**Option 2: Create new worktree (recommended for larger features)**
\`\`\`bash
git worktree add ../connect-card/<feature-name> -b feature/<feature-name>
cd ../connect-card/<feature-name>
\`\`\`

**Which to choose?**
- **Main worktree**: Good for documentation, small fixes, quick features
- **New worktree**: Better for larger features so you can switch between features easily

### Approach Recommendations
<suggested implementation approach based on project patterns>

### Files to Review
<files that will likely need changes>

### Patterns to Follow
- **Route Creation:** Use \`/add-route\` command
- **Server Actions:** Use \`/add-server-action\` command
- **Tables:** Follow TanStack Table pattern from payments
- **Forms:** Follow react-hook-form + Zod pattern
- **Auth:** Use requireDashboardAccess() for church routes

### Related Code to Study
<point to similar existing features>

## Quick Reference

**Worktree Workflow:**
- \`git worktree list\` - See all worktrees
- \`cd /path/to/worktree\` - Switch between worktrees
- After merging to main: Update other worktrees with \`git merge main\`

**Branch Strategy:** feature/<feature-name>
**Commit Style:** Conventional commits (feat/fix/refactor/docs)
**No Attribution:** Clean commits, no AI signatures
**Pattern Compliance:** Check coding-patterns.md before building

**Key Commands:**
- \`/session-start <feature>\` - Initialize new feature session
- \`/add-route <path> <title>\` - Scaffold new route
- \`/add-server-action <name> <type>\` - Create server action
- \`/review-code\` - Code quality check
- \`/commit\` - Complete commit workflow
- \`/feature-wrap-up\` - This workflow

**Documentation:**
- CLAUDE.md - Core principles and patterns
- coding-patterns.md - Technical implementation guide
- STATUS.md - Current project state
- ROADMAP.md - Feature roadmap and priorities

## Starting the Next Session

**Recommended first step:**
\`\`\`
/session-start <next-feature-description>
\`\`\`

This will:
1. Create feature branch (or new worktree)
2. Load all project context
3. Explore relevant code
4. Provide implementation plan

**Good luck! The previous session completed successfully, merged to main, and updated all worktrees. Everything is clean for you.**

---END HANDOFF---

**Copy the text between the START/END markers and paste it into your next session.**

Great work on <completed-feature>! 🎉
```

---

## Error Handling

**Build Failures:**

- Stop workflow
- Report errors with file:line references
- Offer to help fix
- Resume from Stage 1 after fixes

**Commit Failures:**

- Check for pre-commit hook changes
- Amend if safe (same author, not pushed)
- Otherwise create new commit
- Resume workflow

**PR Creation Failures:**

- Check gh CLI is authenticated: \`gh auth status\`
- Check remote exists: \`git remote -v\`
- Provide manual PR creation instructions
- Wait for user to create PR manually
- Resume from merge step

**Merge Failures:**

- Check for conflicts
- Ask user to resolve manually
- Wait for resolution
- Retry merge

**Worktree Update Failures:**

- **Uncommitted changes:** Ask user to commit or stash first
- **Merge conflicts:** Provide beginner-friendly conflict resolution guide
- **Missing worktree:** Skip gracefully, warn user
- **Network errors:** Retry or continue with other worktrees

**Testing Issues:**

- If user reports test failures, STOP workflow
- Help debug and fix issues
- Resume from testing step after fixes

---

## Important Notes

**This is a COMPLETE workflow** - It takes you from "code done" to "ready for next feature" INCLUDING updating all worktrees

**User Confirmations Required:**

- Create PR? (yes/no)
- Manual testing needed? (yes/no)
- Testing complete? (yes/no) - if testing was needed
- Ready to merge? (yes/no)
- How to handle worktree conflicts? (1/2/3) - if conflicts exist
- What's next feature? (text input)

**Automatic Steps (No Confirmation):**

- Build verification
- ESLint check
- Creating commits
- Updating documentation
- Switching branches
- Pulling main
- Updating other worktrees (if no conflicts)
- Generating handoff text (no files created)

**NEVER Skip:**

- Build verification
- Documentation updates
- Worktree updates (critical for multi-worktree setup)
- Handoff text generation

**Time Estimate:**
This workflow takes 3-7 minutes to complete (excluding manual testing time), slightly longer with worktree updates.

---

## When to Use This Command

✅ **Feature is complete and tested**
✅ **Ready to merge to main**
✅ **Want automated wrap-up workflow**
✅ **Need to update other worktrees**
✅ **Need handoff to next session**
✅ **Ending work day (create handoff for tomorrow)**

❌ **Don't use if:**

- Feature not complete
- Build is broken
- Critical bugs present
- Conflicts with main exist (resolve first)
- Other worktrees have uncommitted work (commit first)

This command handles the **entire ceremony** from feature completion to next feature planning, INCLUDING keeping all worktrees in sync. Use it when you're truly done and ready to move on.
