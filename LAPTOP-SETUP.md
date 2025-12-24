# Laptop Development Environment Setup

**Generated:** 2025-12-24
**Source Machine:** WSL2 Ubuntu (home office)

---

## Step 0: Install WSL2 (Windows Only)

### Enable WSL

Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

This installs WSL2 with Ubuntu by default. **Restart your computer** when prompted.

### First-Time Ubuntu Setup

After restart, Ubuntu will launch automatically. Create your username and password when prompted.

### Update Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Essential Build Tools

```bash
sudo apt install -y build-essential git curl wget unzip
```

### Verify WSL Version

In PowerShell:

```powershell
wsl -l -v
```

Should show Ubuntu with VERSION 2.

### VS Code Integration

1. Install VS Code on Windows (not in WSL)
2. Install the **"WSL" extension** in VS Code
3. Open VS Code, press `Ctrl+Shift+P`, type "WSL: Connect to WSL"
4. Now VS Code runs against your Ubuntu filesystem

### File Location

Your project will live in the Ubuntu filesystem:

```
\\wsl$\Ubuntu\home\<username>\Desktop\church-connect-hub
```

Or from within WSL:

```
~/Desktop/church-connect-hub
```

**Important:** Always work in the Linux filesystem (`/home/...`), not `/mnt/c/...` for better performance.

---

## Quick Reference

| Tool       | Version  |
| ---------- | -------- |
| Node.js    | v24.11.0 |
| pnpm       | 10.12.1  |
| GitHub CLI | 2.81.0   |

---

## Step 1: Prerequisites

### Install Core Tools

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js 24
nvm install 24
nvm alias default 24

# Install pnpm
npm install -g pnpm@10.12.1

# Install GitHub CLI
# On Ubuntu/Debian:
sudo apt install gh
# On Mac:
brew install gh

# Authenticate GitHub
gh auth login
# Choose: GitHub.com → SSH → Generate new SSH key (or use existing)
```

### Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

---

## Step 2: Clone Repository (Worktree Setup)

This project uses **git worktrees** for parallel feature development.

```bash
# Create project directory
mkdir -p ~/Desktop/church-connect-hub
cd ~/Desktop/church-connect-hub

# Clone as bare repository
git clone --bare git@github.com:DigitalDeskAcademy/connect-card.git .bare

# Configure the bare repo
cd .bare
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git fetch origin
cd ..

# Create worktrees (adjust paths for your system)
git -C .bare worktree add ../main main
git -C .bare worktree add ../connect-card feature/connect-card
git -C .bare worktree add ../volunteer feature/volunteer-management
git -C .bare worktree add ../prayer feature/prayer-enhancements
git -C .bare worktree add ../tech-debt feature/member-unification
git -C .bare worktree add ../e2e feature/e2e
git -C .bare worktree add ../integrations feature/integrations
```

### Verify Worktrees

```bash
git -C .bare worktree list
```

Expected output:

```
.bare           (bare)
connect-card    [feature/connect-card]
e2e             [feature/e2e]
integrations    [feature/integrations]
main            [main]
prayer          [feature/prayer-enhancements]
tech-debt       [feature/member-unification]
volunteer       [feature/volunteer-management]
```

---

## Step 3: Environment Variables

### Create .env file in main worktree

```bash
cd ~/Desktop/church-connect-hub/main
```

Create `.env` with these keys (fill in your values from password manager/Neon/etc.):

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://<USER>:<PASSWORD>@ep-falling-unit-adhn1juc.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Authentication (Better Auth)
BETTER_AUTH_SECRET=<YOUR_VALUE>
BETTER_AUTH_URL=<YOUR_VALUE>

# GitHub OAuth
AUTH_GITHUB_CLIENT_ID=<YOUR_VALUE>
AUTH_GITHUB_CLIENT_SECRET=<YOUR_VALUE>

# Email (Resend)
RESEND_API_KEY=<YOUR_VALUE>
RESEND_FROM_EMAIL=<YOUR_VALUE>

# Rate Limiting (Arcjet)
ARCJET_KEY=<YOUR_VALUE>

# S3 Storage (Tigris)
AWS_ACCESS_KEY_ID=<YOUR_VALUE>
AWS_SECRET_ACCESS_KEY=<YOUR_VALUE>
AWS_ENDPOINT_URL_IAM=<YOUR_VALUE>
AWS_REGION=<YOUR_VALUE>

# Payments (Stripe)
STRIPE_SECRET_KEY=<YOUR_VALUE>
STRIPE_WEBHOOK_SECRET=<YOUR_VALUE>

# AI (Anthropic)
ANTHROPIC_API_KEY=<YOUR_VALUE>

# GoHighLevel Integration
GHL_CLIENT_ID=<YOUR_VALUE>
GHL_CLIENT_SECRET=<YOUR_VALUE>
GHL_REDIRECT_URI=<YOUR_VALUE>
GHL_PIT=<YOUR_VALUE>
GHL_LOCATION_ID=<YOUR_VALUE>

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_ADMIN_EMAIL=<YOUR_VALUE>
PORT=3000
```

### Create .env.local (for port overrides per worktree)

