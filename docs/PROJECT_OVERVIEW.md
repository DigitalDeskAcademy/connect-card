# Church Connect Card - Project Overview

## Executive Summary

**Church Connect Card** is a multi-tenant SaaS platform that digitizes and automates church connect card processing. Churches scan physical connect cards, extract data via AI Vision, and automatically follow up with visitors through SMS/email campaigns.

**Business Problem**: Churches manually enter connect card data (visitor info, prayer requests) which is slow, error-prone, and leads to poor visitor follow-up.

**Solution**: Scan → Extract → Automate. Churches photograph connect cards, our Claude Vision AI extracts structured data with contextual understanding, and automated workflows handle visitor engagement.

---

## Project Origin

This project was **forked from SideCar Platform** - a proven multi-tenant SaaS boilerplate. We inherited:

- Battle-tested multi-tenant architecture
- Authentication system (Better Auth)
- Payment processing (Stripe)
- LMS system (courses/lessons)
- Dashboard layouts and patterns

**Critical**: Always check original SideCar patterns before deviating. The forked code contains proven architectural decisions.

---

## Tech Stack

### Core Framework

- **Next.js 15** - App Router with Server Components
- **React 19** - Latest React features
- **TypeScript** - Strict mode enabled
- **Tailwind CSS** - Utility-first styling

### Database & ORM

- **Neon PostgreSQL** - Serverless Postgres
- **Prisma 6** - Type-safe ORM with migrations
- **Better Auth** - Modern authentication library

### UI Components

- **shadcn/ui** - Radix UI + Tailwind components
- **Tabler Icons** - Icon library
- **TanStack Table** - Data tables

### Services & Integrations

- **Stripe** - Payment processing
- **Tigris S3** - File storage for connect card images
- **Claude Vision API (Anthropic)** - AI-powered structured data extraction from handwritten connect cards
- **GoHighLevel (GHL)** - CRM integration for SMS/automations

### Dev Tools

- **pnpm** - Package manager
- **ESLint** - Linting
- **Prettier** - Code formatting (via pre-commit hooks)

---

## Architecture

### Multi-Tenant System

**Organization-Based Isolation**

- Every church is an `Organization` entity
- All queries filter by `organizationId`
- URL structure: `/church/[slug]/...` for tenant isolation

**User Roles Hierarchy**

1. `platform_admin` - Platform operators (us)
2. `agency_admin` - Church administrators
3. `user` - Church staff/members

### Vertical Slice Architecture

Features organized by business capability, not technical layer:

```
app/
├── church/[slug]/
│   ├── admin/           # Church admin area
│   │   ├── n2n/         # Connect cards
│   │   ├── courses/     # Training center
│   │   ├── contacts/    # Member management
│   │   └── ...
│   └── learning/        # Member training portal
└── platform/admin/      # Platform admin area
```

Each slice contains:

- UI components
- Server actions
- Business logic
- Data access

### Server Components First

- Default to Server Components
- Client Components (`"use client"`) only for interactivity
- Server Actions for mutations (not API routes)
- No callback props - import server actions directly

---

## Key Features

### Phase 1: Foundation (Current)

- ✅ Forked from SideCar Platform
- ✅ Removed inventory/reviews features
- ✅ Clean git history (no secrets)
- ✅ Navigation refactor (centralized config)
- ⏳ Environment setup
- ⏳ Branding updates

### Phase 2: Connect Card MVP

1. **Image Upload** - S3 storage for card photos
2. **AI Vision Processing** - Extract structured data (names, emails, phone, prayer requests) using Claude Vision API
3. **Manual Correction** - UI to review and edit AI-extracted data
4. **Member Database** - Store visitor information

### Phase 3: Automation

1. **GHL Integration** - Connect as sub-agency
2. **SMS Campaigns** - Automated visitor follow-up
3. **Email Campaigns** - Drip campaigns for first-time visitors
4. **Unified Inbox** - Pull GHL conversations into dashboard

### Phase 4: Advanced Features

- Small group management
- Volunteer scheduling enhancements
- Event check-in system
- Analytics dashboard

---

## Critical Coding Patterns

### 1. Multi-Tenant Data Isolation

**EVERY query must filter by organizationId:**

```typescript
// ❌ WRONG - Cross-tenant data leak
const courses = await db.course.findMany();

// ✅ CORRECT - Tenant-isolated
const courses = await db.course.findMany({
  where: { organizationId: org.id },
});
```

### 2. Server Actions Pattern

**Import actions directly, never pass as props:**

```typescript
// ❌ WRONG - Passing action as callback
<DeleteButton onDelete={deleteAction} />

// ✅ CORRECT - Import directly in component
import { deleteAction } from '@/actions/delete-course';
<DeleteButton /> // Calls deleteAction internally
```

