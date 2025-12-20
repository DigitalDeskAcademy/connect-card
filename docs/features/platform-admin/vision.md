# Platform Admin Modernization

> 📋 **STATUS: FUTURE WORK (Dec 2025)**
>
> This is a wishlist item. Not being actively worked on.
> Post-demo priorities focus on: Planning Center API, Deduplication,
> Keyword Detection, and Volunteer Event Tracking.
> Platform admin modernization deferred until those are complete.

**Status:** Planning
**Priority:** Future (post-MVP)
**Branch:** `feature/platform-admin` (not yet created)
**Port:** 3005
**Last Updated:** 2025-12-17

---

## Executive Summary

The platform admin (`/app/platform/admin/`) has fallen significantly behind the church admin (`/app/church/[slug]/admin/`). While church admin received 20+ PRs with multi-tenant security, UI improvements, and feature completions, platform admin remains in a "skeleton" state with mostly placeholder pages and mock data.

**Goal:** Bring platform admin to production-ready state with full feature parity, consistent patterns, and proper security.

---

## Current State Assessment

### Page Inventory

| Page          | Current State               | Data Source | Security | Priority |
| ------------- | --------------------------- | ----------- | -------- | -------- |
| Dashboard     | Placeholder ("coming soon") | None        | N/A      | P1       |
| Contacts      | Stub (NavTabs only)         | Empty array | **NONE** | P1       |
| Team          | Placeholder text            | None        | N/A      | P2       |
| Conversations | Working demo                | Mock data   | N/A      | P2       |
| Courses       | **Working**                 | Real DB     | OK       | -        |
| Payments      | Demo                        | Mock data   | N/A      | P2       |
| Analytics     | Demo                        | Mock JSON   | N/A      | P3       |
| API           | **Working**                 | Real DB     | OK       | -        |
| Settings      | Empty                       | None        | N/A      | P3       |
| Profile       | Empty                       | None        | N/A      | P3       |
| Help          | Empty                       | None        | N/A      | P4       |
| Search        | Empty                       | None        | N/A      | P4       |
| Projects      | Empty                       | None        | N/A      | P4       |
| Appointments  | Stub                        | None        | N/A      | P3       |

### Critical Gaps

1. **No Multi-Tenant Filtering** - Pages render data without `organizationId` scoping
2. **Different Auth Pattern** - Uses `requireAdmin()` vs `requireDashboardAccess()`
3. **No Data Access Layer** - No `/lib/data/platform-*.ts` files
4. **Stale UI Patterns** - Missing NavTabs overflow, quick actions, badge standardization
5. **Mock Data Everywhere** - Only Courses and API use real database

---

## Architecture Decisions

### Auth Pattern

Platform admin serves **platform owners** (us) who need cross-organization visibility.

```typescript
// NEW: Platform-specific auth helper
export async function requirePlatformAccess() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  // Check for platform admin role (new role needed)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { platformRole: true },
  });

  if (user?.platformRole !== "PLATFORM_ADMIN") {
    redirect("/not-admin");
  }

  return { user, session };
}
```

### Data Access Pattern

Platform admin needs **cross-org queries** but with explicit intent:

```typescript
// /lib/data/platform/organizations.ts
export async function getAllOrganizations(options?: {
  status?: SubscriptionStatus;
  limit?: number;
  offset?: number;
}) {
  return prisma.organization.findMany({
    where: { status: options?.status },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
    orderBy: { createdAt: "desc" },
  });
}

// /lib/data/platform/contacts.ts
export async function getPlatformContacts(options?: {
  organizationId?: string; // Optional - filter to specific org
  limit?: number;
  offset?: number;
}) {
  return prisma.churchMember.findMany({
    where: options?.organizationId
      ? { organizationId: options.organizationId }
      : {},
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
    include: { organization: { select: { name: true, slug: true } } },
  });
}
```

### Component Strategy

Reuse church admin components where possible:

