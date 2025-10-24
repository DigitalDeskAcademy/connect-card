-- Manual migration script to rename Learner to Contact
-- Run this BEFORE creating the Prisma migration
-- This preserves existing data while transforming the schema

-- Step 1: Rename the learner table to contact
ALTER TABLE "learner" RENAME TO "contact";

-- Step 2: Add new CRM fields to contact table
ALTER TABLE "contact"
ADD COLUMN IF NOT EXISTS "contactType" TEXT DEFAULT 'CLINIC',
ADD COLUMN IF NOT EXISTS "parentContactId" TEXT,
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "customFields" JSONB;

-- Step 3: Rename learner_integration to contact_integration
ALTER TABLE "learner_integration" RENAME TO "contact_integration";

-- Step 4: Rename foreign key columns in related tables
ALTER TABLE "contact_integration" RENAME COLUMN "learnerId" TO "contactId";
ALTER TABLE "enrollment" RENAME COLUMN "learnerId" TO "contactId";
ALTER TABLE "lessonProgress" RENAME COLUMN "learnerId" TO "contactId";

-- Step 5: Update foreign key constraints
ALTER TABLE "contact_integration"
DROP CONSTRAINT IF EXISTS "learner_integration_learnerId_fkey",
ADD CONSTRAINT "contact_integration_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE;

ALTER TABLE "enrollment"
DROP CONSTRAINT IF EXISTS "enrollment_learnerId_fkey",
ADD CONSTRAINT "enrollment_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE;

ALTER TABLE "lessonProgress"
DROP CONSTRAINT IF EXISTS "lessonProgress_learnerId_fkey",
ADD CONSTRAINT "lessonProgress_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE;

-- Step 6: Update unique constraints
ALTER TABLE "enrollment"
DROP CONSTRAINT IF EXISTS "enrollment_learnerId_courseId_key",
ADD CONSTRAINT "enrollment_contactId_courseId_key"
UNIQUE ("contactId", "courseId");

ALTER TABLE "lessonProgress"
DROP CONSTRAINT IF EXISTS "lessonProgress_learnerId_lessonId_key",
ADD CONSTRAINT "lessonProgress_contactId_lessonId_key"
UNIQUE ("contactId", "lessonId");

-- Step 7: Add index for parentContactId (hierarchy support)
CREATE INDEX IF NOT EXISTS "contact_parentContactId_idx" ON "contact"("parentContactId");

-- Step 8: Add index for contactType filtering
CREATE INDEX IF NOT EXISTS "contact_organizationId_contactType_idx" ON "contact"("organizationId", "contactType");

-- Step 9: Update existing records with default contactType
UPDATE "contact" SET "contactType" = 'CLINIC' WHERE "contactType" IS NULL;

-- Note: After running this migration:
-- 1. Run `prisma db pull` to update your schema with the current database state
-- 2. Run `prisma generate` to regenerate the Prisma Client
-- 3. Update all application code references from 'learner' to 'contact'