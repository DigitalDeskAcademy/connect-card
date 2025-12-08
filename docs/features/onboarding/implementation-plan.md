# Onboarding & Card Mapping - Implementation Plan

**Created:** 2025-12-07
**Status:** Planning Complete - Ready for Implementation
**Priority:** High - Core MVP Feature

---

## Executive Summary

A hybrid onboarding experience that lets churches start scanning cards immediately (AI fallback handles universal fields), with optional template creation for custom fields. Includes tracking, alerts, and a setup checklist to guide new churches.

---

## Key Decisions

| #   | Decision                                                     | Rationale                                                        |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | Store both card image (S3) and mapping config (DB)           | Visual reference for debugging, flexibility for re-training      |
| 2   | Fallback IS the product; templates are optional enhancements | Reduces friction, AI handles basics, templates for custom fields |
| 3   | Track mapping accuracy via review corrections                | Learn from staff corrections, improve over time                  |
| 4   | Platform dashboard only for developer alerts                 | Don't over-engineer; see real problems first                     |

---

## Architecture

### Extraction Pipeline

```
Card Image
    │
    ▼
┌─────────────────────────────────────────────────┐
│  UNIVERSAL FIELD DETECTION (Always runs)        │
│                                                 │
│  • First Name / Last Name                       │
│  • Email (regex pattern)                        │
│  • Phone (regex pattern)                        │
│  • Address (street, city, state, zip)           │
│  • Prayer Request / Comments (text blocks)      │
│  • Checkboxes (interests, decisions)            │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│  HAS TEMPLATE?                                  │
│                                                 │
│  YES → Apply custom field mappings              │
│  NO  → Use universal detection only             │
│        Flag unknown fields for potential alert  │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│  CONFIDENCE CHECK                               │
│                                                 │
│  < 50% → Warning alert                          │
│  < 30% → Critical alert                         │
│  3+ corrections same field/week → Prompt        │
└─────────────────────────────────────────────────┘
    │
    ▼
Staff Review (safety net)
    │
    ▼
Track corrections → Improve aliases
```

---

## Data Model Changes

### Organization Model Updates

```prisma
model Organization {
  // ... existing fields

  // Onboarding tracking
  onboardingCompletedAt  DateTime?
  onboardingDismissedAt  DateTime?
  completedSetupSteps    String[]  @default([])
}
```

### New: CardTemplate Model

```prisma
model CardTemplate {
  id              String       @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  name            String       @default("Default")
  isActive        Boolean      @default(true)

  // Sample card image
  sampleImageUrl  String?

  // Field mapping configuration (JSON)
  fieldMappings   Json?

  // Additional context for Claude
  extractionHints String?

  // Stats
  cardsProcessed  Int          @default(0)
  avgConfidence   Float?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([organizationId])
}
```

### New: ExtractionAlert Model

```prisma
model ExtractionAlert {
  id              String       @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  type            String       // "low_confidence" | "unmapped_field" | "pattern_detected"
  severity        String       // "info" | "warning" | "critical"

  message         String
  details         Json?

  // Pattern tracking
  occurrences     Int          @default(1)
  firstSeenAt     DateTime     @default(now())
  lastSeenAt      DateTime     @default(now())

  // Resolution
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?      // "updated_mapping" | "dismissed" | "reported_bug"

  createdAt       DateTime     @default(now())

  @@index([organizationId, resolvedAt])
  @@index([organizationId, severity])
}
```

### New: FieldMappingCorrection Model (Learning)

```prisma
model FieldMappingCorrection {
  id              String       @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // What AI detected
  detectedLabel   String       // "Cell:", "Mobile Phone", etc.
  aiMappedTo      String       // "phone", "mobile", etc.

  // What staff corrected to
  correctedTo     String       // "phone"

  // For aggregate learning
  connectCardId   String?

  createdAt       DateTime     @default(now())

  @@index([organizationId])
  @@index([detectedLabel])
}
```

---

## Field Mappings JSON Structure

```typescript
type FieldMappings = {
  // Standard fields - always attempted
  standardFields: {
    firstName: { enabled: boolean; aliases: string[] };
    lastName: { enabled: boolean; aliases: string[] };
    email: { enabled: boolean; aliases: string[] };
    phone: { enabled: boolean; aliases: string[] };
    address: { enabled: boolean; aliases: string[] };
    city: { enabled: boolean; aliases: string[] };
    state: { enabled: boolean; aliases: string[] };
    zip: { enabled: boolean; aliases: string[] };
    prayerRequest: { enabled: boolean; aliases: string[] };
  };

  // Church-specific custom fields
  customFields: Array<{
    id: string;
    label: string;
    type: "text" | "select" | "checkbox";
    options?: string[]; // For select type
  }>;

  // Checkbox/interest mappings
  interestMappings: Record<string, string>;
  // e.g., "I'd like to serve": "volunteer"
  //       "Children's Ministry": "volunteer:children"
};
```

---

## Setup Steps Definition

### Tier 1: Blocking (Should complete to get value)

| Step ID    | Title                   | Description                 | Completion Check       |
| ---------- | ----------------------- | --------------------------- | ---------------------- |
| `location` | Add your first location | Create a campus or location | `locations.length > 0` |

### Tier 2: Important (Recommended soon)

