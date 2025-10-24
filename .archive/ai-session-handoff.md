# AI Session Handoff Document

⚠️ **CRITICAL INSTRUCTION FOR AI**: Before doing ANYTHING else, you MUST read ALL documents listed in the "MANDATORY" section below. This is your FIRST task, no exceptions. Failure to read these documents will cause you to violate project patterns and create bugs.

**Last Updated**: 2025-01-21
**Project**: Sidecar Platform - B2B Software Customer Onboarding Solution
**Status**: MVP Complete, Preparing for Component Refactoring
**Current Branch**: `main` (check with `git branch`)

## 🎯 Quick Start for New AI Sessions

You are working on **Sidecar Platform**, a production-ready B2B SaaS that helps software companies reduce churn by transforming complex onboarding into guided workflows. The platform is built for GoHighLevel agencies initially but designed for any B2B software company.

### Essential Commands

```bash
pnpm dev        # Dev server (user manages for OTP codes)
pnpm build      # Production build (must pass)
pnpm lint       # Linting (must be clean)
pnpm format     # Auto-format code
```

## 🚨 MANDATORY: READ ALL THESE DOCUMENTS IMMEDIATELY 🚨

**STOP! Before doing ANYTHING else, you MUST read ALL of these documents. This is NOT optional.**

### Step 1: Read EVERY Document in project-essentials folder

```bash
# YOU MUST READ ALL 5 FILES IN THIS FOLDER - NO EXCEPTIONS
/docs/project-essentials/
├── architecture.md           # Multi-tenant architecture & business vision (CRITICAL)
├── coding-patterns.md        # Detailed coding standards (duplicate of root, but read it)
├── development.md            # Development setup and workflows
├── git-branching-strategy.md # Git workflow and branch management
└── security-overview.md      # Security requirements and patterns
```

### Step 2: Read These Core Documents (IN THIS ORDER)

1. **`/CODING_PATTERNS.md`** - MEMORIZE these patterns - NEVER deviate
2. **`/CLAUDE.md`** - Project-specific instructions and rules
3. **`/TODO.md`** - Current bugs and blockers
4. **`/docs/critical-docs/TECHNICAL-DEBT.md`** - 40% code duplication issue & solution
5. **`/docs/architecture/component-refactoring-plan.md`** - Detailed refactoring implementation
6. **`/docs/action-plan-living-document.md`** - Current sprint priorities

### Step 3: Confirm You've Read Everything

After reading, acknowledge: "I have read all project-essentials documents and the 4 core documents."

**If you skip these documents, you WILL make mistakes that break established patterns.**

## 🏗️ Technical Stack & Architecture

### Core Technologies

- **Framework**: Next.js 15.3.4 + React 19 + TypeScript 5
- **Database**: Neon PostgreSQL + Prisma ORM 6.10.1
- **Auth**: Better Auth 1.2.9 (Email OTP + GitHub OAuth)
- **Payments**: Stripe 18.4.0 (subscription model)
- **Storage**: Tigris S3 (file uploads)
- **Security**: Arcjet (rate limiting)

### Multi-Tenant Architecture

```
Platform (Sidecar) → Organizations (Agencies) → Users (Employees)
```

- Organizations have isolated data environments
- Courses can be platform-wide or organization-specific
- URL pattern: `/agency/[slug]/...` for tenant-specific routes

## ⚠️ CRITICAL RULES - MUST FOLLOW

### Git Safety

- **NEVER** run `git push` without explicit user permission
- **ALWAYS** work in feature branches, not main
- **ALWAYS** ask before pushing to GitHub

### Code Patterns

- **ALWAYS** check `CODING_PATTERNS.md` before writing code
- **ALWAYS** use `ApiResponse` type for server actions
- **ALWAYS** include rate limiting in server actions
- **NEVER** create new patterns without checking existing ones
- **NEVER** use console.log/error in production code

### Authentication

- Use `requireUser()` or `requireAdmin()` helpers
- User manages dev server to see OTP codes in console
- OTP codes appear as: `🔐 DEVELOPMENT OTP CODE: 123456`

## 🚀 Current Development Focus

### Active Sprint (Component Refactoring Focus)

1. **Component Extraction** - Eliminating 1,662 lines of duplicated code
   - Extract EditCourseForm.tsx (331 lines × 2)
   - Extract CourseStructure.tsx (497 lines × 2)
   - See `/docs/architecture/component-refactoring-plan.md`
2. **Course Content Recording** - Creating first course for MVP launch
3. **Production Blockers** - Console.log removal, Stripe webhook fix

