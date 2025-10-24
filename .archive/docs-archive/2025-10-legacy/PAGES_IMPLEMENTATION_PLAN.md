# Operations Dashboard Pages Implementation Plan

## Overview

Create comprehensive pages for the GHL operations dashboard with industry-standard SaaS features.

## Pages to Create

### 1. ✅ Contacts Page (`/platform/admin/contacts`)

**Status**: Already created

- GHL-style contact list with avatars
- Search, filter, and bulk actions
- Tags and custom fields
- Pagination and column controls
- Smart lists and segmentation tabs

### 2. Appointments Page (`/platform/admin/appointments`)

**Features**:

- Calendar view and list view toggle
- Daily/weekly/monthly views
- Appointment cards with client info, service, status
- Time slot availability sidebar
- Quick actions: confirm, reschedule, cancel
- Status badges (confirmed, pending, cancelled, waitlist)
- Stats cards for appointment metrics

### 3. Messages Page (`/platform/admin/messages`)

**Features**:

- Unified inbox for SMS, Facebook, Instagram
- Conversation threads view
- Quick reply templates
- Message status indicators
- Contact sidebar with history
- Bulk message actions
- Filter by channel/status/date

### 4. Payments Page (`/platform/admin/payments`)

**Features**:

- Outstanding invoices list
- Payment history table
- Quick payment collection buttons
- Payment status badges
- Revenue metrics cards
- Filter by status/date range
- Export functionality

### 5. Inventory Page (`/platform/admin/inventory`)

**Features**:

- Current stock levels table
- Low stock alerts
- Reorder points management
- Stock movement history
- Category filtering
- Quick reorder actions
- Inventory value metrics

### 6. Reviews Page (`/platform/admin/reviews`)

**Features**:

- Recent reviews list
- Star rating display
- Platform indicators (Google, Yelp, Facebook)
- Response management
- Review metrics cards
- Filter by rating/platform
- Quick response templates

### 7. Settings/Profile Page (`/platform/admin/settings`)

**Features**:

- User profile information
- Account settings
- Organization management
- Team members & roles
- Billing & subscription
- API keys management
- Integrations (GHL, Stripe, etc.)
- Notification preferences
- Security settings (2FA, password)
- Activity log

### 8. Additional Dev Menu Pages

- **Courses** (`/platform/admin/courses`) - Already exists
- **Analytics** (`/platform/admin/analytics`) - Already exists
- **API** (`/platform/admin/api`) - Already exists
- **Projects** (`/platform/admin/projects`) - To be created
- **Team** (`/platform/admin/team`) - To be created

## Implementation Notes

### Design System

- Use existing monochrome/brutalist theme
- Maintain consistent card layouts
- Use Tabler icons throughout
- Keep primary color for active states
- Implement sticky headers consistently

### Data Integration

- All pages will initially use mock data
- TODO comments for GHL API integration points
- Maintain same data structure as GHL for easy migration

### Common Components

- Reusable table with sorting/filtering
- Pagination component
- Status badges
- Action dropdowns
- Search inputs with icons
- Date/time pickers

### Mobile Responsiveness

- Responsive grid layouts
- Collapsible sidebars on mobile
- Touch-friendly buttons and inputs
- Horizontal scrolling for tables on small screens

## Priority Order

1. Messages (critical for CRM)
2. Payments (revenue tracking)
3. Settings/Profile (user management)
4. Inventory (IV therapy specific)
5. Reviews (reputation management)
6. Projects & Team pages

## Next Session Tasks

1. Create all page files with proper routing
2. Implement consistent layouts across pages
3. Add proper TypeScript types
4. Ensure navigation highlighting works
5. Test responsive design
6. Add loading states and error handling

## Code Structure Example

Each page should follow this structure:

```tsx
/**
 * [Page Name] - [Brief description]
 *
 * [Detailed description of functionality]
 *
 * Access: All admin roles
 */

"use client";

import { useState } from "react";
// ... imports

// Mock data - TODO: Replace with GHL API
const mockData = [...];

export default function [PageName]() {
  // State management
  // Event handlers

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">[Title]</h1>
          <p className="text-muted-foreground">[Description]</p>
        </div>
        {/* Action buttons */}
      </div>

      {/* Main content */}
      {/* Stats cards */}
    </div>
  );
}
```

## Session Completed Items

### ✅ Initial Pivot Cleanup

1. Made navigation sticky across all layouts
2. Removed rounded corners and borders from main container
3. Updated sidebar active state to use primary color (toned down)
4. Added Contacts to main navigation

### ✅ Created Contacts Page

- Full GHL-style contact management interface
- Search, filter, bulk actions
- Pagination controls
- Multiple tabs (All, Smart Lists, Bulk Actions, Restore, Tasks, Companies)
- Avatar system with colored backgrounds
- Tag management
- Action dropdowns per contact

## Files Modified

### Navigation & Layout

- `/components/ui/sidebar.tsx` - Removed rounded corners, updated active states
- `/components/sidebar/nav-main.tsx` - Fixed active state implementation
- `/components/sidebar/app-sidebar.tsx` - Added Contacts to navigation
- `/app/platform/admin/layout.tsx` - Made header sticky
- `/app/agency/[slug]/admin/layout.tsx` - Made header sticky
- `/app/agency/[slug]/learning/layout.tsx` - Made header sticky

### New Pages

- `/app/platform/admin/contacts/page.tsx` - Complete contacts management page

## Branch: `initial-pivot-cleanup`

Ready for implementation in next session!