| Component       | Strategy                                             |
| --------------- | ---------------------------------------------------- |
| `PageContainer` | Already shared                                       |
| `NavTabs`       | Already shared (add overflow support)                |
| `DataTable`     | Use unified `/components/data-table/`                |
| `QuickActions`  | Extract from church admin, make generic              |
| Dashboard cards | Create shared `/components/dashboard/stats-card.tsx` |

---

## Phased Implementation Plan

### Phase 1: Foundation & Security (Week 1)

**Goal:** Establish secure patterns before adding features.

| #   | Task                           | Description                               | Files                                             |
| --- | ------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| 1.1 | Create platform auth helper    | `requirePlatformAccess()` with role check | `/lib/auth/platform.ts`                           |
| 1.2 | Add PlatformRole to schema     | PLATFORM_ADMIN, PLATFORM_VIEWER           | `schema.prisma`                                   |
| 1.3 | Create data access layer       | `/lib/data/platform/` directory           | `organizations.ts`, `contacts.ts`, `analytics.ts` |
| 1.4 | Update layout with auth        | Protect all platform routes               | `/app/platform/admin/layout.tsx`                  |
| 1.5 | Add platform navigation config | Separate nav config for platform          | `/lib/platform-navigation.ts`                     |

**Definition of Done:**

- [ ] Platform routes require PLATFORM_ADMIN role
- [ ] Data layer exists with proper typing
- [ ] No direct Prisma calls in page components

---

### Phase 2: Dashboard & Organizations (Week 2)

**Goal:** Real dashboard with organization management.

| #   | Task                    | Description                                | Files                                                   |
| --- | ----------------------- | ------------------------------------------ | ------------------------------------------------------- |
| 2.1 | Dashboard stats cards   | Real metrics (orgs, users, cards, revenue) | `/app/platform/admin/page.tsx`                          |
| 2.2 | Quick actions grid      | Adopt church admin pattern                 | `/app/platform/admin/page.tsx`                          |
| 2.3 | Organizations page      | List all churches with status              | `/app/platform/admin/organizations/page.tsx` (new)      |
| 2.4 | Organization detail     | View single org's data                     | `/app/platform/admin/organizations/[id]/page.tsx` (new) |
| 2.5 | Subscription management | Update org subscription status             | Server action                                           |

**Definition of Done:**

- [ ] Dashboard shows real metrics from database
- [ ] Can view all organizations
- [ ] Can update subscription status
- [ ] Quick actions work (view orgs, add org, etc.)

---

### Phase 3: Contacts & Team (Week 3)

**Goal:** Cross-org contact visibility and platform team management.

| #   | Task                     | Description                        | Files                                      |
| --- | ------------------------ | ---------------------------------- | ------------------------------------------ |
| 3.1 | Contacts with org filter | DataTable with organization column | `/app/platform/admin/contacts/page.tsx`    |
| 3.2 | Contact search           | Search across all orgs             | Server action                              |
| 3.3 | Platform team page       | Manage platform admins             | `/app/platform/admin/team/page.tsx`        |
| 3.4 | Invite platform admin    | Email invitation flow              | Server action                              |
| 3.5 | Audit log viewer         | See who did what across platform   | `/app/platform/admin/audit/page.tsx` (new) |

**Definition of Done:**

- [ ] Can view contacts across all organizations
- [ ] Can filter by organization
- [ ] Can manage platform admin team
- [ ] Audit log shows recent actions

---

### Phase 4: Conversations & Messaging (Week 4)

**Goal:** Cross-org conversation monitoring and bulk messaging.

| #   | Task                 | Description                 | Files                                          |
| --- | -------------------- | --------------------------- | ---------------------------------------------- |
| 4.1 | Real conversations   | Replace mock with GHL API   | `/app/platform/admin/conversations/page.tsx`   |
| 4.2 | Conversation filters | Filter by org, status, type | Client component                               |
| 4.3 | Bulk messaging UI    | Send to multiple orgs       | `/app/platform/admin/messaging/page.tsx` (new) |
| 4.4 | Message templates    | Platform-level templates    | `/app/platform/admin/templates/page.tsx` (new) |
| 4.5 | Delivery tracking    | Track sent messages         | Database + UI                                  |

