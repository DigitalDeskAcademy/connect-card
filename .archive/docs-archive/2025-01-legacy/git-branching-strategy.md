# Git Branching Strategy Guide

**For**: SideCar Platform Development
**Created**: 2025-01-16
**Purpose**: Managing a large-scale project with multiple features and deployments

## 🎯 Current Situation Analysis

### Your Current State

- **Current Branch**: `feat/remove-single-tenant-routes`
- **Total Local Branches**: 35+ (many unmerged)
- **Last Remote Push**: `feat/agency-signup-flow` (3 commits behind current)
- **Uncommitted Changes**: Large refactor in progress

### Problems Identified

1. Too many feature branches creating confusion
2. Unclear which branches are merged vs abandoned
3. No clear workflow for merging back to main
4. Risk of losing work or creating conflicts

## 📋 Recommended Git Strategy

### 1. Branch Naming Convention

```
feat/short-description     # New features
fix/issue-description      # Bug fixes
refactor/what-changed      # Code improvements
docs/what-updated         # Documentation only
chore/task-description    # Maintenance tasks
hotfix/critical-issue     # Production emergencies
```

### 2. Branch Lifecycle (GitHub Flow - Simplified)

```
main (production-ready)
  └── feat/new-feature (your work)
       └── Create PR when ready
       └── Merge to main
       └── Delete feature branch
```

### 3. Daily Workflow

```bash
# Start your day
git checkout main
git pull origin main
git checkout -b feat/todays-task

# Work and commit frequently
git add .
git commit -m "feat: descriptive message"

# End of day (or when feature complete)
git push origin feat/todays-task
# Create PR on GitHub
# Merge PR
# Delete branch locally and remotely
```

## 🔧 Immediate Cleanup Actions

### Step 1: Commit Current Work

```bash
# You have many unstaged deletions and changes
git add .
git commit -m "refactor: complete multi-tenant migration cleanup"
```

### Step 2: Identify Branches to Keep/Delete

```bash
# List branches with last commit date
git for-each-ref --sort='-committerdate' --format='%(refname:short) - %(committerdate:relative)' refs/heads/

# Branches to probably DELETE (already merged or abandoned):
- feature/landing-page (old)
- feature/courses (old)
- feature/authentication-setup (merged)
- template/* (templates, not active work)
- fix/* that are already merged

# Branches to KEEP:
- main (obviously)
- Your current feat/remove-single-tenant-routes
- Any recent feat/* branches with uncommitted work
```

### Step 3: Clean Up Branches

```bash
# Delete local branches that are fully merged
git branch --merged main | grep -v "main" | xargs -n 1 git branch -d

# Delete specific old branch
git branch -D feature/old-branch-name

# Clean up remote tracking
git remote prune origin
```

### Step 4: Establish New Workflow

```bash
# Option A: Merge Current Work to Main
git checkout main
git pull origin main
git merge feat/remove-single-tenant-routes
git push origin main

# Option B: Create PR (Recommended)
git push origin feat/remove-single-tenant-routes
# Go to GitHub and create PR
# Review changes
# Merge PR
# Delete branch after merge
```

## 📊 Branch Management Rules

### DO's ✅

1. **One branch per feature/fix** - Keep it focused
2. **Merge frequently** - Don't let branches live for weeks
3. **Delete after merge** - Keep branch list clean
4. **Pull main daily** - Stay synchronized
5. **Commit often** - Small, logical commits
6. **Write clear commit messages** - feat:, fix:, docs:, etc.

### DON'Ts ❌

1. **Don't keep stale branches** - Delete if abandoned
2. **Don't work directly on main** - Always use feature branches
3. **Don't merge without testing** - Run build & lint first
4. **Don't force push to shared branches** - Communicate with team
5. **Don't panic about merge conflicts** - They're normal

## 🚀 Recommended Next Steps

### For Your Current Situation:

1. **Commit your current changes** on `feat/remove-single-tenant-routes`
2. **Push to remote** and create a PR
3. **Merge to main** after review
4. **Delete old branches** (use cleanup commands above)
5. **Start fresh** with new branch for next task

### Going Forward:

1. **Weekly branch cleanup** - Every Friday, delete merged branches
2. **Daily sync** - Pull main every morning
3. **Feature complete = PR** - Don't let branches linger
4. **Use PRs for everything** - Creates history and allows review
5. **Tag releases** - `git tag v1.0.0` for production deployments

## 📈 Simple Daily Checklist

```markdown
☐ Morning: Pull latest main
☐ Create feature branch for today's work
☐ Make commits with clear messages
☐ Push branch when feature complete
☐ Create PR with good description
☐ Merge PR after tests pass
☐ Delete branch after merge
☐ Friday: Clean up old branches
```

## 🆘 Common Scenarios

### "I'm lost in branches"

```bash
git status                    # Where am I?
git branch                    # What branches exist?
git log --oneline -10        # What did I do?
git stash                     # Save work temporarily
git checkout main             # Go back to safety
```

### "I need to update my branch with main"

```bash
git checkout main
git pull origin main
git checkout your-feature-branch
git merge main                # or git rebase main
```

### "I committed to wrong branch"

```bash
git log --oneline -3          # Find commit hash
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1       # Remove from wrong branch
```

## 💡 Pro Tips

1. **Use GitHub Desktop or GitKraken** if command line is overwhelming
2. **Set up branch protection** on GitHub for main branch
3. **Use GitHub Issues** to track what each branch is for
4. **Write PR descriptions** that explain what and why
5. **Don't be afraid to ask for help** with complex merges

Remember: Git is a tool to help you, not to fight against. Keep it simple, merge often, and maintain a clean workspace!
