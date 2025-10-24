# Database Migration Plan: Learner → Contact

## Overview

We're evolving the database from an LMS-focused model to a unified CRM/LMS model. The core change is transforming the `Learner` model into a more flexible `Contact` model that can represent clinics, patients, employees, and individual learners.

## What's Changing

### 1. Model Renaming

- `Learner` → `Contact`
- `LearnerIntegration` → `ContactIntegration`
- All foreign keys updated accordingly

### 2. New Fields on Contact

```typescript
contactType: ContactType    // CLINIC | PATIENT | EMPLOYEE | INDIVIDUAL
parentContactId: string?    // For hierarchical relationships
tags: string[]              // CRM tagging system
customFields: Json?         // Flexible metadata storage
```

### 3. New CRM Models

- **ContactNote**: Notes and comments about contacts
- **Appointment**: Calendar events and appointments
- **Message**: Communication tracking (email, SMS, chat)
- **Task**: To-do items related to contacts

### 4. New Enums

- `ContactType`: Categories of contacts
- `AppointmentStatus`: Appointment states
- `MessageDirection`, `MessageChannel`, `MessageStatus`: Message tracking
- `TaskStatus`, `TaskPriority`: Task management

## Migration Strategy

### Current Situation

Your database has existing data (learners, enrollments, etc.) that we need to preserve. The database has also drifted from the migration history, meaning manual intervention is required.

### Recommended Approach

#### Option 1: Safe Production Migration (Recommended)

1. **Backup your database first**
2. Run the manual migration SQL to rename existing tables
3. Deploy new code that uses Contact instead of Learner
4. Test thoroughly in staging

#### Option 2: Development Reset (Faster, loses data)

1. Export any important data
2. Reset the database with new schema
3. Re-import critical data

## Manual Migration Steps

### Step 1: Backup Your Data

```bash
# Export current learners
pnpm prisma studio
# Export learners, enrollments, lesson progress to CSV/JSON
```

### Step 2: Apply Migration SQL

The file `/prisma/migrations/manual_learner_to_contact.sql` contains the SQL to:

- Rename learner → contact table
- Add new CRM fields
- Update all foreign keys
- Preserve existing data

```bash
# Connect to your database and run the SQL
psql $DATABASE_URL < prisma/migrations/manual_learner_to_contact.sql
```

### Step 3: Update Prisma Schema

Your schema.prisma file has been updated with:

- Contact model (replacing Learner)
- CRM models (ContactNote, Appointment, Message, Task)
- All necessary enums

### Step 4: Generate New Client

```bash
pnpm prisma generate
```

### Step 5: Update Application Code

Search and replace in your codebase:

- `learner` → `contact`
- `Learner` → `Contact`
- `learnerId` → `contactId`
- Update imports and type references

## Data Model Benefits

### Before (Limited)

```
Organization → Learner (just for courses)
```

### After (Flexible)

```
Organization → Contact (type: CLINIC)
              ├→ Contact (type: PATIENT, parentId: clinic)
              ├→ Contact (type: EMPLOYEE, parentId: clinic)
              └→ Notes, Appointments, Messages, Tasks
```

### Key Advantages

1. **Unified Model**: One table for all contact types
2. **Hierarchical**: Clinics can have patients/employees
3. **CRM Features**: Full contact management capabilities
4. **Backward Compatible**: Existing enrollments still work
5. **Future-Proof**: Easy to add new contact types

## Code Changes Required

### 1. Update Imports

```typescript
// Before
import { Learner } from "@/lib/generated/prisma";

// After
import { Contact } from "@/lib/generated/prisma";
```

### 2. Update Queries

```typescript
// Before
const learners = await prisma.learner.findMany({
  where: { organizationId },
});

// After
const contacts = await prisma.contact.findMany({
  where: {
    organizationId,
    contactType: "CLINIC", // Filter by type if needed
  },
});
```

### 3. Update Components

Components referring to "learners" should be updated to "contacts" or kept as-is if they're specifically for the learning context.

## Testing Checklist

After migration, verify:

- [ ] Existing enrollments still work
- [ ] Course progress is preserved
- [ ] New contacts can be created
- [ ] Contact hierarchy works (parent/child relationships)
- [ ] CRM features (notes, appointments) can be added
- [ ] No data was lost in migration

## Rollback Plan

If issues occur:

1. Restore database backup
2. Revert code changes
3. Keep using Learner model until issues resolved

## Next Steps

1. **Immediate**: Review this plan and decide on migration approach
2. **Today**: Backup database and test migration in development
3. **Tomorrow**: Update application code to use Contact model
4. **This Week**: Deploy to staging and test thoroughly
5. **Next Week**: Deploy to production with confidence

## Questions to Consider

1. **Do you have production data?** If yes, use Option 1 (safe migration)
2. **Need to preserve enrollments?** The migration preserves all relationships
3. **When to add patient tracking?** Start with clinics only, add patients when agencies request it
4. **How to handle existing integrations?** GHL integration continues working with ContactIntegration

## Files Created/Modified

- ✅ `/prisma/schema.prisma` - Updated with Contact model and CRM features
- ✅ `/prisma/migrations/manual_learner_to_contact.sql` - Migration script
- ✅ `/docs/database-migration-plan.md` - This documentation
- ⏳ Application code files - Need updating after migration

## Support

The migration script is designed to be safe and preserve all data. However, always backup before running migrations. If you encounter issues:

1. Check the migration output for errors
2. Verify foreign key constraints are properly updated
3. Ensure no duplicate constraint names exist
4. Test with a small subset of data first