**Definition of Done:**

- [ ] Can view real conversations from GHL
- [ ] Can send platform announcements
- [ ] Message templates saved to database
- [ ] Delivery tracking works

---

### Phase 5: Analytics & Reporting (Week 5)

**Goal:** Platform-wide analytics and reporting.

| #   | Task                    | Description                         | Files                                        |
| --- | ----------------------- | ----------------------------------- | -------------------------------------------- |
| 5.1 | Platform metrics        | Cards processed, users active, etc. | `/app/platform/admin/analytics/page.tsx`     |
| 5.2 | Organization comparison | Compare orgs by activity            | Charts                                       |
| 5.3 | Revenue dashboard       | MRR, churn, growth                  | `/app/platform/admin/revenue/page.tsx` (new) |
| 5.4 | Usage reports           | Exportable CSV reports              | Server action                                |
| 5.5 | Health monitoring       | Org health scores                   | `/lib/data/platform/health.ts`               |

**Definition of Done:**

- [ ] Platform-wide metrics displayed
- [ ] Can compare organizations
- [ ] Revenue tracking works
- [ ] Can export usage reports

---

### Phase 6: Settings & Configuration (Week 6)

**Goal:** Platform configuration and self-service settings.

| #   | Task                | Description                       | Files                                                |
| --- | ------------------- | --------------------------------- | ---------------------------------------------------- |
| 6.1 | Platform settings   | Global config (pricing, features) | `/app/platform/admin/settings/page.tsx`              |
| 6.2 | Feature flags       | Enable/disable features per org   | Database + UI                                        |
| 6.3 | API management      | View/revoke API keys              | Already exists (enhance)                             |
| 6.4 | Integrations config | GHL credentials, S3 settings      | `/app/platform/admin/settings/integrations/page.tsx` |
| 6.5 | Onboarding config   | Default templates for new orgs    | `/app/platform/admin/settings/onboarding/page.tsx`   |

**Definition of Done:**

- [ ] Platform settings editable
- [ ] Feature flags work per-org
- [ ] Integration credentials manageable
- [ ] Onboarding defaults configurable

---

### Phase 7: Polish & Parity (Week 7)

**Goal:** UI consistency with church admin.

| #   | Task                  | Description                     | Files               |
| --- | --------------------- | ------------------------------- | ------------------- |
| 7.1 | NavTabs overflow      | Add responsive dropdown         | Already shared      |
| 7.2 | Badge standardization | Use `rounded-md` everywhere     | All pages           |
| 7.3 | Theme consistency     | Apply current theme system      | Layout + components |
| 7.4 | Loading states        | Suspense boundaries + skeletons | All pages           |
| 7.5 | Error boundaries      | Graceful error handling         | Layout              |
| 7.6 | Mobile responsiveness | Test and fix all pages          | All pages           |

**Definition of Done:**

- [ ] UI matches church admin quality
- [ ] All pages have loading states
- [ ] Mobile experience is good
- [ ] No visual inconsistencies

---

## Database Changes

### New Models

```prisma
enum PlatformRole {
  PLATFORM_ADMIN
  PLATFORM_VIEWER
  PLATFORM_SUPPORT
}

model PlatformUser {
  id        String       @id @default(cuid())
  userId    String       @unique
  user      User         @relation(fields: [userId], references: [id])
  role      PlatformRole @default(PLATFORM_VIEWER)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model PlatformAuditLog {
  id             String   @id @default(cuid())
  userId         String
  action         String   // "updated_subscription", "viewed_org", etc.
  targetType     String   // "organization", "user", etc.
  targetId       String
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([userId])
  @@index([targetType, targetId])
  @@index([createdAt])
}

model PlatformSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt
}

model FeatureFlag {
  id             String  @id @default(cuid())
  key            String  @unique
  defaultEnabled Boolean @default(false)
  description    String?
}

model OrganizationFeature {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  featureKey     String
  enabled        Boolean      @default(true)

  @@unique([organizationId, featureKey])
}
```

