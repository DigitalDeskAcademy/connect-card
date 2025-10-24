# Shared Dashboard Components

This directory contains **universal dashboard components** that are shared across all three user roles:

- Platform admins (`/platform/admin/*`)
- Agency admins (`/agency/[slug]/admin/*`)
- Clinic users (future)

## Architecture

These components follow the **Universal Component Pattern** with `DataScope` for role-based data filtering:

```typescript
interface ComponentProps {
  dataScope: DataScope; // PlatformScope | AgencyScope | ClinicScope
  // ... other props
}
```

The same component is used in different routes, with behavior determined by the `DataScope` type at runtime.

## Structure

```
/components/dashboard/
├── contacts/          # Contact management components
├── appointments/      # Appointment/calendar components
├── payments/          # Payment tracking components
└── README.md         # This file
```

## Usage

**DO:**

- Import these components in route page files
- Pass `DataScope` from `requireDashboardAccess()`
- Use type guards (`isClinicScope`, etc.) for conditional rendering
- Keep components framework-agnostic

**DON'T:**

- Create duplicate components in route folders
- Pass server actions as props (import directly in components)
- Access `dataScope.clinicId` without type guard
- Mix role-specific logic into shared components (use DataScope filters instead)

## Example

```typescript
// /app/platform/admin/payments/page.tsx
import { requireDashboardAccess } from "@/app/data/dashboard/require-dashboard-access";
import PaymentsClient from "@/components/dashboard/payments/payments-client";

export default async function PaymentsPage() {
  const { dataScope } = await requireDashboardAccess("platform");

  return <PaymentsClient dataScope={dataScope} />;
}
```

## Migration Status

- [x] `payments/` - Complete (proof of concept)
- [ ] `contacts/` - Pending consolidation
- [ ] `appointments/` - Pending consolidation (rename from calendar)

See `/docs/STATUS.md` for current progress.
