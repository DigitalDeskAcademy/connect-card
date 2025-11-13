# Git Worktrees Setup - Claude Code CLI Session Guide

## PROJECT CONTEXT

Existing Next.js project with significant development history. Goal: Implement git worktrees to enable parallel development on backend features (AI vision, database work) and frontend work (landing pages, copywriting, aesthetics) without context switching.

## CRITICAL REQUIREMENTS

1. Test Claude Code CLI compatibility with worktrees BEFORE full implementation
2. Verify all changes are committed and backed up before restructuring
3. Maintain ability to rollback if issues arise
4. Ensure MCP connections, slash commands, and Claude Skills continue working

## PHASE 1: PRE-FLIGHT VERIFICATION (MUST COMPLETE FIRST)

### Step 1: Verify Project State

```bash
# Check for uncommitted changes
git status

# If there are uncommitted changes, commit them first
git add .
git commit -m "Pre-worktree checkpoint"

# Push to remote as backup
git push origin main
```

### Step 2: Test Worktree + Claude Code CLI Compatibility

```bash
# Create a single test worktree
git worktree add ../test-worktree -b test/claude-code-compatibility

# Navigate to test worktree
cd ../test-worktree

# Verify git operations work
git status
git log --oneline -5

# TEST CLAUDE CODE CLI (CRITICAL)
# Run a simple Claude Code command to verify compatibility
# Example: Ask Claude to add a comment to a file

# If Claude Code works normally in the worktree, proceed to Phase 2
# If Claude Code errors or behaves unexpectedly, STOP and report issues
```

**DECISION POINT:** Only proceed to Phase 2 if Claude Code CLI works correctly in the test worktree.

### Cleanup Test (if proceeding)

```bash
cd ..
git worktree remove test-worktree
git branch -D test/claude-code-compatibility
```

## PHASE 2: BARE REPOSITORY SETUP

### Step 3: Create Bare Repository Structure

```bash
# Navigate to project root
cd /path/to/your/project

# Create bare repository (all git data moves here)
git clone --bare . .bare

# Create pointer file to bare repository
echo "gitdir: ./.bare" > .git

# Verify setup
git worktree list
# Should show current directory as a worktree
```

### Step 4: Create Working Worktrees

```bash
# Create backend worktree for AI/database features
git worktree add backend -b feature/ai-vision

# Create frontend worktree for landing pages/copywriting
git worktree add frontend -b feature/landing-page

# Optional: Create main worktree for stable reference
git worktree add main main

# Verify all worktrees
git worktree list
```

**Expected structure:**

```
your-project/
├── .bare/              # Git repository data
├── .git                # Pointer to .bare
├── backend/            # AI vision feature branch
├── frontend/           # Landing page feature branch
└── main/               # Main branch (optional)
```

## PHASE 3: WORKSPACE CONFIGURATION

### Step 5: Set Up direnv for Automatic Environment Loading ⭐ RECOMMENDED

**direnv** automatically loads `.env` files when you `cd` into a worktree. This eliminates manual copying and ensures all worktrees stay in sync.

```bash
# Install direnv
sudo apt install direnv -y   # Linux
# or
brew install direnv          # Mac

# Add to shell configuration
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc

# Create .envrc in parent directory (already done)
# This file tells direnv to load .env from parent
cd /path/to/your/project
echo 'dotenv' > .envrc

# Allow direnv to load this directory
direnv allow

# Add .envrc to gitignore (already done)
echo '.envrc' >> .gitignore
```

**How it works:**

- When you `cd volunteer/`, direnv automatically loads `../.env`
- When you `cd main/`, direnv automatically loads `../.env`
- Changes to parent `.env` propagate to all worktrees instantly
- No manual copying or symlinks needed

**Verification:**

```bash
# Test it works
cd volunteer/
env | grep DATABASE_URL  # Should show your connection string

cd ../main/
env | grep DATABASE_URL  # Should show same connection string
```