**Why**: See ADR-001 in `/docs/technical/architecture-decisions.md`

### 3. Authentication & Authorization

```typescript
// Church admin access
const { org, user } = await requireDashboardAccess();

// Platform admin access
const user = await requireAdmin();
```

### 4. Rate Limiting

All server actions must include rate limiting:

```typescript
import { arcjet } from "@/lib/arcjet";

export async function createCourse(data: FormData) {
  const decision = await arcjet.protect(request);
  if (decision.isDenied()) throw new Error("Rate limited");

  // ... business logic
}
```

### 5. Navigation Configuration

**Single source of truth in `/lib/navigation.ts`:**

```typescript
export function getChurchNavigation(slug: string): NavigationConfig {
  return {
    navMain: [
      { title: "Dashboard", url: `/church/${slug}/admin`, icon: IconHome },
      // Icons included directly (not index-based mapping)
    ],
  };
}
```

- Sidebars and headers use this config
- Always include icons directly in config
- Use Tabler's `Icon` type for type safety

### 6. Component Patterns

**Always check shadcn/ui first:**

- 100+ pre-built components available
- Install via `npx shadcn@latest add <component>`
- See `/docs/essentials/shadcn.md` for full list

**Data Tables:**

- Use TanStack Table + shadcn pattern
- Reference: `/components/dashboard/payments/`
- Industry standard for 2025

---

## Database Schema

### Core Models

**Organization** - Multi-tenant churches

```prisma
model Organization {
  id                   String              @id @default(uuid())
  name                 String              // "First Baptist Church"
  slug                 String              @unique // URL-friendly
  subscriptionStatus   SubscriptionStatus  @default(TRIAL)
  stripeCustomerId     String?             @unique
}
```

**User** - Church administrators and staff

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  role           UserRole @default(USER)
  organizationId String
}
```

**ConnectCard** - Scanned connect cards

```prisma
model ConnectCard {
  id             String   @id @default(uuid())
  imageUrl       String   // S3 URL to scanned image
  extractedData  Json     // AI Vision extraction results
  status         String   // pending, verified, processed
  organizationId String
}
```

**Course/Chapter/Lesson** - Training system (inherited from SideCar)

- Used for staff training
- Tracks lesson progress
- Supports video content

**ChurchMember** - Member directory

- Repurposed from Contacts model
- Tracks engagement
- Links to connect cards

---

## File Structure

```
connect-card/
├── app/                      # Next.js App Router
│   ├── church/[slug]/       # Multi-tenant church routes
│   │   ├── admin/           # Church admin dashboard
│   │   └── learning/        # Member training portal
│   └── platform/admin/      # Platform administration
├── components/
│   ├── sidebar/             # Navigation components
│   ├── dashboard/           # Reusable dashboard components
│   └── ui/                  # shadcn components
├── lib/
│   ├── auth.ts             # Better Auth config
│   ├── navigation.ts       # Centralized nav config
│   └── generated/prisma/   # Generated Prisma Client
├── actions/                 # Server actions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed-*.ts           # Seed scripts
├── docs/
│   ├── STATUS.md           # Current project state
│   ├── ROADMAP.md          # Task priorities
│   └── essentials/
│       ├── coding-patterns.md
│       └── architecture.md
└── CLAUDE.md               # AI session instructions
```

---

## Development Workflow

### Local Setup

```bash
# Install dependencies
pnpm install

# Push schema to database (creates tables)
pnpm prisma db push

# Seed test data
pnpm seed:all

# Start dev server
pnpm dev
```

### Database Operations

```bash
# Generate Prisma Client after schema changes
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name description

# View data in Prisma Studio
pnpm prisma studio
```

### Build & Deploy

```bash
# Build for production (must pass before commit)
pnpm build

# Format/lint (handled by pre-commit hooks)
pnpm format
pnpm lint
```

---

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication (Better Auth)
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Storage (Tigris S3)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
S3_BUCKET_NAME=""

# GoHighLevel (future)
GHL_CLIENT_ID=""
GHL_CLIENT_SECRET=""
```

---

## Key Decisions & ADRs

### ADR-001: Server Actions Over Callbacks

- **Decision**: Import server actions directly, don't pass as props
- **Rationale**: Better type safety, clearer data flow, prevents serialization issues
- **Location**: `/docs/technical/architecture-decisions.md`

### ADR-005: Named Slots for Page Headers (Now Deprecated)

- **Original**: Used Next.js Parallel Routes (@header) for page titles
- **Changed To**: Centralized navigation config in `/lib/navigation.ts`
- **Rationale**: Simpler maintenance, single source of truth for MVP scale

