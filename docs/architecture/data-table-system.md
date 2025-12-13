# Unified DataTable System

> Long-term architecture plan for consistent, maintainable data tables across the application.

---

## Problem Statement

The codebase currently has **11 different table implementations** with:

- 4 different height/scroll strategies
- 3 different pagination formats
- Inconsistent empty states
- Mixed usage of TanStack Table vs custom implementations
- Duplicated code across components

This creates technical debt, inconsistent UX, and maintenance burden.

---

## Solution: Composable DataTable System

A **composable component system** that provides:

1. **Single source of truth** for table behavior
2. **Opt-in features** via configuration
3. **Consistent UX** across all tables
4. **Type-safe** with full TypeScript support
5. **Headless flexibility** - style without constraints

### Design Principles

1. **Composition over configuration** - Build tables from small, focused components
2. **Progressive enhancement** - Start simple, add features as needed
3. **Headless first** - Logic separated from presentation
4. **Convention over configuration** - Sensible defaults, override when needed

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ PaymentsTable│ │VolunteersTable│ │ExportPreview│  etc.       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘               │
│         │               │               │                       │
│         ▼               ▼               ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   <DataTable />                              ││
│  │  ┌─────────────────────────────────────────────────────┐    ││
│  │  │                 DataTableProvider                    │    ││
│  │  │  (TanStack Table instance + shared state)           │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                          │                                   ││
│  │    ┌─────────┬───────────┼───────────┬─────────┐            ││
│  │    ▼         ▼           ▼           ▼         ▼            ││
│  │ Toolbar   Filters    TableBody   Pagination  Empty          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Primitive Layer (shadcn/ui)                  │
│  Table, TableHeader, TableBody, TableRow, TableCell, etc.       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Core Components

| Component             | Purpose                         | File                        |
| --------------------- | ------------------------------- | --------------------------- |
| `DataTable`           | Main orchestrator component     | `data-table.tsx`            |
| `DataTableProvider`   | Context for table state         | `data-table-context.tsx`    |
| `DataTableToolbar`    | Search, filters, bulk actions   | `data-table-toolbar.tsx`    |
| `DataTableContent`    | Table body with scroll handling | `data-table-content.tsx`    |
| `DataTablePagination` | Page controls                   | `data-table-pagination.tsx` |
| `DataTableEmpty`      | Empty state display             | `data-table-empty.tsx`      |

### Header Components

| Component                | Purpose                      | File                            |
| ------------------------ | ---------------------------- | ------------------------------- |
| `DataTableColumnHeader`  | Sortable column header       | `data-table-column-header.tsx`  |
| `DataTableViewOptions`   | Column visibility toggle     | `data-table-view-options.tsx`   |
| `DataTableFacetedFilter` | Multi-select filter dropdown | `data-table-faceted-filter.tsx` |

### Utility Components

| Component                | Purpose                   | File                            |
| ------------------------ | ------------------------- | ------------------------------- |
| `DataTableRowActions`    | Row action dropdown       | `data-table-row-actions.tsx`    |
| `DataTableSelectionInfo` | "X of Y selected" display | `data-table-selection-info.tsx` |

---

## Feature Matrix

### Table Types & Required Features

| Feature           | Full Table           | Preview Table    | Metrics Table | Simple Table |
| ----------------- | -------------------- | ---------------- | ------------- | ------------ |
| **Example**       | Payments, Volunteers | Export Preview   | Sidebar       | Team List    |
| TanStack Table    | Yes                  | Optional         | Yes           | Yes          |
| Pagination        | Yes                  | No               | Yes           | Optional     |
| Sorting           | Yes                  | No               | Optional      | Optional     |
| Filtering         | Yes                  | No               | Optional      | Optional     |
| Row Selection     | Optional             | No               | Yes           | No           |
| Column Visibility | Optional             | No               | Yes           | No           |
| Column Resizing   | Optional             | No               | No            | No           |
| Drag Reorder      | No                   | No               | Yes           | No           |
| Search            | Yes                  | No               | No            | Optional     |
| Bulk Actions      | Optional             | No               | Optional      | No           |
| Empty State       | Full                 | Minimal          | Minimal       | Full         |
| Max Height        | Flex                 | Fixed            | Fixed         | Flex         |
| Row Count Display | "Showing X-Y of Z"   | "Showing X of Y" | "Page X of Y" | Optional     |

