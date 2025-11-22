# Church Connect Card - Multi-Tenant SaaS Platform

**Purpose:** Technical context for AI coding assistant. For project planning, see `/docs/ROADMAP.md`.

---

## Tech Stack

- **Language:** TypeScript 5.x (strict mode)
- **Framework:** Next.js 15.3 (App Router, Server Components, Server Actions)
- **Runtime:** Node.js 20.x
- **Database:** PostgreSQL 16 (Neon) + Prisma ORM 5.x
- **Auth:** Better Auth with GitHub OAuth + Email OTP
- **Storage:** Tigris S3 (images, files)
- **AI:** Anthropic Claude Vision API (handwriting OCR)
- **Rate Limiting:** Arcjet
- **Package Manager:** pnpm
- **UI:** shadcn/ui + Tailwind CSS + Tabler Icons
- **Tables:** TanStack Table v8 (data grids)
- **Forms:** React Hook Form + Zod validation
- **Notifications:** Sonner (toast)

---

## Git Worktree Development

**This project uses git worktrees for feature isolation.** Each feature (prayer, volunteer, tech-debt, etc.) has its own worktree with isolated database and git history.

### Dependency Management

**CRITICAL:** Each worktree maintains its own `node_modules`. Do NOT use pnpm workspaces (they break Next.js/Turbopack module resolution in sibling directories).

**After merging PRs to main:**

```bash
# In the worktree where you merged changes
pnpm install
```

**After merging main into a feature worktree:**

```bash
# In the feature worktree
pnpm install
```

**Why independent node_modules:**

- ✅ Next.js/Turbopack module resolution works correctly
- ✅ Each worktree can have different dependency versions during development
- ✅ Standard git worktree pattern
- ❌ Small disk overhead (acceptable tradeoff)

**Preventing dependency drift:**

- Always run `pnpm install` after merging
- Check `package.json` for changes in PR reviews
- If TypeScript errors appear after merge, run `pnpm install`

---

## Commands

```bash
# Development
pnpm dev              # Start dev server (Turbopack)
pnpm prisma generate  # Generate Prisma client after schema changes
pnpm prisma db push   # Push schema changes (dev only)
pnpm seed:all         # Seed test data

# Quality (NEVER run during development - only before commit)
pnpm build            # Build for production (must pass)
pnpm lint             # ESLint (pre-commit hook runs this)
pnpm format           # Prettier (pre-commit hook runs this)

# Git (only when user explicitly says "commit this")
git add .             # Stage ALL files (Vercel needs everything)
git commit -m "..."   # Clean message (no AI attribution)
git push origin branch
```

**CRITICAL:** Always `git add .` before commit. Local build uses all files, Vercel only gets committed files.

---

## Architecture

```
/app/church/[slug]/admin/    # Multi-tenant church admin dashboard
/components/dashboard/       # Reusable dashboard components
/components/ui/              # shadcn/ui primitives
/lib/data/                   # Data access layer (scoped queries)
/actions/                    # Server actions (rate limited)
/prisma/                     # Database schema
/docs/                       # Technical documentation
```

**Multi-Tenant System:**

- Organizations = Churches
- Role hierarchy: `platform_admin` → `church_owner` → `church_admin` → `user`
- Every query must filter by `organizationId` (CRITICAL)
- Location-based filtering for multi-campus churches (`dataScope.filters`)

**Patterns:**

- Server Components by default (client components only for interactivity)
- Config-based navigation (`/lib/navigation.ts` - single source of truth)
- PageContainer for consistent spacing (`variant: "none" | "default" | "padded" | "fill" | "tight" | "tabs"`)
- TanStack Table for all data grids (see `/components/dashboard/payments/` reference pattern)
- shadcn/ui components first (check `/docs/essentials/shadcn.md` before building custom UI)

---

## Code Conventions

### Multi-Tenant Data Isolation

```typescript
// ALWAYS filter by organizationId - NO EXCEPTIONS
const volunteers = await prisma.volunteer.findMany({
  where: {
    organizationId: user.organizationId, // REQUIRED
    ...dataScope.filters.locationFilter, // Multi-campus
  },
});
```

### Server Actions Pattern