**Alternative (If you can't use direnv):**

Use symlinks to share the parent `.env`:

```bash
# In each worktree, create symlink to parent .env
cd volunteer/
ln -s ../.env .env

cd ../main/
ln -s ../.env .env

cd ../prayer/
ln -s ../.env .env
```

### Step 6: Set Up VS Code Workspaces

```bash
# Open backend worktree in VS Code
code backend/

# Open frontend worktree in separate VS Code window
code frontend/
```

### Step 7: Install Dependencies Per Worktree

```bash
# In backend worktree
cd backend/
npm ci

# In frontend worktree
cd frontend/
npm ci

# This duplication is intentional - each worktree may need different deps
```

## PHASE 4: VERIFICATION

### Step 8: Test Claude Code CLI in Each Worktree

```bash
# Test in backend worktree
cd backend/
# Run Claude Code command to verify full functionality
# Test: Creating files, reading project context, slash commands

# Test in frontend worktree
cd frontend/
# Run Claude Code command to verify full functionality
# Test: Creating files, reading project context, slash commands
```

### Step 9: Verify Git Operations

```bash
# In backend worktree
cd backend/
git status
git branch
git log --oneline -3

# Make a test commit
echo "# Test" >> README.md
git add README.md
git commit -m "Test commit in backend worktree"
git log --oneline -1

# Verify it appears in other worktrees
cd ../frontend/
git fetch  # Should see the new commit
```

### Step 10: Test Workflow Integration

```bash
# Open both VS Code windows
# Window 1: backend/ directory
# Window 2: frontend/ directory

# Verify:
# - Each window maintains separate file contexts
# - Git operations work independently
# - Claude Code CLI works in both
# - Terminal sessions stay separate
# - No interference between worktrees
```

## DAILY WORKFLOW PATTERNS

### Starting Work

```bash
# Option 1: Navigate via terminal
cd backend/    # Work on AI features
cd ../frontend/  # Switch to landing page work

# Option 2: Use VS Code workspace switcher
# File > Open Recent > Select worktree
```

### Committing Changes

```bash
# Each worktree commits independently
cd backend/
git add .
git commit -m "Implement vision processing"
git push origin feature/ai-vision

cd frontend/
git add .
git commit -m "Update landing page copy"
git push origin feature/landing-page
```

### Syncing with Main

```bash
# Periodically pull main into feature branches
cd backend/
git pull origin main
# Resolve conflicts if any, test

cd frontend/
git pull origin main
# Resolve conflicts if any, test
```

### Creating Pull Requests

```bash
# Backend feature complete
cd backend/
git pull origin main  # Get latest
git push origin feature/ai-vision
# Create PR in GitHub/GitLab

# Frontend feature complete
cd frontend/
git pull origin main  # Get latest
git push origin feature/landing-page
# Create PR in GitHub/GitLab
```

### Cleaning Up Completed Work

```bash
# After PR merged and you're done with a worktree
git worktree remove backend
git branch -D feature/ai-vision  # If branch merged

# Create new worktree for next feature
git worktree add backend -b feature/next-thing
```

## TROUBLESHOOTING

### If Claude Code CLI Doesn't Work

```bash
# Rollback immediately
cd your-project/
rm -rf .bare backend frontend main
# Restore original .git directory from backup
# Or re-clone from remote
```

### If Dependencies Are Issues

```bash
# Use npm ci with offline cache for faster installs
cd backend/
npm ci --prefer-offline

# Or symlink node_modules if dependencies are identical
# (Not recommended unless you're sure they won't diverge)
ln -s ../main/node_modules backend/node_modules
```

### If Paths Break

```bash
# Repair worktree paths
git worktree repair

# Or manually fix with move command
git worktree move backend ../new-location
```

### If Worktrees Become Cluttered

```bash
# List all worktrees
git worktree list

# Remove stale worktrees
git worktree prune

# Remove specific worktree
git worktree remove <path>
```

## SUCCESS CRITERIA

✅ Claude Code CLI works identically in both worktrees
✅ Two VS Code windows open simultaneously on different branches
✅ Git operations (commit, push, pull) work independently
✅ No context switching overhead when changing focus
✅ Can work on AI features and landing page without interference
✅ Dependencies install correctly per worktree
✅ MCP connections and slash commands function normally

## ROLLBACK PROCEDURE (IF NEEDED)

```bash
# If anything goes wrong:
cd your-project/

# Remove all worktrees
git worktree remove backend
git worktree remove frontend
git worktree remove main

# Remove bare repository
rm -rf .bare
rm .git

# Re-clone from remote if needed
cd ..
git clone <your-repo-url> your-project
cd your-project
```

## NOTES FOR CLAUDE CODE CLI

- Each worktree is a fully functional Git repository
- The `.git` file (not directory) points to shared `.bare/` repository
- Commits in one worktree are visible in others via `git fetch`
- Cannot have same branch checked out in multiple worktrees
- Use `git worktree list` to see all active worktrees
- Always use `git worktree remove` instead of manual deletion
- Project context (claude.md, slash commands) works per worktree
- Test thoroughly before committing to this structure

## RECOMMENDED FIRST ACTIONS

1. Complete Phase 1 test - verify Claude Code compatibility
2. If successful, backup project (push all changes)
3. Proceed with Phase 2 bare repository setup
4. Create two worktrees for current parallel work
5. Test full workflow for 1-2 days
6. If it improves productivity, keep it; if not, rollback

Execute this guide step-by-step, verifying each phase before proceeding.