### Known Production Blockers

1. **Code Duplication Crisis** - 40% of codebase duplicated between platform/agency routes
2. **Mobile Navigation Broken** - No mobile menu, users stuck on landing
3. **Stripe Architecture Mismatch** - Schema requires per-course pricing but platform uses subscription
4. **Console Logging in Production** - Security risk, OTP codes visible
5. **Missing Cancel Button** - Requires changes in multiple duplicated files

## 🔧 Common Development Tasks

### Working with Multi-Tenant Data

```typescript
// Always scope to organization
const { organization } = await requireAgencyAdmin(slug);
await prisma.course.create({
  data: {
    ...data,
    organizationId: organization.id, // REQUIRED
  },
});
```

### Creating Server Actions

```typescript
// Follow template in CODING_PATTERNS.md exactly
"use server";
// 1. Auth check
// 2. Rate limiting
// 3. Validation
// 4. Business logic with generic errors
// 5. Return ApiResponse
```

### Form Components

- Use shadcn UI components
- Follow patterns from `/app/(auth)/login/_components/LoginForm.tsx`
- Always use `useTransition` for loading states

## 📁 Project Structure

```
app/
├── (auth)/          # Authentication flows
├── admin/           # Platform admin (Sidecar staff)
├── agency/[slug]/   # Multi-tenant agency routes
├── platform/        # Platform-wide features
├── api/            # API routes (webhooks, S3)
└── data/           # Data access layer

docs/
├── critical-docs/
│   ├── ai-session-handoff.md        # This file
│   ├── TECHNICAL-DEBT.md            # 40-hour refactoring plan
│   └── action-plan-living-document.md
├── architecture/
│   └── component-refactoring-plan.md # 6-8 hour immediate fix
└── project-essentials/              # Core architecture docs
```

## 🐛 Quick Troubleshooting

### Build Errors

- Run `pnpm lint` and fix any issues
- Check for unused variables in catch blocks
- Verify all imports are correct

### Auth Issues

- Check Better Auth setup in `/lib/auth.ts`
- Verify environment variables are set
- User needs to monitor dev server for OTP codes

### Multi-Tenant Issues

- Ensure `organizationId` is included in all tenant-scoped queries
- Use `requireAgencyAdmin(slug)` for agency routes
- Platform courses have `organizationId: null`

## 🎯 Business Context

**Problem**: B2B software companies lose customers during onboarding due to complexity
**Solution**: Structured onboarding workflows with progress tracking
**Target**: GoHighLevel agencies initially, expanding to all B2B software
**Model**: $297/month subscription for platform access (not per-course)

## 📋 Environment Variables (19 Required)

Critical ones to verify:

- `BETTER_AUTH_URL` - Must be production domain (not localhost)
- `STRIPE_SECRET_KEY` - Use production key for live deployment
- `AWS_ENDPOINT_URL_S3` - Tigris endpoint: `https://t3.storage.tigris.dev`

## 🚦 Development Workflow

1. **Check current branch**: `git branch`
2. **Read living documents** listed above
3. **Follow CODING_PATTERNS.md** exactly
4. **Test with**: `pnpm lint && pnpm build`
5. **Commit locally**, ask permission to push
6. **Use TodoWrite tool** for complex tasks

## 💡 Key Decisions & Context

- **Vertical Slice Architecture**: Features organized by business capability
- **Component-Based Composition**: Moving from route-based to component-based architecture
- **Subscription Model**: Platform subscription, not per-course pricing
- **Multi-Tenant First**: All new features must consider organization isolation
- **Production Ready**: MVP complete, focusing on stability and polish
- **Project uses `select` pattern**: NEVER use `include` in Prisma queries

## 🔗 Quick Links

- **Repo**: Check git remote for repository URL
- **Deployment**: Vercel (environment variables required)
- **Database**: Neon PostgreSQL (connection string in .env)
- **File Storage**: Tigris S3 (organized by org/course)

---

**Remember**: When in doubt, check the living documents. They are the source of truth and updated regularly. This handoff document provides context and pointers, but always verify current state in the living documents listed above.

## 🎯 TOP PRIORITIES (Maximum 3 Items)

**Rule**: This section maintains exactly 1-3 highest priority items. To add a new priority, one must be removed or completed.

### Current Priorities (Updated: 2025-01-21)

1. **Component Refactoring** - CRITICAL: Extract EditCourseForm & CourseStructure (6-8 hours)
2. **Record Course Content** - URGENT: Can't launch without actual course content
3. **Fix Mobile Navigation** - CRITICAL: Entire site unusable on mobile devices
