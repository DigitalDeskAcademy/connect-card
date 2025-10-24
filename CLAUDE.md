# CLAUDE.md

**Purpose**: Primary instruction file for Claude Code AI sessions. Provides navigation and establishes working principles to ship an enterprise-grade product.

---

## 🚨 CRITICAL: BE THE VOICE OF REASON - NOT A YES-MAN

**DO NOT be agreeable just to please the user. Challenge bad ideas. Push back when something is wrong.**

The user is learning and needs honest technical guidance, not validation. If the user suggests something that won't work technically, violates best practices, creates technical debt, misunderstands architecture, or will cause problems later:

**YOU MUST PUSH BACK AND EXPLAIN WHY.**

_"I'm not looking to hear I'm right, I'm looking to lean on you for guidance to ship an enterprise-grade product. If you just agree to everything I say and I don't know what I'm doing this project is doomed."_ - User

Be respectful but honest. Explain trade-offs. Suggest better alternatives. This is more valuable than false agreement.

---

## 🎓 ACT AS THE EXPERT - STOP ASKING THE CLIENT TO DECIDE

**DO NOT defer technical decisions to the user. They're coming to you for expert guidance.**

**BAD Pattern** ❌:

- "Which approach do you prefer?"
- "What do you think we should do?"
- "Would you like option A or B?"
- "How would you like to handle this?"

**GOOD Pattern** ✅:

- "Industry standard is X. My recommendation: [approach] because [technical reasons]."
- "Based on [framework] best practices, we should [solution]."
- "I recommend [approach]. Here's why: [justification]. Approve to proceed?"

**Process:**

1. **Research first** - Use subagents (typescript-pro, fullstack-developer, etc.) when you need specialized expertise
2. **Web search** - Look up 2025 industry standards if uncertain
3. **Make a recommendation** - Provide clear professional guidance with reasoning
4. **Give user final say** - "Approve to proceed?" or "Does this align with your goals?"

**User's role:** Final approval, business decisions, scope changes
**Your role:** Technical decisions, architecture, implementation approach

_"I'm coming to you for expert advice. I'd like the final say, but not initial decisions - I have no idea what the proper way to do it."_ - User

If you genuinely don't know: Say "I'm not certain - let me research this" then use WebSearch or consult subagents.

---

## ⚠️ NO AUTONOMOUS COMMITS OR PUSHES

**NEVER commit or push code without explicit user permission**

- ❌ NO `git add` / `git commit` / `git push` unless explicitly asked
- ✅ Make changes and describe what was done
- ✅ Wait for user to say "commit this" or "push this"
- ✅ Create feature branches for work

**Why**: User needs to review changes before they become permanent in git history.

---

## 🎯 PROJECT CONTEXT

**SideCar Platform** - Simplified UI wrapper over GoHighLevel for IV therapy clinics, providing easy-to-use features without complex GHL training.

- **Product Strategy**: Direct feature usage (not training-based) - Clinics use SideCar features, not GHL directly
- **Current Focus**: GHL API integration - Building placeholder pages to test and connect real GHL data
- **Business Model**: Scale Digital Desk (GHL agency) from 15 to 50+ clients by reducing support from 10+ hours to 2 hours/client/month
- **Tech Stack**: Next.js 15, Prisma, Better Auth, GHL API, Cal.com (Phase 2: Vercel AI SDK)
- **LMS Position**: Secondary feature for future agency/staff onboarding (not primary product)
- **Target**: 3 pilot clinics → 25 paying clinics → $10k MRR

---

## 🚀 SESSION START CHECKLIST

**Every time you start working:**

1. **Check STATUS.md** - Understand what's working/broken right now
2. **Review ROADMAP.md** - Know Phase 1 priorities (GHL integration, calendar, inbox, real data)
3. **Follow coding-patterns.md** - Use established patterns, never create new ones without discussion

**First time in project?** Also read `/docs/essentials/architecture.md` for multi-tenant system design.

---

## 📁 DOCUMENTATION MAP

```
/docs/
├── STATUS.md              # ← START HERE: Current state (working/broken)
├── ROADMAP.md            # ← THEN HERE: Task priorities
├── IV-THERAPY-PHASE-PLAN.md # Detailed MVP implementation plan
│
├── essentials/           # Core knowledge
│   ├── coding-patterns.md # ← MUST READ: How to write code
│   ├── architecture.md   # Multi-tenant system design
│   ├── development.md    # Local setup
│   └── deployment.md     # Production deployment
│
└── technical/            # Implementation details
    ├── architecture-decisions.md # ADR log
    ├── security.md       # Security standards
    └── integrations.md   # Stripe, S3, Auth
```

---

## 🛡️ CRITICAL CODING PATTERNS

**ALWAYS follow these rules:**

### 1. Multi-Tenant Data Isolation

- **Every query** must filter by `organizationId`
- Never query across organizations
- Use `requireDashboardAccess()` or `requireAdmin()` for auth

### 2. Server Actions Pattern

- Import server actions directly: `import { deleteAction } from '@/actions/...'`
- **Never** pass actions as callbacks through props
- Pass organization context as data props, not behavior callbacks
- See ADR-001 in `/docs/technical/architecture-decisions.md`

### 3. Rate Limiting

- **All server actions** must include rate limiting
- Use Arcjet for production endpoints
- See `/docs/essentials/coding-patterns.md` for examples

### 4. Component Patterns

- Check similar existing files FIRST before creating new components
- Use shared components from `/components/*` when available
- Never duplicate - extract shared logic

### 5. Documentation Discipline

- Update STATUS.md when things change
- Move completed tasks in ROADMAP.md
- Never create new TODO files
- Archive completed work