```bash
# main worktree
echo "PORT=3000" > ~/Desktop/church-connect-hub/main/.env.local

# connect-card worktree
echo "PORT=3001" > ~/Desktop/church-connect-hub/connect-card/.env.local

# prayer worktree
echo "PORT=3002" > ~/Desktop/church-connect-hub/prayer/.env.local

# volunteer worktree
echo "PORT=3003" > ~/Desktop/church-connect-hub/volunteer/.env.local

# tech-debt worktree
echo "PORT=3004" > ~/Desktop/church-connect-hub/tech-debt/.env.local

# e2e worktree
echo "PORT=3005" > ~/Desktop/church-connect-hub/e2e/.env.local

# integrations worktree
echo "PORT=3006" > ~/Desktop/church-connect-hub/integrations/.env.local
```

### Copy .env to other worktrees

```bash
for wt in connect-card prayer volunteer tech-debt e2e integrations; do
  cp ~/Desktop/church-connect-hub/main/.env ~/Desktop/church-connect-hub/$wt/.env
done
```

---

## Step 4: Install Dependencies

```bash
# For each worktree you plan to use:
cd ~/Desktop/church-connect-hub/main
pnpm install
pnpm prisma generate

# Repeat for other worktrees as needed
cd ~/Desktop/church-connect-hub/connect-card
pnpm install
pnpm prisma generate
```

---

## Step 5: VS Code Setup

### Workspace Color Coding

Each worktree has a color theme. Create `.vscode/settings.json` in each:

**main (Red):**

```json
{
  "workbench.colorCustomizations": {
    "activityBar.activeBorder": "#ef4444",
    "activityBar.activeBackground": "#ef4444",
    "activityBar.background": "#ef4444",
    "activityBar.foreground": "#ffffff",
    "activityBar.inactiveForeground": "#ffffffaa",
    "statusBar.background": "#ef4444",
    "statusBar.foreground": "#ffffff",
    "titleBar.activeBackground": "#ef4444",
    "titleBar.activeForeground": "#ffffff"
  }
}
```

**connect-card (Purple):** Use `#a855f7`
**prayer (Blue):** Use `#3b82f6`
**volunteer (Green):** Use `#22c55e`
**tech-debt (Yellow):** Use `#eab308`
**e2e (Cyan):** Use `#06b6d4`
**integrations (Grey):** Use `#6b7280`

### Recommended Extensions

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- GitLens

---

## Step 6: Claude Code Setup

### Configure MCP Servers

```bash
# Add Context7 (documentation lookup)
claude mcp add context7 -- npx -y @upstash/context7-mcp

# Add GHL (GoHighLevel) - if you have credentials
claude mcp add ghl --transport http --url https://services.leadconnectorhq.com/mcp/
```

### Global Claude Settings

Create `~/.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "includeCoAuthoredBy": false,
  "gitAttribution": false,
  "permissions": {
    "file_read": true,
    "file_write": true,
    "bash": {
      "allowed_commands": ["git", "pnpm", "npx", "prisma", "stripe"]
    },
    "web_search": true
  },
  "alwaysThinkingEnabled": true,
  "tools": ["filesystem", "bash", "web_search"],
  "max_tokens": 8192
}
```

---

## Step 7: Verify Setup

```bash
cd ~/Desktop/church-connect-hub/main

# Check Node
node -v  # Should be v24.x.x

# Check pnpm
pnpm -v  # Should be 10.x.x

# Check Prisma
pnpm prisma --version

# Test database connection
pnpm prisma db pull

# Start dev server
pnpm dev
```

Visit `http://localhost:3000` - you should see the app.

---

## Quick Commands

```bash
# Start any worktree
cd ~/Desktop/church-connect-hub/<worktree>
pnpm dev

# Sync worktree with main
cd ~/Desktop/church-connect-hub/<worktree>
git fetch origin && git merge origin/main

# Check all worktree status
git -C ~/Desktop/church-connect-hub/.bare worktree list

# Run build before commit
pnpm build

# Format code
pnpm format

# Run tests
pnpm test:e2e
```

---

## Troubleshooting

### "Module not found" errors

```bash
pnpm install
pnpm prisma generate
```

### Database connection issues

- Check DATABASE_URL in .env
- Ensure you're on a network that can reach Neon (some corporate networks block it)

### Port already in use

- Check .env.local has correct PORT
- Kill existing process: `lsof -ti:3000 | xargs kill`

### SSH key issues

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy and add at: https://github.com/settings/keys
```

---

## Secrets Location Reference

| Secret             | Where to Find                       |
| ------------------ | ----------------------------------- |
| DATABASE_URL       | Neon Dashboard → Connection String  |
| BETTER_AUTH_SECRET | Generate: `openssl rand -base64 32` |
| AUTH*GITHUB*\*     | GitHub OAuth App settings           |
| RESEND_API_KEY     | Resend Dashboard                    |
| ARCJET_KEY         | Arcjet Dashboard                    |
| AWS\_\* (Tigris)   | Tigris Dashboard                    |
| STRIPE\_\*         | Stripe Dashboard → Developers       |
| ANTHROPIC_API_KEY  | Anthropic Console                   |
| GHL\_\*            | GoHighLevel Agency settings         |

---

**Happy coding on the road!**