---

## File Structure (Target)

```
/app/platform/admin/
├── layout.tsx                    # Auth + providers
├── page.tsx                      # Dashboard with real stats
├── organizations/
│   ├── page.tsx                  # List all orgs
│   └── [id]/
│       └── page.tsx              # Org detail
├── contacts/
│   └── page.tsx                  # Cross-org contacts
├── team/
│   └── page.tsx                  # Platform admins
├── conversations/
│   └── page.tsx                  # GHL conversations
├── messaging/
│   └── page.tsx                  # Bulk messaging
├── templates/
│   └── page.tsx                  # Message templates
├── analytics/
│   └── page.tsx                  # Platform metrics
├── revenue/
│   └── page.tsx                  # Financial dashboard
├── audit/
│   └── page.tsx                  # Audit log
├── settings/
│   ├── page.tsx                  # General settings
│   ├── integrations/
│   │   └── page.tsx              # GHL, S3, etc.
│   └── onboarding/
│       └── page.tsx              # Default templates
├── api/
│   └── page.tsx                  # API key management (exists)
├── courses/                      # Existing (keep)
├── payments/
│   └── page.tsx                  # Real payment data
└── help/
    └── page.tsx                  # Support resources

/lib/data/platform/
├── organizations.ts              # Org queries
├── contacts.ts                   # Contact queries
├── analytics.ts                  # Metrics queries
├── audit.ts                      # Audit log queries
├── settings.ts                   # Settings queries
└── health.ts                     # Health score calculations

/lib/auth/
└── platform.ts                   # requirePlatformAccess()

/actions/platform/
├── organizations.ts              # Org mutations
├── team.ts                       # Team mutations
├── settings.ts                   # Settings mutations
└── messaging.ts                  # Bulk messaging
```

---

## Success Metrics

| Metric                  | Current    | Target       |
| ----------------------- | ---------- | ------------ |
| Pages with real data    | 2/16 (12%) | 16/16 (100%) |
| Pages with proper auth  | 2/16 (12%) | 16/16 (100%) |
| Shared component usage  | ~40%       | 90%+         |
| Mobile responsive pages | Unknown    | 100%         |
| Loading states          | ~20%       | 100%         |

---

## Risks & Mitigations

| Risk                | Impact | Mitigation                              |
| ------------------- | ------ | --------------------------------------- |
| Scope creep         | High   | Strict phase boundaries, weekly reviews |
| Auth complexity     | Medium | Reuse patterns from church admin        |
| GHL API limits      | Medium | Caching, rate limiting                  |
| Database migrations | Low    | Non-breaking additions only             |

---

## Dependencies

- **GHL MCP** - For conversations, messaging (already connected)
- **Church admin patterns** - Reference for implementation
- **Prisma migrations** - For new models

---

## Worktree Setup

```bash
# Create the worktree
cd /home/digitaldesk/Desktop/church-connect-hub/.bare
git worktree add ../platform-admin feature/platform-admin

# Or from main
cd /home/digitaldesk/Desktop/church-connect-hub/main
git worktree add ../platform-admin -b feature/platform-admin

# Setup
cd ../platform-admin
cp .env.local.example .env.local
# Update DATABASE_URL to platform-admin Neon branch
# Update PORT to 3005
pnpm install
pnpm dev
```

---

## References

- Church admin patterns: `/app/church/[slug]/admin/`
- Data layer examples: `/lib/data/volunteers.ts`, `/lib/data/prayer-requests.ts`
- Auth helper: `/app/data/dashboard/require-dashboard-access.ts`
- Shared components: `/components/data-table/`, `/components/layout/`

---

**Next Step:** Create worktree and begin Phase 1 (Foundation & Security).