### Navigation Pattern

- **Decision**: Sidebar is source of truth for page titles
- **Implementation**: `/lib/navigation.ts` exports config functions
- **Why**: Keeps sidebar and headers in sync automatically

---

## Business Model

**Target Market**: Small to mid-size churches (100-2000 members)

**Pricing** (Proposed):

- Trial: 14 days free
- Starter: $49/mo - Up to 100 connect cards/month
- Growth: $99/mo - Up to 500 connect cards/month
- Enterprise: Custom - Unlimited + dedicated support

**Revenue Streams**:

1. Monthly SaaS subscriptions
2. SMS/Email campaign credits (via GHL)
3. Professional services (setup assistance)

**Competition**:

- Planning Center Online (complex, expensive)
- ChurchTrac (dated UI)
- Manual processes (our main competitor)

**Differentiation**:

- AI Vision automation (no manual entry - contextual data extraction)
- Modern UI/UX
- Integrated follow-up workflows
- Affordable pricing

---

## Deployment

### Production Environment

- **Hosting**: Vercel (Next.js native)
- **Database**: Neon PostgreSQL (serverless)
- **Storage**: Tigris S3 (S3-compatible)
- **Domain**: TBD

### CI/CD Pipeline

- Push to `main` → Auto-deploy to production
- Pull requests → Preview deployments
- Pre-commit hooks → Format/lint
- Build check → Must pass before merge

---

## Documentation Structure

**Start Here for Every Session:**

1. `/docs/STATUS.md` - What's working/broken right now
2. `/docs/ROADMAP.md` - Task priorities
3. `/docs/essentials/coding-patterns.md` - How to write code
4. `CLAUDE.md` - AI session instructions

**Deep Dives:**

- `/docs/essentials/architecture.md` - System design
- `/docs/technical/architecture-decisions.md` - ADRs
- `/docs/essentials/development.md` - Local setup
- `/docs/FORK_SETUP_GUIDE.md` - Fork history

---

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build (required before commit)

# Database
pnpm prisma generate        # Generate client after schema changes
pnpm prisma db push         # Push schema to database
pnpm prisma studio          # Visual database editor
pnpm seed:all               # Seed test data

# Git Workflow
git checkout -b feat/name   # Create feature branch
git add .                   # Stage all changes
git commit -m "message"     # Commit (triggers format/lint)
git push origin branch      # Push to remote
gh pr create                # Create pull request
```

---

## Known Issues & Limitations

### Current State (Phase 1)

- AI Vision integration complete (Claude Vision API)
- GHL integration not implemented yet
- Payment flow exists but not church-customized
- Some placeholder pages need real implementation

### Technical Debt

- Some warnings in TanStack Table usage (acceptable)
- Need to add comprehensive error boundaries
- Missing E2E tests

### Future Considerations

- Mobile app for scanning cards
- Offline mode for scanning during services
- Integration with church management systems (CCB, FellowshipOne)
- Multi-language support for international churches

---

## Team & Communication

**Project Owner**: [User]
**Development**: AI-assisted development with Claude Code
**Architecture**: Based on SideCar Platform patterns

**Communication Channels**:

- GitHub Issues for bug tracking
- GitHub Projects for roadmap management
- Documentation in `/docs` for architectural decisions

---

## Success Metrics

### MVP Launch Goals

- 10 beta churches onboarded
- 95%+ AI extraction accuracy on connect cards
- <5 second average processing time
- 80%+ visitor follow-up rate

### Growth Goals (12 months)

- 100 paying churches
- $10K MRR (Monthly Recurring Revenue)
- 10K+ connect cards processed monthly
- 4.5+ star rating from customers

---

## Quick Reference

**When you need to:**

- Add a new page → Check `/app` structure, follow vertical slice pattern
- Add navigation item → Update `/lib/navigation.ts`
- Query database → Always filter by `organizationId`
- Use icons → Import from `@tabler/icons-react`
- Add UI component → Check shadcn first: `npx shadcn@latest add <name>`
- Create server action → Import Arcjet for rate limiting
- Fix build errors → Run `pnpm build` to see TypeScript errors
- Check schema → Open `/prisma/schema.prisma`

**Critical Files:**

- `CLAUDE.md` - AI instructions
- `/docs/STATUS.md` - Current state
- `/docs/ROADMAP.md` - Next priorities
- `/lib/navigation.ts` - Navigation config
- `/prisma/schema.prisma` - Database schema
- `/lib/auth.ts` - Authentication helpers

---

**Last Updated**: October 2025
**Project Phase**: Phase 1 - Foundation
**Status**: Active Development
