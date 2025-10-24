Based on your SideCar Platform stack, I'll help you add the most relevant open source subagents that will accelerate your development. Given your Next.js/TypeScript/Prisma setup and current Stripe integration issues, here are my recommendations:

## Recommended Subagents for Your Stack

### 1. **Core Development Agents**

From the VoltAgent collection, these would be immediately valuable:

- **nextjs-specialist** - Handles Next.js 15 App Router patterns, server components, and route optimization
- **typescript-expert** - Manages complex TypeScript types, especially helpful with Prisma generated types
- **prisma-database** - Specializes in Prisma schema design, migrations, and query optimization
- **stripe-integration** - Could help resolve your current Stripe integration mismatch issues
- **api-architect** - Designs RESTful APIs following Next.js 15 patterns

### 2. **Quality & Testing Agents**

- **code-reviewer** - Automated code review for PRs
- **test-writer** - Generates test cases for your components and API routes
- **security-auditor** - Scans for security vulnerabilities in your multi-tenant setup

## Installation Steps

### Step 1: Set Up Claude Code (if not already done)

```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude doctor

# Set your API key (in WSL2)
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Step 2: Clone the Subagent Repositories

```bash
# Create a temporary directory for agent sources
mkdir ~/claude-agents-temp
cd ~/claude-agents-temp

# Clone the main repositories
git clone https://github.com/VoltAgent/awesome-claude-code-subagents.git
git clone https://github.com/wshobson/agents.git
git clone https://github.com/hesreallyhim/awesome-claude-code-agents.git
```

### Step 3: Install Agents in Your Project

```bash
# Navigate to your SideCar project root
cd /path/to/your/sidecar-project

# Create the local agents directory
mkdir -p .claude/agents

# Copy relevant agents (I'll show the most important ones)
cp ~/claude-agents-temp/awesome-claude-code-subagents/agents/nextjs-specialist.yaml .claude/agents/
cp ~/claude-agents-temp/awesome-claude-code-subagents/agents/typescript-expert.yaml .claude/agents/
cp ~/claude-agents-temp/awesome-claude-code-subagents/agents/prisma-database.yaml .claude/agents/
cp ~/claude-agents-temp/awesome-claude-code-subagents/agents/stripe-integration.yaml .claude/agents/
cp ~/claude-agents-temp/awesome-claude-code-subagents/agents/api-architect.yaml .claude/agents/
cp ~/claude-agents-temp/wshobson/agents/code-reviewer.yaml .claude/agents/
```

### Step 4: Create a Project-Specific CLAUDE.md

Create a `CLAUDE.md` file in your project root with your stack details:

```markdown
# SideCar Platform Context

## Stack

- Next.js 15.3.4 with App Router (React 19)
- TypeScript 5 with strict mode
- PostgreSQL via Neon with Prisma ORM 6.10.1
- Better Auth 1.2.9 with GitHub OAuth
- Stripe 18.4.0 for payments
- Tailwind CSS v4 with shadcn/ui
- Multi-tenant B2B SaaS architecture

## Project Structure

- Vertical Slice Architecture
- Route groups: (auth), (public), admin/
- Database models in lib/generated/prisma/
- Server components by default
- API routes in app/api/

## Development Environment

- WSL2 Linux
- pnpm package manager
- Dev server must run on port 3000 for auth
- Environment file with 19 required variables

## Current Issues

- Stripe integration mismatch needs resolution
- Focus on production blockers

## Conventions

- Use server components unless client interaction needed
- Follow existing data access patterns in app/data/
- Maintain type safety with Prisma generated types
- Test multi-tenant isolation for all new features
```

### Step 5: Configure Permissions

Create or update `~/.claude/settings.json`:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "permissions": {
    "file_read": true,
    "file_write": true,
    "bash": {
      "allowed_commands": ["git", "pnpm", "npx", "prisma", "stripe"]
    },
    "web_search": true
  },
  "tools": ["filesystem", "bash", "web_search"],
  "max_tokens": 8192
}
```

## Using the Agents Effectively

### For Your Stripe Issue

```bash
# Start Claude Code in your project
cd /path/to/your/sidecar-project
claude

# Invoke the Stripe specialist
/agent stripe-integration
"Review our Stripe webhook implementation in app/api/webhooks/stripe/route.ts and identify the integration mismatch. Check against our order fulfillment flow."
```

### For Database Schema Updates

```bash
/agent prisma-database
"Add a new feature for subscription tiers to our multi-tenant schema. Ensure proper organization isolation."
```

### For Next.js Optimization

```bash
/agent nextjs-specialist
"Optimize our course management routes for better performance. Review app/(auth)/organizations/[orgId]/courses and suggest improvements."
```

### For Code Review

```bash
/agent code-reviewer
"Review the authentication flow implementation in lib/auth.ts and app/(auth) routes for security best practices."
```

## Multi-Agent Workflows

For complex tasks, you can chain agents:

```bash
# First, have the API architect design the endpoint
/agent api-architect
"Design a new API endpoint for bulk student enrollment in courses with proper multi-tenant validation"

# Then have the TypeScript expert implement it
/agent typescript-expert
"Implement the bulk enrollment API with full type safety using our Prisma types"

# Finally, have the test writer create tests
/agent test-writer
"Create comprehensive tests for the bulk enrollment feature including edge cases and multi-tenant scenarios"
```

## Pro Tips for Your Setup

1. **Name agents uniquely** to avoid conflicts:

   ```bash
   mv .claude/agents/code-reviewer.yaml .claude/agents/sidecar-reviewer.yaml
   ```

2. **Create project-specific composite agents** for recurring tasks:

   ```yaml
   # .claude/agents/sidecar-deploy-checker.yaml
   name: sidecar-deploy-checker
   description: Checks production readiness for SideCar deployments
   tools: ["filesystem", "bash"]
   ---
   You are a deployment specialist for the SideCar platform.
   Check:
   1. All environment variables are set
   2. Prisma migrations are up to date
   3. Build passes without errors
   4. Stripe webhooks are configured
   5. Multi-tenant isolation is maintained
   ```

3. **Use agents for your current blockers**:
   - The Stripe integration agent can help resolve your payment issues
   - The database agent can optimize your Prisma queries
   - The security auditor can verify multi-tenant isolation
