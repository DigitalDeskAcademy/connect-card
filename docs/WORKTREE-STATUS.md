# Worktree Project Dashboard

**Purpose:** Worktree conventions and quick reference. For current work status, see GitHub.
**Next Customer Meeting:** January 2026

---

## 🔍 Current State (Query Git)

```bash
# See all worktrees and their branches
git -C /home/digitaldesk/Desktop/church-connect-hub/.bare worktree list

# See open PRs
gh pr list --state open

# See recent merged PRs
gh pr list --state merged --limit 10
```

**Don't hardcode branch names in docs** - branches get renamed/repurposed. Query git instead.

---

## 🚨 SECURITY: PRE-LAUNCH CHECKLIST

> **Before launching with real users:**
>
> - [ ] **Remove OTP logging** - `lib/auth.ts` line ~105-142
> - [ ] **Verify Resend domain** - Required for emails to any address
> - [ ] **Update `RESEND_FROM_EMAIL`** - Change from `onboarding@resend.dev`

---

## 🚦 Worktree Conventions

Each worktree has a **stable purpose** (folder name) but branches may change as work evolves.

| Worktree         | Color     | Purpose                            | Port |
| ---------------- | --------- | ---------------------------------- | ---- |
| **main**         | 🔴 Red    | Project management, PRs, docs      | 3000 |
| **connect-card** | 🟣 Purple | Connect card scanning & review     | 3001 |
| **volunteer**    | 🟢 Green  | Volunteer management & events      | 3003 |
| **integrations** | ⬜ Grey   | ChMS API integrations              | 3006 |
| **tech-debt**    | 🟡 Yellow | Refactoring & infrastructure       | 3004 |
| **e2e**          | 🔵 Cyan   | Playwright tests                   | 3005 |
| **prayer**       | 🔵 Blue   | Prayer features (⏸️ deprioritized) | 3002 |

### Worktree Rules

1. **main** = PM only, no feature building
2. **One feature per worktree** - don't mix concerns
3. **Merge to main frequently** - avoid long-lived branches
4. **Sync before starting work** - `git fetch origin && git merge origin/main`

---

## 📋 Feature Ownership

| Feature Area        | Worktree       | Vision Doc                               |
| ------------------- | -------------- | ---------------------------------------- |
| Connect Cards       | `connect-card` | `/docs/features/connect-cards/vision.md` |
| Volunteer & Events  | `volunteer`    | `/docs/features/volunteer/vision.md`     |
| Planning Center API | `integrations` | `/docs/features/integrations/vision.md`  |
| Member Unification  | `tech-debt`    | `/docs/features/member/vision.md`        |
| E2E Testing         | `e2e`          | `/docs/features/e2e/vision.md`           |
| Prayer              | `prayer`       | `/docs/features/prayer/vision.md`        |

---

## 📣 Current Priorities (Post-Demo Dec 2025)

> **Full briefing:** `/docs/features/demo-feedback-dec-2025.md`

**High Priority:**

1. Planning Center API integration (real-time duplicate checking)
2. Volunteer event tracking (capacity view, quick outreach)
3. Member unification (single source of truth)

**Marketing:**

- [ ] Record demo video (see `/docs/technical/demo-video-guide.md`)

**Deprioritized:**

- Prayer enhancements (pilot church uses Planning Center)

---

## 🔧 Quick Commands

```bash
# Check all worktree status
for wt in main connect-card volunteer tech-debt integrations e2e prayer; do
  echo "=== $wt ==="
  cd /home/digitaldesk/Desktop/church-connect-hub/$wt 2>/dev/null && {
    echo "Branch: $(git branch --show-current)"
    echo "Status: $(git status -s | wc -l) uncommitted files"
  } || echo "Not available"
done

# Start any worktree
cd /path/to/church-connect-hub/WORKTREE && pnpm dev

# Sync worktree with main
cd /path/to/church-connect-hub/WORKTREE && git fetch origin && git merge origin/main

# Create PR from worktree
gh pr create --fill
```

---

## 📞 Quick Reference

| Need               | Location                                   |
| ------------------ | ------------------------------------------ |
| **Demo Briefing**  | `/docs/features/demo-feedback-dec-2025.md` |
| Technical patterns | `/docs/PLAYBOOK.md`                        |
| Project roadmap    | `/docs/PROJECT.md`                         |
| Testing strategy   | `/docs/technical/testing-strategy.md`      |

---

## 🏛️ Architecture Decisions

### Why Worktrees?

- **Parallel development** - Work on multiple features without stashing
- **Isolated environments** - Each worktree has its own node_modules, .env
- **Clean PRs** - One feature = one branch = one PR
- **Database isolation** - Each worktree can use a separate Neon branch

### Naming Convention

- Worktree folder = stable purpose (e.g., `volunteer`)
- Branch name = current work (e.g., `feature/volunteer-events`)
- Branches change, folders don't

### When to Create New Worktree

- Starting a new major feature area
- Need isolated database for destructive testing
- Parallel work that would conflict

### When NOT to Create New Worktree

- Small fixes (use existing worktree)
- Documentation updates (use `main`)
- Hotfixes (branch from main directly)