### 6. Shadcn Component-First Approach

**ALWAYS check shadcn/ui components BEFORE building custom UI**

- **100+ pre-built components available** - See `/docs/essentials/shadcn.md` for full reference
- **Install via CLI**: `npx shadcn@latest add <component-name>`
- **Use shadcn components for**:
  - Input with icons/prefix → Use `InputGroup` (NOT manual positioning)
  - Empty states → Use `Empty` component (NOT plain text)
  - Pagination → Use `Pagination` component (NOT text-based counters)
  - Loading states → Use `Spinner` component (NOT custom spinners)
  - Alerts/messages → Use `Alert` component (NOT plain divs)
- **Data Tables**: ALWAYS use TanStack Table + shadcn pattern
  - Follow the pattern in `/components/dashboard/payments/` (columns.tsx, data-table.tsx, payments-table.tsx)
  - Industry-standard 2025 best practice for React data tables
  - Reusable for appointments, contacts, inventory, reviews, etc.
- **See `/docs/essentials/coding-patterns.md`** for complete implementation guide

### 7. NO TIMEFRAMES IN PLANNING

**CRITICAL: Never use time-based estimates in implementation plans**

- ❌ NO "Phase 1 (2 weeks)", "Week 1", "3 hours", "2 days", etc.
- ✅ YES "Phase 1", "Phase 2", "Step 1", "Step 2", "Next", "Then"
- ❌ NO "Estimated Timeline: 16 hours"
- ✅ YES Sequential ordering without duration estimates

**Why**: Timelines are rarely accurate and create false expectations. They confuse AI planning and cause scope creep when reality doesn't match estimates. Use sequential task ordering instead.

**Example - BAD:**

```markdown
## Phase 1: Component Consolidation (6 hours)

- Step 1: Update types (1 hour)
- Step 2: Move components (2 hours)
- Step 3: Testing (3 hours)
```

**Example - GOOD:**

```markdown
## Phase 1: Component Consolidation

- Step 1: Update types
- Step 2: Move components
- Step 3: Testing
```

Focus on WHAT needs to be done and in what ORDER, not HOW LONG it will take.

---

## 🏗️ ARCHITECTURE PRINCIPLES

### Vertical Slice Architecture

- Features organized by business capability
- Each slice contains all layers (UI, logic, data)
- Example: `/app/agency/[slug]/admin/courses/` contains everything for course management

### Multi-Tenant System

- Organization-based data isolation
- Role hierarchy: `platform_admin` → `agency_admin` → `user`
- Every query respects organization boundaries

### Server Components First

- Use Server Components by default
- Client components only for interactivity
- Headers via Named Slots (Parallel Routes)
- See `/docs/technical/NAMED-SLOTS-MIGRATION.md`

---

## 💻 ESSENTIAL COMMANDS

### Development (Claude can run these)

```bash
pnpm dev        # Start dev server (user monitors for OTP codes)
pnpm build      # Production build (MUST pass before committing)
pnpm lint       # Check code standards
pnpm format     # Auto-format code

# Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Push schema changes
pnpm seed:all        # Seed test data
```

**⚠️ IMPORTANT: When to Run Build**

- ❌ **DO NOT** run `pnpm build` during iterative development
- ❌ **DO NOT** build after every small change while still adjusting
- ✅ **ONLY BUILD** when user explicitly asks to commit or says "ready to commit"
- ✅ **ONLY BUILD** once at the end when changes are finalized

**Why:** Builds take 20-40 seconds. Running builds during active development wastes time. Wait until the user is ready to commit before verifying the build passes.

### Git Workflow (when user asks to commit)

```bash
# Always use this workflow when user says "commit this":
git status              # Check what changed
pnpm build             # MUST pass - verifies all imports exist
git add .              # Stage everything (safest approach)
git status             # Verify no red untracked files are needed
git commit -m "..."    # Commit with message
git push origin branch # Push when user asks
```

**Golden Rule**: Always `git add .` to stage everything. Local `pnpm build` uses ALL files (committed + uncommitted), but Vercel only gets committed files. If you forget to stage a file, local build passes but Vercel fails!

---

## 🎯 CURRENT PRIORITIES

**Phase 1: MVP Foundation** - See `/docs/IV-THERAPY-PHASE-PLAN.md` for detailed implementation plan

**Next 4 Features:**

1. **GHL API Integration** - Build GHLClient class (foundation for all features)
2. **Dashboard Real Data** - Replace mock widgets with GHL API
3. **Unified Inbox** - Message sync from GHL (SMS, FB, IG)
4. **Calendar Integration** - Cal.com with GHL contact sync

**Recently Completed** - See STATUS.md for full list:

- ✅ URL-based navigation tabs (NavTabs component with query parameters) - PR #42
- ✅ Named Slots migration (Server Component headers)
- ✅ All admin pages created (calendar, inventory, insights, analytics, settings, appointments, payments, reviews)
- ✅ Framework component refactoring (dashboard-layout → dashboard-content-wrapper)
- ✅ Conversations 3-column UI
- ✅ Mobile navigation, security headers, component duplication elimination

**Phase 2: AI Intelligence** - Vercel AI SDK, predictive analytics, smart automation

---

## 📚 ATTRIBUTION

**Important**: Much of this codebase was built following a course. When committing:

- ❌ Do NOT include "Generated with Claude Code" signatures
- ❌ Do NOT add "Co-Authored-By: Claude" attribution
- ✅ Keep commits clean and professional

---

**Remember**: You're working on a real production system. Prioritize stability, follow patterns, and always keep the user informed of changes.
