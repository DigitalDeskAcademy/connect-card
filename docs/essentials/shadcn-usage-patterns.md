# Shadcn Component Usage Patterns

**Purpose:** Common usage patterns for shadcn/ui components in the Church Connect Card platform.

**Component Reference:** See `/docs/essentials/shadcn.md` for the complete list of 100+ available components.

---

## 🎯 Component-First Approach

**ALWAYS check shadcn/ui components FIRST before building custom UI**. Our project uses shadcn/ui as the primary component library, and we have 100+ pre-built, accessible components available.

### Decision Tree

```
Need to build UI?
  ↓
1. Check shadcn/ui components first (shadcn.md)
  ↓
2. Component exists?
   → YES: Install via CLI and use it
   → NO: Check if pattern exists (e.g., data-table)
  ↓
3. Pattern exists?
   → YES: Follow pattern guide
   → NO: Build custom component
```

---

## 📦 Common Component Patterns

### Input with Icons/Prefix

```tsx
// ❌ DON'T: Manual icon positioning
<div className="relative">
  <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4" />
  <Input className="pl-8" />
</div>;

// ✅ DO: Use InputGroup component
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

<InputGroup>
  <InputGroupAddon>
    <IconSearch className="h-4 w-4" />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>;
```

### Empty States

```tsx
// ❌ DON'T: Plain text empty states
<div className="text-center">No data found.</div>;

// ✅ DO: Use Empty component
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <IconInbox className="h-6 w-6" />
    </EmptyMedia>
    <EmptyTitle>No data found</EmptyTitle>
    <EmptyDescription>Try adjusting your filters</EmptyDescription>
  </EmptyHeader>
</Empty>;
```

### Pagination

```tsx
// ❌ DON'T: Text-based pagination
<div className="text-sm">Showing 1-10 of 100</div>;

// ✅ DO: Use Pagination component
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>
        1
      </PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>;
```

### Loading States

```tsx
// ❌ DON'T: Custom spinner implementations
<div className="animate-spin">Loading...</div>;

// ✅ DO: Use Spinner component
import { Spinner } from "@/components/ui/spinner";

<Spinner />;
```

### Alerts and Messages

```tsx
// ❌ DON'T: Plain div messages
<div className="text-red-500">Error occurred</div>;

// ✅ DO: Use Alert component
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>An error occurred</AlertDescription>
</Alert>;
```

---

## 📑 Tabs (Controlled Pattern with Custom Styling)

**Pattern**: Use controlled Tabs with state management for consistent behavior across the app.

### Standard Implementation (Dashboard Pattern)

```tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock } from "lucide-react";

export function MyTabsComponent() {
  const [selectedTab, setSelectedTab] = useState("tab1");

  return (
    <Tabs
      defaultValue="tab1"
      value={selectedTab}
      onValueChange={setSelectedTab}
      className="w-full"
    >
      <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs">
        <TabsTrigger
          value="tab1"
          className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <Users className="mr-2 w-4 h-4" />
          Tab 1 Label
        </TabsTrigger>
        <TabsTrigger
          value="tab2"
          className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
        >
          <Clock className="mr-2 w-4 h-4" />
          Tab 2 Label
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tab1" className="mt-6">
        {/* Tab 1 content */}
      </TabsContent>

      <TabsContent value="tab2" className="mt-6">
        {/* Tab 2 content */}
      </TabsContent>
    </Tabs>
  );
}
```

### Key Features

1. **Controlled state**: Uses `value={selectedTab}` and `onValueChange={setSelectedTab}` for programmatic control
2. **Custom TabsList styling**: Border-based design with `h-auto -space-x-px bg-background p-0 shadow-xs`
3. **Custom TabsTrigger styling**: Bottom border indicator using `after:` pseudo-element
   - Active state: `data-[state=active]:after:bg-primary` creates colored bottom border
   - No rounded corners: `rounded-none border`
4. **Icons**: Include lucide-react icons with `className="mr-2 w-4 h-4"`
5. **Consistent spacing**: `TabsContent` uses `className="mt-6"` for spacing from TabsList

### When to Use

- Multi-view layouts (Active Members / Pending Invitations)
- Location-based filtering (All Locations / Campus 1 / Campus 2)
- Category switching (Dashboard analytics by location)

### Reference Implementations

- `/app/church/[slug]/admin/_components/DashboardClient.tsx` (location tabs)
- `/app/church/[slug]/admin/team/client.tsx` (active/pending tabs)

---

## 📥 Installation

```bash
# Install any shadcn component via CLI
npx shadcn@latest add <component-name>

# Examples:
npx shadcn@latest add input-group
npx shadcn@latest add empty
npx shadcn@latest add pagination
npx shadcn@latest add alert
npx shadcn@latest add spinner
```

---

## 📚 See Also

- **Component Reference**: `/docs/essentials/shadcn.md` - Complete list of 100+ components
- **Data Tables**: `/docs/essentials/data-table-pattern.md` - TanStack Table implementation guide
- **Coding Patterns**: `/docs/essentials/coding-patterns.md` - General coding standards