```typescript
"use server";
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { z } from "zod";

const aj = arcjet.withRule(
  fixedWindow({ mode: "LIVE", window: "1m", max: 10 })
);

export async function myAction(slug: string, data: unknown) {
  // 1. Auth + data scoping
  const { session, organization, dataScope } =
    await requireDashboardAccess(slug);

  // 2. Rate limiting
  const req = await request();
  const decision = await aj.protect(req, {
    fingerprint: `${session.user.id}_${organization.id}_action`,
  });
  if (decision.isDenied())
    return { status: "error", message: "Rate limit exceeded" };

  // 3. Validation
  const schema = z.object({
    /* ... */
  });
  const validated = schema.parse(data);

  // 4. Business logic with multi-tenant isolation
  await prisma.model.create({
    data: { ...validated, organizationId: organization.id }, // REQUIRED
  });

  return { status: "success" };
}
```

### Import Order

1. Framework imports (`react`, `next/...`)
2. Third-party libraries (`@tabler/icons-react`, `date-fns`)
3. Local imports (`@/components`, `@/lib`, `@/actions`)

### Naming

- **PascalCase:** Components, types, interfaces
- **camelCase:** Functions, variables
- **UPPER_CASE:** Constants, enums
- **kebab-case:** File names

### TypeScript

- Strict mode enabled
- No `any` types - use `unknown` and validate
- Explicit return types for server actions
- Use Zod for runtime validation

---

## Testing

- **Framework:** Playwright (E2E)
- **Location:** `/tests/e2e/`
- **Before commit:** All tests must pass
- **Run:** `pnpm test:e2e` (if tests exist)

---

## Critical Rules

<rule id="1" name="Multi-Tenant Isolation">
Every database query MUST filter by organizationId. Never query across organizations.
Use `requireDashboardAccess()` for auth + data scoping.
</rule>

<rule id="2" name="Server Action Security">
All server actions MUST include:
1. `requireDashboardAccess()` for auth
2. Arcjet rate limiting
3. Zod validation
4. Multi-tenant organizationId filtering
</rule>

<rule id="3" name="No Prop Drilling Server Actions">
Import server actions directly in client components. Never pass as callbacks through props.
See ADR-001 in `/docs/technical/architecture-decisions.md`
</rule>

<rule id="4" name="PageContainer Everywhere">
All admin pages MUST wrap content in `<PageContainer variant="...">`. Never use duplicate H1 headers.
Page titles come from `/lib/navigation.ts` config.
</rule>

<rule id="5" name="Shadcn Component-First">
Check `/docs/essentials/shadcn.md` before building custom UI. Install via `npx shadcn@latest add <component>`.
Use TanStack Table pattern from `/components/dashboard/payments/` for all data grids.
</rule>

<rule id="6" name="No Time Estimates">
Never use time-based estimates in plans or documentation (no "2 weeks", "3 hours", "Phase 1 (Nov 1-15)").
Use sequential ordering: "Phase 1", "Step 1", "Next", "Then".
</rule>

<rule id="7" name="No Autonomous Commits">
Never run `pnpm build`, `pnpm lint`, `pnpm format`, `git commit`, or `git push` without explicit user permission.
Wait for user to say "commit this" or "ready to commit".
</rule>

---

## Do NOT

- ❌ Query across organizations (violates multi-tenant isolation)
- ❌ Pass server actions as props (use direct imports)
- ❌ Use `any` type in TypeScript
- ❌ Create components without checking shadcn/ui first
- ❌ Run build/lint/format/commit without user permission
- ❌ Commit without staging all files (`git add .`)
- ❌ Include "Generated with Claude Code" attribution in commits
- ❌ Create TODO files (use `/docs/ROADMAP.md` or TodoWrite tool)
- ❌ Edit files in `.gitignore` (credentials, .env, etc.)

---

## Additional Documentation

- **Architecture:** @docs/essentials/architecture.md
- **Coding Patterns:** @docs/essentials/coding-patterns.md (MUST READ)
- **Shadcn Components:** @docs/essentials/shadcn.md
- **Project Status:** @docs/STATUS.md
- **Feature Roadmap:** @docs/ROADMAP.md
- **Volunteer Feature:** @docs/volunteer-feature-roadmap.md
- **ADR Log:** @docs/technical/architecture-decisions.md

---

## Git Workflow

**For worktree integration:** Use `/plan-integration` command - handles Step 0 (clean main), formatting, building, and staging automatically.

**For regular commits:** Only when user explicitly says "commit this":

1. Format → Build → Stage → Commit → Push
2. Always `git add .` (Vercel only sees committed files)

---

## Session Start Checklist

1. Read `/docs/STATUS.md` - Current working/broken features
2. Read `/docs/ROADMAP.md` - Current priorities
3. Read `/docs/essentials/coding-patterns.md` - How to write code
4. Check TodoWrite tool for active tasks
5. Never run build/lint/format without permission

---

**Character Count:** <!-- Run `wc -c CLAUDE.md` to verify under 40k -->
