# S3 Storage Architecture Plan

**Status:** ✅ APPROVED - Pragmatic MVP Approach
**Created:** 2025-12-07
**Updated:** 2025-12-07 (Revised after architecture review)
**Target:** Production-Ready for Pilot Churches (10-100 scale)
**Scope:** Church Connect Hub SaaS Platform

---

## Executive Summary

This document presents a **pragmatic, MVP-focused** S3 storage architecture plan for Church Connect Hub. After analyzing the current implementation, researching 2025 industry best practices, and conducting a critical review of proposed changes, we've identified:

1. **3 critical bugs** that must be fixed before production
2. **The current slug-based approach is viable** for our 10-100 church scale
3. **UUID migration is premature optimization** - revisit at 500+ churches if needed

**Current Assessment:** 7/10 - Solid foundation with a few critical bugs
**Target State:** 9/10 - Production-ready with security fixes and lifecycle automation

### Key Decision: Keep Slug-Based Paths

After weighing the costs and benefits:

- **Slugs are effectively immutable** (no edit functionality exists)
- **Migration cost is real** (~2-3 weeks dev time)
- **Migration benefit is theoretical** (solves a problem we don't have)
- **Industry examples** (Slack, GitHub, Vercel) use slugs successfully at massive scale

**Decision:** Keep `organizations/{slug}/` paths. Fix real bugs. Ship MVP.

---

## Quick Reference: What We're Actually Doing

### Critical Fixes (This Week)

| #   | Issue                                                                     | File                     | Time   | Status |
| --- | ------------------------------------------------------------------------- | ------------------------ | ------ | ------ |
| 1   | **Path inconsistency** - cleanup uses `{slug}-{id}`, upload uses `{slug}` | `lib/s3-cleanup.ts`      | 30 min | ✅     |
| 2   | **VolunteerDocument stores URLs** - should store keys only                | `schema.prisma`, actions | 2 hrs  | ✅     |
| 3   | **Exports never expire** - CSVs accumulate forever                        | `schema.prisma`, cron    | 2 hrs  | ✅     |

### Security Hardening (First Month)

| #   | Issue                           | Time   | Status |
| --- | ------------------------------- | ------ | ------ |
| 4   | Add CSP headers to uploads      | 30 min | ⬜     |
| 5   | Centralize S3 access validation | 2 hrs  | ⬜     |

### Cost Optimization (At 100 Churches)

| #   | Issue                           | Time | Status |
| --- | ------------------------------- | ---- | ------ |
| 6   | Configure S3 lifecycle policies | 1 hr | ⬜     |
| 7   | Enable CDN for video streaming  | 1 hr | ⬜     |

### Deferred (Revisit at 500+ Churches)

| Issue             | Trigger                                       |
| ----------------- | --------------------------------------------- |
| UUID-based paths  | Only if slug renames become recurring problem |
| S3 prefix hashing | Only if hitting S3 rate limits                |
| Bucket-per-tenant | Only if regulatory/compliance requires        |

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Industry Best Practices (2025)](#2-industry-best-practices-2025)
3. [Recommended Architecture](#3-recommended-architecture)
4. [Security Model](#4-security-model)
5. [Data Lifecycle Management](#5-data-lifecycle-management)
6. [Scalability Strategy](#6-scalability-strategy)
7. [Migration Plan](#7-migration-plan)
8. [Compliance & Future-Proofing](#8-compliance--future-proofing)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Cost Analysis](#10-cost-analysis)

---

## 1. Current State Analysis

### 1.1 What's Working Well

| Strength                       | Implementation                  | Rating |
| ------------------------------ | ------------------------------- | ------ |
| **Multi-tenant path prefixes** | `organizations/{slug}/...`      | Good   |
| **Presigned URL pattern**      | 6-minute expiration for uploads | Good   |
| **Signed URL access control**  | 1-hour expiration for views     | Good   |
| **Rate limiting**              | Arcjet 100 req/min              | Good   |
| **Organization validation**    | API validates org prefix        | Good   |

### 1.2 Data Types Currently Stored

| Data Type               | Volume Estimate     | Current Path                                    | Retention         |
| ----------------------- | ------------------- | ----------------------------------------------- | ----------------- |
| **Connect Card Images** | 50-500/church/month | `organizations/{slug}/connect-cards/{YYYY-MM}/` | 2 years           |
| **Course Videos**       | 50MB-2GB each       | `organizations/{slug}/courses/{slug}/`          | Indefinite        |
| **Course Thumbnails**   | 100KB-2MB each      | Same as videos                                  | Indefinite        |
| **Volunteer Documents** | 10-50/church        | `organizations/{slug}/volunteer-documents/`     | 7 years           |
| **Export CSVs**         | Varies              | `exports/{slug}/`                               | Should be 30 days |
| **Platform Courses**    | Shared content      | `platform/courses/{slug}/`                      | Indefinite        |
| **Legacy Files**        | Unknown             | `uploads/general/`                              | Migration needed  |

### 1.3 Critical Gaps Identified

| Gap                                | Severity | Risk                         | Current Location                        |
| ---------------------------------- | -------- | ---------------------------- | --------------------------------------- |
| **Volunteer docs store full URLs** | CRITICAL | Cross-tenant data leak risk  | `VolunteerDocument.fileUrl`             |
| **Path inconsistency**             | CRITICAL | Orphaned files on cleanup    | `s3-cleanup.ts` uses ID, upload doesn't |
| **No lifecycle automation**        | HIGH     | Unbounded cost growth        | No policies configured                  |
| **Exports never cleaned**          | HIGH     | Storage bloat                | No expiration in DataExport             |
| **Mutable org slug in paths**      | HIGH     | Broken files if slug changes | All paths use slug, not ID              |
| **No temp file cleanup**           | MEDIUM   | Wasted storage               | No temp folder pattern                  |
| **Auth pattern differs**           | MEDIUM   | Security inconsistency       | S3 APIs vs requireAdmin()               |

### 1.4 Files Touching S3

**Core Infrastructure:**

- `/lib/S3Client.ts` - S3 client configuration
- `/lib/s3-cleanup.ts` - Batch deletion utilities
- `/lib/env.ts` - Environment validation

**API Routes:**

- `/app/api/s3/upload/route.ts` - Presigned URL generation
- `/app/api/s3/view/route.ts` - Signed URL for viewing
- `/app/api/s3/delete/route.ts` - File deletion
- `/app/api/s3/volunteer-documents/route.ts` - Volunteer doc uploads
- `/app/api/export/download/route.ts` - CSV export download

**Server Actions:**

- `/actions/export/create-export.ts` - CSV generation + S3 upload
- `/actions/delete-course.ts` - Course deletion with S3 cleanup
- `/actions/connect-card/save-connect-card.ts` - Connect card persistence

---

## 2. Industry Best Practices (2025)

### 2.1 Multi-Tenant Isolation Patterns

Based on [AWS Storage Blog](https://aws.amazon.com/blogs/storage/design-patterns-for-multi-tenant-access-control-on-amazon-s3/) and [AWS SaaS Factory guidance](https://aws.amazon.com/blogs/apn/partitioning-and-isolating-multi-tenant-saas-data-with-amazon-s3/):

| Pattern                    | Description                      | Best For                             | Our Fit                             |
| -------------------------- | -------------------------------- | ------------------------------------ | ----------------------------------- |
| **Bucket-per-Tenant**      | Dedicated bucket per org         | Regulatory compliance, premium tiers | Not now (10k bucket limit concerns) |
| **Shared Bucket + Prefix** | One bucket, path-based isolation | 10-10,000 tenants, cost optimization | **RECOMMENDED**                     |
| **S3 Access Points**       | Per-tenant endpoint aliases      | Complex permission models            | Future consideration                |

**Decision: Shared Bucket with Strict Prefix Isolation**

Rationale:

- Tigris S3-compatible doesn't support all bucket policy features
- Cost optimized for 10-1000+ churches
- Operational simplicity (one lifecycle config, one monitoring dashboard)
- Proven pattern used by Slack, Dropbox at massive scale

### 2.2 Naming Convention Best Practices

From [AWS S3 Naming Guidance](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html):

| Practice                         | Why                                  | Our Implementation   |
| -------------------------------- | ------------------------------------ | -------------------- |
| **Use immutable IDs, not slugs** | Slugs can change, breaks paths       | Switch to org-id     |
| **Use `/` as delimiter**         | S3 optimizes partitioning            | Already doing        |
| **Split year/month: `YYYY/MM`**  | Better S3 performance than `YYYY-MM` | Update connect cards |
| **Lowercase only**               | Consistency, case-sensitivity issues | Already doing        |
| **No sensitive info in paths**   | URLs visible in logs                 | Already compliant    |

### 2.3 Security Best Practices

| Practice                        | Status     | Action Needed                |
| ------------------------------- | ---------- | ---------------------------- |
| Principle of least privilege    | Partial    | Centralize access validation |
| Presigned URLs (not public)     | ✅ Done    | None                         |
| Short expiration times          | ✅ Done    | None                         |
| Content-Security-Policy headers | ❌ Missing | Add to uploads               |
| Bucket owner enforced ownership | Unknown    | Verify Tigris config         |
| No ACLs (use policies instead)  | ✅ N/A     | None                         |

---

## 3. Recommended Architecture

### 3.1 Bucket Strategy

**Single Shared Bucket** with organization-id-based prefix isolation.

```
Bucket: church-connect-hub-production
├── tenants/                        # All organization data
│   └── {org-id}/                   # Use UUID (immutable), not slug
│       ├── connect-cards/
│       ├── courses/
│       ├── volunteer-docs/
│       ├── exports/
│       └── temp/
├── platform/                       # Shared platform content
│   └── courses/
└── _legacy/                        # Migration holding area
    └── {original-path}
```

**Why org-id instead of slug:**

- Slugs are mutable (church renames from "first-baptist" to "fb-downtown")
- IDs are immutable UUIDs
- Prevents broken file references after rename

### 3.2 Complete Path Structure

```
{bucket}/
├── tenants/
│   └── {org-id}/                              # e.g., "550e8400-e29b-41d4-a716-446655440000"
│       ├── connect-cards/
│       │   └── {YYYY}/
│       │       └── {MM}/
│       │           ├── {card-id}-front.jpg    # Use DB record ID
│       │           └── {card-id}-back.jpg
│       ├── courses/
│       │   └── {course-id}/
│       │       ├── thumbnail.jpg              # Simple names, version via ?v= param
│       │       ├── banner.jpg
│       │       └── videos/
│       │           └── {lesson-id}.mp4
│       ├── volunteer-docs/
│       │   ├── global/                        # All-ministry documents
│       │   │   └── {doc-id}.pdf
│       │   └── {category-slug}/               # Ministry-specific
│       │       └── {doc-id}.pdf
│       ├── exports/
│       │   └── {YYYY-MM-DD}/                  # Date folders for lifecycle cleanup
│       │       └── {export-id}.csv
│       └── temp/                              # 24-hour auto-delete
│           └── {session-id}.{ext}
├── platform/
│   └── courses/
│       └── {course-id}/
│           └── ... (same structure as org courses)
└── _legacy/
    ├── uploads/general/                       # Old upload paths (90-day grace)
    └── orphaned/                              # Files with no DB reference
```

### 3.3 Path Pattern Specification

```typescript
// lib/s3-paths.ts - Single source of truth

export const S3Paths = {
  /**
   * Connect card image path
   * @example "tenants/550e8400.../connect-cards/2025/12/card-abc123-front.jpg"
   */
  connectCard: (orgId: string, cardId: string, side: "front" | "back") => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `tenants/${orgId}/connect-cards/${year}/${month}/${cardId}-${side}.jpg`;
  },

  /**
   * Course asset path (org-specific or platform)
   * @example "tenants/550e8400.../courses/course-xyz/thumbnail.jpg"
   * @example "platform/courses/course-xyz/thumbnail.jpg"
   */
  courseAsset: (
    orgId: string | null,
    courseId: string,
    type: "thumbnail" | "banner"
  ) => {
    const scope = orgId ? `tenants/${orgId}` : "platform";
    return `${scope}/courses/${courseId}/${type}.jpg`;
  },

  /**
   * Course video path
   * @example "tenants/550e8400.../courses/course-xyz/videos/lesson-abc.mp4"
   */
  courseVideo: (orgId: string | null, courseId: string, lessonId: string) => {
    const scope = orgId ? `tenants/${orgId}` : "platform";
    return `${scope}/courses/${courseId}/videos/${lessonId}.mp4`;
  },

  /**
   * Volunteer document path
   * @example "tenants/550e8400.../volunteer-docs/global/doc-abc123.pdf"
   * @example "tenants/550e8400.../volunteer-docs/kids-ministry/doc-xyz.pdf"
   */
  volunteerDoc: (orgId: string, docId: string, category: string | null) => {
    const scope = category ?? "global";
    return `tenants/${orgId}/volunteer-docs/${scope}/${docId}.pdf`;
  },

  /**
   * Export file path (date-organized for lifecycle)
   * @example "tenants/550e8400.../exports/2025-12-07/export-abc123.csv"
   */
  export: (orgId: string, exportId: string) => {
    const today = new Date().toISOString().split("T")[0];
    return `tenants/${orgId}/exports/${today}/${exportId}.csv`;
  },

  /**
   * Temporary file path (auto-deleted after 24h)
   * @example "tenants/550e8400.../temp/session-xyz.jpg"
   */
  temp: (orgId: string, sessionId: string, ext: string) => {
    return `tenants/${orgId}/temp/${sessionId}.${ext}`;
  },

  /**
   * Legacy file migration path
   * @example "_legacy/uploads/general/thumbnail-123-abc.jpg"
   */
  legacy: (originalKey: string) => {
    return `_legacy/${originalKey}`;
  },

  /**
   * Extract org ID from any tenant path
   */
  extractOrgId: (key: string): string | null => {
    const match = key.match(/^tenants\/([^/]+)\//);
    return match ? match[1] : null;
  },
} as const;
```

### 3.4 Comparison: Current vs Recommended

| Aspect               | Current              | Recommended                    | Benefit                          |
| -------------------- | -------------------- | ------------------------------ | -------------------------------- |
| **Org identifier**   | `slug` (mutable)     | `org-id` (UUID)                | Slug changes don't break files   |
| **File naming**      | `timestamp-secureId` | `{db-record-id}`               | Direct DB↔S3 mapping            |
| **Date format**      | `YYYY-MM`            | `YYYY/MM`                      | S3 partitioning optimization     |
| **Exports location** | `exports/{slug}/`    | `tenants/{id}/exports/{date}/` | Unified tenant prefix, lifecycle |
| **Volunteer docs**   | Stores full URLs     | Stores keys only               | Provider-agnostic, secure        |
| **Temp files**       | Scattered            | Dedicated `temp/`              | Bulk cleanup, cost savings       |
| **Legacy files**     | In-place             | `_legacy/` folder              | Safe migration, clear ownership  |

---

## 4. Security Model

### 4.1 Current Security Assessment

| Control                 | Status | Gap                    |
| ----------------------- | ------ | ---------------------- |
| Authentication required | ✅     | None                   |
| Organization validation | ✅     | Uses slug (mutable)    |
| Presigned URL upload    | ✅     | None                   |
| Signed URL viewing      | ✅     | None                   |
| Rate limiting           | ✅     | None                   |
| Role-based access       | ⚠️     | Inconsistent pattern   |
| Content-Security-Policy | ❌     | XSS risk from uploads  |
| Volunteer doc isolation | ❌     | Full URLs expose paths |

### 4.2 Critical Security Fix: Volunteer Documents

**Current vulnerability:**

```prisma
// schema.prisma - CURRENT (INSECURE)
model VolunteerDocument {
  fileUrl String  // Stores: "https://bucket.tigris.dev/organizations/bainbridge/..."
}
```

**Attack vector:**

1. Attacker gets `fileUrl` from API response
2. URL reveals: `organizations/{slug}/volunteer-docs/...`
3. Attacker modifies `{slug}` to another church
4. If bucket misconfigured, **cross-tenant data leak**

**Fix:**

```prisma
// schema.prisma - RECOMMENDED
model VolunteerDocument {
  fileKey String  // Stores only: "tenants/{org-id}/volunteer-docs/global/{doc-id}.pdf"
  // URL generated on-demand via signed URL API
}
```

### 4.3 Centralized Access Validation

```typescript
// lib/s3-security.ts - RECOMMENDED

interface S3AccessContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}

/**
 * Validate user can access the given S3 key
 * @throws Error if access denied
 */
export function validateS3Access(key: string, context: S3AccessContext): void {
  // 1. Platform content is accessible to all authenticated users
  if (key.startsWith("platform/")) {
    return;
  }

  // 2. Tenant content must match user's organization
  const keyOrgId = S3Paths.extractOrgId(key);
  if (keyOrgId !== context.organizationId) {
    throw new Error("Access denied: organization mismatch");
  }

  // 3. Volunteer docs require elevated permissions
  if (key.includes("/volunteer-docs/")) {
    if (
      !["platform_admin", "church_owner", "church_admin"].includes(context.role)
    ) {
      throw new Error(
        "Access denied: insufficient permissions for volunteer documents"
      );
    }
  }

  // 4. Exports require admin permissions
  if (key.includes("/exports/")) {
    if (
      !["platform_admin", "church_owner", "church_admin"].includes(context.role)
    ) {
      throw new Error("Access denied: insufficient permissions for exports");
    }
  }
}

/**
 * Build secure S3 key with automatic organization scoping
 */
export function buildSecureKey(
  context: S3AccessContext,
  type: keyof typeof S3Paths,
  ...args: unknown[]
): string {
  // Type-safe key generation with automatic org ID injection
  // Prevents manual path construction errors
}
```

### 4.4 Content Security Headers

Add to all file uploads to prevent XSS:

```typescript
// In upload API - add security headers
const command = new PutObjectCommand({
  Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
  Key: uniqueKey,
  ContentType: contentType,
  Metadata: {
    "x-amz-meta-content-security-policy": "default-src 'none'",
    "x-amz-meta-x-content-type-options": "nosniff",
  },
  ContentDisposition: "inline", // or 'attachment' for downloads
});
```

---

## 5. Data Lifecycle Management

### 5.1 Retention Requirements

| Data Type           | Retention  | Reason                             | Automation       |
| ------------------- | ---------- | ---------------------------------- | ---------------- |
| Connect Cards       | 2 years    | Legal compliance, visitor history  | Lifecycle policy |
| Volunteer Documents | 7 years    | Background check legal requirement | Lifecycle policy |
| Course Content      | Indefinite | Ongoing value                      | No expiration    |
| Export CSVs         | 30 days    | Temporary download files           | Lifecycle policy |
| Temp Files          | 24 hours   | Upload staging                     | Lifecycle policy |
| Legacy Files        | 90 days    | Migration grace period             | Lifecycle policy |

### 5.2 Tigris/S3 Lifecycle Configuration

```xml
<LifecycleConfiguration>
  <!-- Connect Cards: 2-year retention -->
  <Rule>
    <ID>connect-cards-2yr</ID>
    <Filter>
      <Prefix>tenants/</Prefix>
      <Tag><Key>type</Key><Value>connect-card</Value></Tag>
    </Filter>
    <Status>Enabled</Status>
    <Expiration>
      <Days>730</Days>
    </Expiration>
  </Rule>

  <!-- Exports: 30-day retention -->
  <Rule>
    <ID>exports-30d</ID>
    <Filter>
      <Prefix>tenants/</Prefix>
    </Filter>
    <Status>Enabled</Status>
    <Expiration>
      <Days>30</Days>
    </Expiration>
    <Filter>
      <And>
        <Prefix>tenants/</Prefix>
        <Tag><Key>type</Key><Value>export</Value></Tag>
      </And>
    </Filter>
  </Rule>

  <!-- Temp Files: 1-day retention -->
  <Rule>
    <ID>temp-1d</ID>
    <Filter>
      <Prefix>tenants/*/temp/</Prefix>
    </Filter>
    <Status>Enabled</Status>
    <Expiration>
      <Days>1</Days>
    </Expiration>
  </Rule>

  <!-- Legacy Files: 90-day grace period -->
  <Rule>
    <ID>legacy-90d</ID>
    <Filter>
      <Prefix>_legacy/</Prefix>
    </Filter>
    <Status>Enabled</Status>
    <Expiration>
      <Days>90</Days>
    </Expiration>
  </Rule>

  <!-- Volunteer Docs: 7-year retention -->
  <Rule>
    <ID>volunteer-docs-7yr</ID>
    <Filter>
      <Prefix>tenants/*/volunteer-docs/</Prefix>
    </Filter>
    <Status>Enabled</Status>
    <Expiration>
      <Days>2555</Days>
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

### 5.3 Application-Level Cleanup (Backup)

Since Tigris may not support all S3 lifecycle features, implement application-level backup:

```typescript
// app/api/cron/s3-cleanup/route.ts
// Vercel cron: daily at 2 AM UTC

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await cleanupExpiredFiles();

  // Log results for monitoring
  console.log("[S3 Lifecycle]", {
    exportsDeleted: results.exports,
    tempDeleted: results.temp,
    legacyDeleted: results.legacy,
    timestamp: new Date().toISOString(),
  });

  return Response.json({ success: true, ...results });
}
```

---

## 6. Scalability Strategy

### 6.1 Current Performance Limits

| Metric                 | Current Capacity | At 100 Churches   | At 1000 Churches    |
| ---------------------- | ---------------- | ----------------- | ------------------- |
| S3 requests/prefix     | 3,500 PUT/s      | Sufficient        | Monitor             |
| Sunday morning uploads | ~50 concurrent   | ~5,000 concurrent | ~50,000 concurrent  |
| Video streaming        | Direct S3        | Works             | CDN required        |
| ListObjects speed      | Fast             | Slower            | Pagination required |

### 6.2 S3 Prefix Hashing (Future)

For 500+ churches with high concurrent uploads, implement prefix hashing:

```
Current (simple):
tenants/{org-id}/connect-cards/...

Scaled (hashed):
tenants/{first-char-of-id}/{org-id}/connect-cards/...

Example:
tenants/5/550e8400-e29b-41d4.../connect-cards/2025/12/...
tenants/a/a1b2c3d4-e5f6-7890.../connect-cards/2025/12/...
```

**When to implement:** When approaching 500 concurrent uploading churches

### 6.3 Video CDN Strategy

**Current:** Direct Tigris S3 downloads
**Problem at scale:**

- No caching = slow for repeated views
- High egress costs

**Recommended (Phase 2):**

```
Browser → Cloudflare CDN → Tigris S3
         (edge cache)    (origin)
```

**Implementation:**

1. Enable Tigris CDN feature (built-in)
2. Add Cache-Control headers to video uploads:

```typescript
CacheControl: "public, max-age=31536000, immutable"; // 1 year
```

### 6.4 Cost Projections

| Scale         | Storage | Egress (no CDN) | Egress (with CDN) | Monthly Cost     |
| ------------- | ------- | --------------- | ----------------- | ---------------- |
| 10 churches   | ~50GB   | ~200GB          | ~60GB             | ~$25             |
| 100 churches  | ~500GB  | ~2TB            | ~600GB            | ~$75 (with CDN)  |
| 1000 churches | ~5TB    | ~20TB           | ~6TB              | ~$500 (with CDN) |

**Savings from lifecycle policies:** ~40% storage reduction
**Savings from CDN:** ~70% egress reduction

---

## 7. Migration Plan

### 7.1 Phase 1: Schema & Code Fixes (Week 1)

**Day 1-2: Fix path inconsistency**

```typescript
// BEFORE (inconsistent)
// s3-cleanup.ts line 221
const prefix = `organizations/${org.slug}-${org.id}/`;

// upload/route.ts line 378
const prefix = `organizations/${org.slug}/`;

// AFTER (consistent)
const prefix = `tenants/${org.id}/`;
```

**Day 3-4: Migrate VolunteerDocument schema**

```sql
-- Migration script
ALTER TABLE "volunteer_document" ADD COLUMN "file_key" TEXT;

UPDATE "volunteer_document"
SET "file_key" = REGEXP_REPLACE(
  "file_url",
  'https://[^/]+/',
  ''
)
WHERE "file_url" IS NOT NULL;

-- After verification
ALTER TABLE "volunteer_document" DROP COLUMN "file_url";
ALTER TABLE "volunteer_document" ALTER COLUMN "file_key" SET NOT NULL;
```

**Day 5: Add expiresAt to DataExport**

```prisma
model DataExport {
  // ... existing fields
  expiresAt DateTime @default(dbgenerated("NOW() + INTERVAL '30 days'"))
}
```

### 7.2 Phase 2: Lifecycle Policies (Week 2)

1. Configure Tigris lifecycle via console/API
2. Deploy cron job for application-level cleanup
3. Verify policies working in staging

### 7.3 Phase 3: Legacy Migration (Week 3-4)

```typescript
// scripts/migrate-legacy-s3.ts

async function migrateLegacyFiles() {
  // 1. List all legacy files
  const legacyFiles = await listObjectsByPrefix("uploads/general/");

  for (const file of legacyFiles) {
    // 2. Find database record
    const record = await findRecordByFileKey(file.key);

    if (record) {
      // 3. Copy to new location
      const newKey = buildNewKey(record);
      await copyObject(file.key, newKey);

      // 4. Update database
      await updateRecordFileKey(record.id, newKey);

      // 5. Move old to _legacy/ (don't delete yet)
      await moveObject(file.key, `_legacy/${file.key}`);
    } else {
      // Orphaned file
      await moveObject(file.key, `_legacy/orphaned/${file.key}`);
    }
  }
}
```

### 7.4 Phase 4: Path Pattern Update (Week 5)

Update all file generators to use new `S3Paths` module:

- `/app/api/s3/upload/route.ts`
- `/app/api/s3/volunteer-documents/route.ts`
- `/actions/export/create-export.ts`
- `/lib/s3-cleanup.ts`

---

## 8. Compliance & Future-Proofing

### 8.1 Compliance Requirements

| Requirement                        | Status        | Implementation            |
| ---------------------------------- | ------------- | ------------------------- |
| **2-year connect card retention**  | ✅ Documented | Lifecycle policy          |
| **7-year volunteer doc retention** | ✅ Documented | Lifecycle policy          |
| **GDPR data deletion**             | ❌ Missing    | Add org deletion workflow |
| **Audit logging**                  | ❌ Missing    | Add S3AccessLog model     |
| **Encryption at rest**             | ⚠️ Unknown    | Verify Tigris settings    |

### 8.2 GDPR Data Deletion

```typescript
// When church cancels subscription
async function deleteChurchData(organizationId: string) {
  // 1. Delete all S3 files
  await deleteByPrefix(`tenants/${organizationId}/`);

  // 2. Soft-delete database records
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
      dataRetentionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Schedule hard delete via cron
}
```

### 8.3 Future Considerations

| Feature                         | When                    | Implementation          |
| ------------------------------- | ----------------------- | ----------------------- |
| **Multi-region storage**        | International expansion | Tigris global buckets   |
| **Customer-managed encryption** | Enterprise tier         | KMS integration         |
| **Audit logging**               | Compliance request      | S3AccessLog model       |
| **File versioning**             | Course content updates  | S3 versioning           |
| **Signed URL audit trail**      | Security requirement    | Log all URL generations |

---

## 9. Implementation Roadmap

### Week 1: Critical Fixes (P0 - Blocks Production)

| Day | Task                              | Files                               | Risk   |
| --- | --------------------------------- | ----------------------------------- | ------ |
| 1   | Fix path inconsistency (slug→id)  | `s3-cleanup.ts`, `upload/route.ts`  | High   |
| 2   | Migrate VolunteerDocument URL→key | `schema.prisma`, migration          | High   |
| 3   | Add S3 key validation to cleanup  | `s3-cleanup.ts`                     | Medium |
| 4   | Add export file expiration        | `schema.prisma`, `create-export.ts` | Medium |
| 5   | Create `S3Paths` module           | New file                            | Low    |

### Week 2: Security Hardening (P1)

| Task                                   | Effort  | Impact               |
| -------------------------------------- | ------- | -------------------- |
| Add CSP headers to uploads             | 2 hours | Prevents XSS         |
| Centralize access validation           | 4 hours | Consistent security  |
| Add org existence check before cleanup | 1 hour  | Prevents accidents   |
| Audit all S3 endpoints                 | 4 hours | Find vulnerabilities |

### Week 3: Lifecycle Automation (P1)

| Task                        | Effort  | Impact            |
| --------------------------- | ------- | ----------------- |
| Configure Tigris lifecycle  | 1 hour  | Automated cleanup |
| Deploy cleanup cron job     | 2 hours | Backup automation |
| Add expiresAt to DataExport | 1 hour  | Track expiration  |
| Create temp folder cleanup  | 1 hour  | Cost savings      |

### Week 4: Legacy Migration (P2)

| Task                          | Effort  | Impact             |
| ----------------------------- | ------- | ------------------ |
| Create migration script       | 4 hours | Move old files     |
| Test on staging               | 2 hours | Verify safety      |
| Execute production migration  | 2 hours | Complete migration |
| Monitor for broken references | Ongoing | Catch issues       |

### Month 2: Performance & Cost (P3)

| Task                      | Effort  | Impact             |
| ------------------------- | ------- | ------------------ |
| Enable Tigris CDN         | 1 hour  | 70% egress savings |
| Add Cache-Control headers | 2 hours | Better caching     |
| Implement prefix hashing  | 4 hours | Scale preparation  |
| Set up cost alerts        | 1 hour  | Budget control     |

---

## 10. Cost Analysis

### 10.1 Current Cost Structure (Estimated)

| Component            | 10 Churches | 100 Churches |
| -------------------- | ----------- | ------------ |
| Storage (50GB→500GB) | $2.50       | $25          |
| PUT requests         | $0.50       | $5           |
| GET requests         | $1          | $10          |
| Egress (200GB→2TB)   | $18         | $180         |
| **Total/month**      | **~$22**    | **~$220**    |

### 10.2 Optimized Cost (With Recommendations)

| Optimization                     | Savings                         |
| -------------------------------- | ------------------------------- |
| Lifecycle policies (40% storage) | -$10 at 100 churches            |
| CDN caching (70% egress)         | -$126 at 100 churches           |
| Temp file cleanup                | -$5 at 100 churches             |
| **Total savings**                | **~$141/month at 100 churches** |

### 10.3 ROI Summary

| Investment         | One-Time Cost | Monthly Savings | Payback       |
| ------------------ | ------------- | --------------- | ------------- |
| Lifecycle policies | 4 hours dev   | $50             | Immediate     |
| CDN setup          | 2 hours dev   | $126            | Immediate     |
| Migration script   | 8 hours dev   | $10             | 1 month       |
| **Total**          | **14 hours**  | **$186/month**  | **< 1 month** |

---

## Appendix A: Validation Checklist

Before deploying to production, verify:

### Security

- [ ] All S3 APIs validate organizationId (not slug)
- [ ] Presigned URLs expire within 10 minutes
- [ ] No public bucket access
- [ ] CSP headers on uploaded files
- [ ] Rate limiting on all endpoints
- [ ] Volunteer docs use keys, not URLs

### Lifecycle

- [ ] Tigris lifecycle policies configured
- [ ] Cleanup cron job deployed
- [ ] Export files auto-delete after 30 days
- [ ] Temp files auto-delete after 24 hours
- [ ] Legacy files in `_legacy/` folder

### Data Integrity

- [ ] All paths use org ID (not slug)
- [ ] Database stores S3 keys (not URLs)
- [ ] Cleanup functions match upload paths
- [ ] No orphaned files after deletions

### Performance

- [ ] Videos have Cache-Control headers
- [ ] CDN enabled for video streaming
- [ ] ListObjects uses pagination
- [ ] Prefix hashing ready (if >500 churches)

---

## Appendix B: Sources

### Industry Best Practices

- [AWS: Design patterns for multi-tenant access control on Amazon S3](https://aws.amazon.com/blogs/storage/design-patterns-for-multi-tenant-access-control-on-amazon-s3/)
- [AWS: Partitioning and Isolating Multi-Tenant SaaS Data with Amazon S3](https://aws.amazon.com/blogs/apn/partitioning-and-isolating-multi-tenant-saas-data-with-amazon-s3/)
- [AWS: Naming Amazon S3 objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html)
- [AWS: Naming Amazon S3 buckets in data layers](https://docs.aws.amazon.com/prescriptive-guidance/latest/defining-bucket-names-data-lakes/naming-structure-data-layers.html)
- [GitHub: AWS SaaS Factory S3 Multitenancy](https://github.com/aws-samples/aws-saas-factory-s3-multitenancy)

### Related Project Documentation

- `/docs/features/tech-debt/s3-bucket-structure.md` - Current S3 spec
- `/docs/features/tech-debt/environment-configuration.md` - Env setup
- `/docs/PLAYBOOK.md` - Technical patterns

---

**Document Status:** Ready for Review
**Next Step:** Approval to begin Week 1 implementation
**Author:** Claude Code + Backend Architect Subagent
**Date:** 2025-12-07
