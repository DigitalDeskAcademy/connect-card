# Church Connect Hub

**Purpose:** Technical context for AI coding assistant. For project planning, see `docs/`.

---

## Tech Stack

- **Language:** TypeScript 5.x (strict mode)
- **Framework:** Next.js 15.3 (App Router, Server Components, Server Actions)
- **Runtime:** Node.js 20.x
- **Database:** PostgreSQL 16 (Neon) + Prisma ORM 5.x
- **Auth:** Better Auth (GitHub OAuth + Email OTP)
- **Storage:** Tigris S3
- **AI:** Anthropic Claude Vision API
- **Rate Limiting:** Arcjet
- **Package Manager:** pnpm
- **UI:** shadcn/ui + Tailwind CSS + Tabler Icons
- **Tables:** TanStack Table v8
- **Forms:** React Hook Form + Zod
- **Notifications:** Sonner (toast)

---

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (Turbopack)
pnpm prisma generate  # Generate Prisma client after schema changes
pnpm prisma db push   # Push schema changes (dev only)
pnpm seed:all         # Seed test data
pnpm build            # Build for production (run before commit)
pnpm lint             # ESLint
pnpm format           # Prettier
```

---

## Code Conventions

- TypeScript strict mode - no `any` types, use `unknown` + validate
- Server Components by default - client only for interactivity
- Import order: 1) Framework (`react`, `next/`), 2) Third-party, 3) Local (`@/`)
- PascalCase: Components, types, interfaces
- camelCase: Functions, variables
- UPPER_CASE: Constants, enums
- kebab-case: File names
- Explicit return types for server actions

---

## Architecture

```
/app/church/[slug]/admin/    # Multi-tenant church admin dashboard
/components/dashboard/       # Feature-specific shared components
/components/ui/              # shadcn/ui primitives (DO NOT MODIFY)
/lib/data/                   # Data access layer (organizationId scoped)
/actions/                    # Server actions (rate limited)
/prisma/schema.prisma        # Database schema
```

**Multi-Tenant:** Organizations = Churches. Every query MUST filter by `organizationId`.

---

## Critical Rules

<rule id="1" name="Multi-Tenant Isolation">
Every database query MUST filter by organizationId. Never query across organizations.
Use `requireDashboardAccess(slug)` for auth + data scoping.
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
</rule>

<rule id="4" name="PageContainer Wrapper">
All admin pages MUST wrap content in `<PageContainer variant="...">`.
Page titles come from `/lib/navigation.ts` config.
</rule>

<rule id="5" name="Shadcn Component-First">
Check existing shadcn/ui components before building custom UI.
Use TanStack Table pattern from `/components/dashboard/` for all data grids.
</rule>

<rule id="6" name="No Autonomous Commits">
Never run `git commit`, `git push`, `pnpm build`, `pnpm lint`, or `pnpm format` without explicit user permission.
</rule>

<rule id="7" name="CSS: Never Escape Tailwind Class Colons">
Tailwind classes use colons (print:hidden, md:flex). NEVER escape them in raw CSS.
- ❌ `.print\:hidden` - Breaks in Turbopack
- ❌ `.print\\:hidden` - Parser-dependent
- ✅ Let Tailwind handle it (preferred) - Just use class in JSX
- ✅ `[data-no-print]` - Use data attributes for custom targeting
- ✅ `[class*="print:hidden"]` - Attribute selector (last resort)
</rule>

---

## Testing

- **Framework:** Playwright (E2E)
- **Location:** `/tests/e2e/`
- **Run:** `pnpm test:e2e`
- All tests must pass before commit

---

## Do NOT

- ❌ Query across organizations (violates multi-tenant isolation)
- ❌ Pass server actions as props (use direct imports)
- ❌ Use `any` type in TypeScript
- ❌ Modify files in `/components/ui/` (shadcn primitives)
- ❌ Run build/lint/format/commit without user permission
- ❌ Commit without staging all files (`git add .`)
- ❌ Create TODO files (use `docs/` structure)
- ❌ Add time estimates to plans
- ❌ Edit `.env` files or credentials

---

## Additional Documentation

- Project Dashboard: @docs/WORKTREE-STATUS.md
- Technical Patterns: @docs/PLAYBOOK.md
- Business Context: @docs/PROJECT.md
- Testing Strategy: @docs/technical/testing-strategy.md

### Feature Specs

- Connect Cards: @docs/features/connect-cards/vision.md
- Integrations: @docs/features/integrations/vision.md
- Volunteer: @docs/features/volunteer/vision.md
- Prayer: @docs/features/prayer/vision.md
- GHL Integration: @docs/features/ghl-integration/vision.md