---

## Configuration API

### DataTable Props

```typescript
interface DataTableProps<TData, TValue> {
  // Required
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Display Mode
  variant?: "full" | "preview" | "compact";

  // Container
  title?: string;
  description?: string;
  headerAction?: ReactNode; // e.g., "Add New" button

  // Height Strategy
  height?: "auto" | "flex" | "fixed";
  maxHeight?: string; // e.g., '400px', '60vh'

  // Pagination
  pagination?: boolean | PaginationConfig;
  pageSize?: number; // default: 25
  pageSizeOptions?: number[]; // default: [10, 25, 50, 100]

  // Features (all default to false)
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;

  // Search
  searchColumn?: string;
  searchPlaceholder?: string;

  // Filters
  filters?: FilterConfig[];

  // Empty State
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
  };

  // Preview Mode (overrides other settings)
  previewMode?: boolean;
  previewLimit?: number; // default: 10

  // Callbacks
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (rows: TData[]) => void;

  // Styling
  className?: string;
  wrapInCard?: boolean; // default: true
}

interface PaginationConfig {
  showPageSize?: boolean;
  showPageNumbers?: boolean;
  showFirstLast?: boolean;
  format?: "range" | "page" | "simple";
  // 'range' = "Showing 1-25 of 150"
  // 'page' = "Page 1 of 6"
  // 'simple' = "1 of 6"
}

interface FilterConfig {
  column: string;
  title: string;
  options: { label: string; value: string }[];
  multiSelect?: boolean;
}
```

---

## Usage Examples

### 1. Full Featured Table (Payments)

```tsx
<DataTable
  columns={paymentColumns}
  data={payments}
  title="Payment Transactions"
  variant="full"
  height="flex"
  pagination={{ format: "range", showPageSize: true }}
  pageSize={25}
  enableSorting
  enableFiltering
  searchColumn="memberName"
  searchPlaceholder="Search payments..."
  filters={[
    {
      column: "status",
      title: "Status",
      options: [
        { label: "Paid", value: "PAID" },
        { label: "Pending", value: "PENDING" },
        { label: "Failed", value: "FAILED" },
      ],
    },
  ]}
  emptyState={{
    icon: <CreditCard className="h-8 w-8" />,
    title: "No payments found",
    description: "Payments will appear here once processed",
  }}
/>
```

### 2. Preview Table (Export)

```tsx
<DataTable
  columns={exportColumns}
  data={previewData}
  variant="preview"
  previewMode
  previewLimit={10}
  maxHeight="400px"
  pagination={false}
  emptyState={{
    icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
    title: "All caught up!",
    description: "No new records to export",
  }}
/>
```

### 3. Simple Table (Team)

```tsx
<DataTable
  columns={teamColumns}
  data={members}
  variant="compact"
  height="auto"
  pagination
  pageSize={10}
  wrapInCard={false}
  emptyState={{
    title: "No team members",
    action: <Button>Add Member</Button>,
  }}
/>
```

### 4. Complex Table (Sidebar Metrics)

```tsx
<DataTable
  columns={metricColumns}
  data={metrics}
  variant="full"
  height="fixed"
  maxHeight="500px"
  pagination={{ format: "page", showPageSize: true }}
  enableRowSelection
  enableColumnVisibility
  enableDragReorder // Special feature
  emptyState={{
    title: "No metrics",
  }}
/>
```

---

## File Structure