| Step ID                | Title                        | Description                  | Completion Check                 |
| ---------------------- | ---------------------------- | ---------------------------- | -------------------------------- |
| `invite-staff`         | Invite team members          | Add staff to review cards    | `staff.length > 1`               |
| `volunteer-categories` | Set up volunteer areas       | Create ministry categories   | `volunteerCategories.length > 0` |
| `category-leaders`     | Assign ministry leaders      | Assign leaders to categories | `categoriesWithLeaders > 0`      |
| `bg-check-docs`        | Upload background check docs | Add required documents       | `bgCheckDocs.length > 0`         |

### Tier 3: Optional (When needed)

| Step ID              | Title                       | Description                           | Completion Check                  |
| -------------------- | --------------------------- | ------------------------------------- | --------------------------------- |
| `card-template`      | Map your connect card       | Improve AI accuracy for custom fields | `cardTemplate !== null`           |
| `prayer-categories`  | Customize prayer categories | Modify default categories             | `customPrayerCategories === true` |
| `export-preferences` | Configure ChMS export       | Set up Planning Center/Breeze         | `exportConfigured === true`       |

---

## Component Structure

```
/components/onboarding/
├── setup-page.tsx              # Full setup page layout
├── setup-checklist.tsx         # Checklist with progress
├── setup-step.tsx              # Individual step card
├── setup-progress-bar.tsx      # Visual progress indicator
├── setup-dashboard-widget.tsx  # Compact dashboard widget
├── steps/
│   ├── location-step.tsx
│   ├── invite-staff-step.tsx
│   ├── volunteer-categories-step.tsx
│   ├── category-leaders-step.tsx
│   ├── bg-check-docs-step.tsx
│   └── card-template-step.tsx
└── card-mapping/
    ├── card-upload.tsx         # Upload sample card
    ├── field-mapper.tsx        # Visual field mapping UI
    ├── field-preview.tsx       # Show detected fields
    └── mapping-confirmation.tsx # Confirm/adjust mappings

/lib/onboarding/
├── steps.ts                    # Step definitions
├── progress.ts                 # Progress calculation
└── hooks.ts                    # useOnboarding hook
```

---

## Routes

| Route                                        | Purpose                        |
| -------------------------------------------- | ------------------------------ |
| `/church/[slug]/admin/setup`                 | Full setup page with checklist |
| `/church/[slug]/admin/settings/card-mapping` | Card template management       |
| `/church/[slug]/admin/settings/alerts`       | View/resolve alerts            |
| `/platform/admin/extraction-health`          | Platform-wide extraction stats |

---

## Implementation Phases

### Phase 1: Database & Foundation

**Estimated: 1-2 sessions**

- [ ] Add `completedSetupSteps`, `onboardingCompletedAt`, `onboardingDismissedAt` to Organization
- [ ] Create `CardTemplate` model
- [ ] Create `ExtractionAlert` model
- [ ] Create `FieldMappingCorrection` model
- [ ] Run migrations
- [ ] Create server actions for step completion tracking
- [ ] Create `useOnboarding` hook

### Phase 2: Setup Page UI

**Estimated: 2-3 sessions**

- [ ] Create `/church/[slug]/admin/setup` route
- [ ] Build `SetupChecklist` component
- [ ] Build `SetupStep` component with states (pending, current, completed)
- [ ] Build `SetupProgressBar` component
- [ ] Implement location step (likely already exists, just wire up)
- [ ] Implement invite staff step
- [ ] Implement volunteer categories step
- [ ] Add "Setup" link to sidebar navigation
- [ ] Add progress indicator to dashboard

### Phase 3: Card Mapping UI

**Estimated: 3-4 sessions**

- [ ] Build card upload component with preview
- [ ] Build field detection display (show what AI found)
- [ ] Build field mapping confirmation UI
- [ ] Build custom field addition UI
- [ ] Integrate template with extraction pipeline
- [ ] Store template configuration
- [ ] Add template step to setup flow

### Phase 4: Tracking & Alerts

**Estimated: 2-3 sessions**

- [ ] Track corrections in review process
- [ ] Implement confidence checking in extraction
- [ ] Create alert generation logic
- [ ] Build dashboard alert banner
- [ ] Build alerts settings page
- [ ] Add resolution actions (dismiss, update mapping)

### Phase 5: Polish & Platform

**Estimated: 1-2 sessions**

- [ ] Dashboard widget for incomplete setup
- [ ] Settings toggle to show/hide onboarding
- [ ] Celebration animations (confetti on completion)
- [ ] Platform admin extraction health view
- [ ] Mobile responsiveness pass

---

## Success Metrics

| Metric                | Target                       | How to Measure                 |
| --------------------- | ---------------------------- | ------------------------------ |
| Setup completion rate | > 80% complete Tier 1+2      | Track `completedSetupSteps`    |
| Time to first scan    | < 5 minutes                  | Time from signup to first card |
| Extraction accuracy   | > 70% for universal fields   | Track corrections              |
| Template adoption     | 30%+ of active churches      | Count templates created        |
| Alert resolution rate | > 90% resolved within 7 days | Track `resolvedAt`             |

---

## Open Items / Future Enhancements

1. **AI Learning Pipeline** - Aggregate corrections across churches to improve universal aliases
2. **Video Tutorials** - Embed short videos in setup steps
3. **Smart Defaults** - Pre-populate settings based on church size/denomination
4. **Template Sharing** - Let churches share templates for common card formats
5. **Bulk Import** - Import existing member data during setup

---

## Next Steps

1. Review and approve this plan
2. Create feature branch: `feature/onboarding`
3. Start with Phase 1: Database & Foundation
