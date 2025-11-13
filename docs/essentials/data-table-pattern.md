# DataTable Pattern (TanStack Table + Shadcn)

**Purpose:** Industry-standard pattern for building data tables in the Church Connect Card platform.

---

## 🎯 Overview

**Use TanStack Table for ALL data tables** - This is the industry-standard pattern for React data tables in 2025.

### Benefits

- Built-in sorting, filtering, pagination
- Type-safe with TypeScript generics
- Reusable across all features (appointments, contacts, inventory, payments, etc.)
- Industry-validated 2025 best practice

---

## 📁 File Structure

```
components/dashboard/[feature]/
├── columns.tsx       # Column definitions (client component)
├── data-table.tsx    # Reusable DataTable component (client component)
└── [feature]-table.tsx  # Wrapper component (client component)
```

---

## 🔧 Implementation Pattern

### 1. Define Columns (columns.tsx)

```typescript
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { IconArrowsSort, IconSortAscending, IconSortDescending } from "@tabler/icons-react";

export const paymentColumns: ColumnDef<PaymentWithRelations>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Invoice #
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("invoiceNumber") || "—"}</div>;
    },
  },
  // ... more columns
];
```

### 2. Create Reusable DataTable (data-table.tsx)

```typescript
"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchColumn,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div>
      {/* Search Input */}
      {searchColumn && (
        <InputGroup>
          <InputGroupAddon>
            <IconSearch className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn(searchColumn)?.setFilterValue(e.target.value)}
          />
        </InputGroup>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No data found</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
```

### 3. Wrapper Component ([feature]-table.tsx)

```typescript
"use client";

import { DataTable } from "./data-table";
import { paymentColumns } from "./columns";
import type { PaymentWithRelations } from "./payments-client";

interface PaymentsTableProps {
  payments: PaymentWithRelations[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <DataTable
      columns={paymentColumns}
      data={payments}
      title="Payment Transactions"
      searchPlaceholder="Search payments..."
      searchColumn="memberName"
      statusFilterColumn="status"
      statusFilterOptions={[
        { value: "ALL", label: "All Status" },
        { value: "PAID", label: "Paid" },
        { value: "PENDING", label: "Pending" },
        { value: "FAILED", label: "Failed" },
      ]}
    />
  );
}
```

### DataTable Props

- `columns` (required) - Column definitions from TanStack Table
- `data` (required) - Array of data to display
- `title` (required) - Table title shown in CardHeader
- `searchPlaceholder` (optional) - Placeholder text for search input
- `searchColumn` (optional) - Column to search (if omitted, no search shown)
- `statusFilterColumn` (optional) - Column to filter by status
- `statusFilterOptions` (optional) - Status filter dropdown options (if omitted, no filter shown)

---

## ✅ Key Rules for DataTables

### DO:

- Use TanStack Table for all data tables
- Define columns separately in columns.tsx
- Create reusable DataTable component per feature
- Use shadcn components (InputGroup, Empty, Pagination)
- Set default sorting via initialState
- Use TypeScript generics for type safety

### DON'T:

- Build manual filtering/sorting logic
- Create duplicate DataTable components per route
- Use plain text for empty states or pagination
- Skip pagination for large datasets
- Hardcode column definitions in table component

---

## 🚀 Quick Start: Building a New Table

**Example: Creating an Appointments Table**

### 1. Copy the payment table structure

```bash
cp -r components/dashboard/payments components/dashboard/appointments
```

### 2. Update file names

```bash
cd components/dashboard/appointments
mv payments-client.tsx appointments-client.tsx
mv payments-table.tsx appointments-table.tsx
```

### 3. Update `columns.tsx`

```typescript
// Define your appointment columns
export const appointmentColumns: ColumnDef<AppointmentWithRelations>[] = [
  {
    accessorKey: "memberName",
    header: "Patient",
    // ... column config
  },
  {
    accessorKey: "date",
    header: "Date",
    // ... column config
  },
  // ... more columns
];
```

### 4. Update `appointments-table.tsx`

```typescript
export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  return (
    <DataTable
      columns={appointmentColumns}
      data={appointments}
      title="Appointments"
      searchPlaceholder="Search appointments..."
      searchColumn="memberName"
      statusFilterColumn="status"
      statusFilterOptions={[
        { value: "ALL", label: "All Statuses" },
        { value: "SCHEDULED", label: "Scheduled" },
        { value: "COMPLETED", label: "Completed" },
        { value: "CANCELLED", label: "Cancelled" },
      ]}
    />
  );
}
```

### Result

You now have a fully functional appointments table with:

- ✅ Sorting on all columns
- ✅ Column resizing (12px wide handles)
- ✅ Search functionality
- ✅ Status filtering
- ✅ Pagination (10 items per page)
- ✅ Empty states
- ✅ Responsive design

---

## 🔄 Reusability

The same DataTable pattern can be used for:

- **Appointments Table** - Patient scheduling and calendar integration
- **Contacts Table** - GHL contact management
- **Inventory Table** - Product and supply tracking
- **Reviews Table** - Client feedback management
- **Volunteers Table** - Volunteer roster management
- **Connect Cards Table** - Connect card analytics

---

## 📚 Reference Implementation

See `/components/dashboard/payments/` for the complete reference:

- `columns.tsx` - Payment column definitions with sorting, badges, formatting
- `data-table.tsx` - Reusable DataTable with search, filters, pagination, column resizing
- `payments-table.tsx` - Wrapper component showing prop configuration

---

## 📖 See Also

- **Shadcn Components**: `/docs/essentials/shadcn-usage-patterns.md` - Component usage patterns
- **Coding Patterns**: `/docs/essentials/coding-patterns.md` - General coding standards
- **TanStack Table Docs**: [https://tanstack.com/table/latest](https://tanstack.com/table/latest)

---

**Remember**: When in doubt, copy an existing pattern rather than creating a new one.