```
components/
└── data-table/
    ├── index.ts                      # Public exports
    ├── data-table.tsx                # Main component
    ├── data-table-context.tsx        # Provider & hooks
    ├── data-table-content.tsx        # Table body wrapper
    ├── data-table-toolbar.tsx        # Toolbar with search/filters
    ├── data-table-pagination.tsx     # Pagination controls
    ├── data-table-empty.tsx          # Empty state
    ├── data-table-column-header.tsx  # Sortable header
    ├── data-table-view-options.tsx   # Column visibility
    ├── data-table-faceted-filter.tsx # Filter dropdown
    ├── data-table-row-actions.tsx    # Row action menu
    └── types.ts                      # Shared types
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1)

1. Create `components/data-table/` directory
2. Build core components:
   - `DataTable` (main)
   - `DataTableContent` (scroll handling)
   - `DataTablePagination`
   - `DataTableEmpty`
3. Support `variant: 'preview'` first (simplest)
4. **Migrate: Export page preview table**

### Phase 2: Full Tables (Week 2)

1. Add TanStack Table integration
2. Build toolbar components:
   - `DataTableToolbar`
   - `DataTableColumnHeader`
   - `DataTableFacetedFilter`
3. Support `variant: 'full'`
4. **Migrate: Payments table**
5. **Migrate: Connect Cards table**

### Phase 3: Advanced Features (Week 3)

1. Add row selection
2. Add column visibility
3. Add column resizing
4. **Migrate: Volunteers table**
5. **Migrate: Prayer Requests table**

### Phase 4: Specialized (Week 4)

1. Add drag-to-reorder support
2. **Migrate: Sidebar metrics table**
3. **Migrate: Team table**
4. **Migrate: Contacts table** (biggest refactor)

### Phase 5: Cleanup

1. Delete old table implementations
2. Update documentation
3. Add Storybook stories
4. Write migration guide for future tables

---

## Migration Checklist

For each table migration:

- [ ] Identify current features used
- [ ] Map to new DataTable props
- [ ] Create new implementation
- [ ] Test all functionality
- [ ] Visual regression check
- [ ] Delete old component
- [ ] Update imports

---

## Standards & Conventions

### Height Strategy Decision Tree

```
Is it a preview/sample?
  → Yes: maxHeight="400px" (fixed)
  → No: Is it in a flex container?
      → Yes: height="flex" (fill available)
      → No: height="auto" (natural height) + pagination
```

### Pagination Format Standards

| Context           | Format       | Example                       |
| ----------------- | ------------ | ----------------------------- |
| Admin tables      | Range        | "Showing 1-25 of 150 results" |
| Preview tables    | Simple count | "Showing 10 of 50 records"    |
| Dashboard widgets | Page         | "Page 1 of 6"                 |

### Empty State Standards

All empty states must include:

1. **Icon** - Contextual, from Lucide
2. **Title** - Clear, action-oriented
3. **Description** - Explains what to do (optional)
4. **Action** - Button to resolve (optional)

### Row Count Standards

- Default page size: **25**
- Options: **10, 25, 50, 100**
- Preview limit: **10**

---

## Success Metrics

After migration:

- [ ] Single DataTable component used everywhere
- [ ] Consistent pagination format across admin
- [ ] Consistent empty states with icons
- [ ] No height/scroll bugs
- [ ] < 500 lines in data-table.tsx
- [ ] Zero duplicated table logic

---

## Open Questions

1. **Virtual scrolling**: Do we need it? Current max dataset ~1000 rows
2. **Server-side pagination**: Add now or later?
3. **Export from table**: Built-in or separate?
4. **Print styles**: Needed?

---

## Related Documents

- [Export Feature Vision](../features/integrations/vision.md)
- [Coding Patterns](../../PLAYBOOK.md)
- [Component Guidelines](../../PLAYBOOK.md#components)

---

_Last Updated: 2025-12-11_
_Status: Implemented (PR #58, #65)_
