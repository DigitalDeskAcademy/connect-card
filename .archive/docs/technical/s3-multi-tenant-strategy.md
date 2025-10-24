# S3 Multi-Tenant Storage Strategy

## Current State Analysis

### What You Have Now (✅ Already Good!)

Your current implementation at `app/api/s3/upload/route.ts:289-299` is **already following industry best practices**:

```typescript
// Agency course: organizations/{org-slug}/courses/{course-slug}/{type}-{timestamp}-{secureId}.{ext}
uniqueKey = `organizations/${organizationSlug}/courses/${courseSlug}/${fileType}-${timestamp}-${secureId}.${fileExtension}`;

// Platform course: platform/courses/{course-slug}/{type}-{timestamp}-{secureId}.{ext}
uniqueKey = `platform/courses/${courseSlug}/${fileType}-${timestamp}-${secureId}.${fileExtension}`;
```

**This is the AWS-recommended pattern for multi-tenant SaaS applications.**

### Current Structure in Your Bucket

```
sidecar-uploads/
├── organizations/
│   └── {org-slug}/              # e.g., "ghl-mastery"
│       └── courses/
│           └── {course-slug}/    # e.g., "onboarding-basics"
│               ├── thumbnail-{timestamp}-{id}.jpg
│               ├── asset-{timestamp}-{id}.mp4
│               └── banner-{timestamp}-{id}.png
│
├── platform/
│   └── courses/
│       └── {course-slug}/        # e.g., "iv-clinic-quickstart"
│           ├── thumbnail-{timestamp}-{id}.jpg
│           └── asset-{timestamp}-{id}.mp4
│
└── uploads/
    └── general/                  # Fallback (shouldn't happen in production)
        └── asset-{timestamp}-{id}.bin
```

---

## Industry Standards: How Big Companies Do It

### Pattern 1: **Shared Bucket with Prefix-Based Isolation** (What You're Using ✅)

**Used by:** Dropbox Business, Slack, Notion, most B2B SaaS platforms

**Structure:**

```
bucket-name/
├── tenant-1/resources/
├── tenant-2/resources/
└── tenant-3/resources/
```

**Advantages:**

- Scales to thousands of tenants
- No bucket quota concerns (10,000 bucket limit per AWS account)
- Centralized CORS, lifecycle policies, and monitoring
- **Can achieve 5,500 GET requests/sec PER PREFIX** (unlimited prefixes)
- Easy to implement per-tenant storage quotas via prefix analytics

**Your Implementation:** ✅ Perfect for your use case

### Pattern 2: **Bucket-Per-Tenant** (NOT Recommended for You)

**Used by:** Enterprise platforms with <100 high-value clients (e.g., Salesforce Shield encryption)

**Advantages:**

- Strongest data isolation
- Tenant-specific encryption keys
- Easy to delete entire tenant

**Disadvantages:**

- AWS limit: 10,000 buckets per account (can increase to 1M, but complex)
- Management overhead scales linearly with tenants
- CORS config must be set per bucket
- Not practical for 100+ agencies

---

## Your Situation: Analysis & Recommendation

### ✅ KEEP YOUR CURRENT STRUCTURE

Your structure is **production-grade** and follows AWS best practices for multi-tenant SaaS.

### Why Your Structure Works Well

1. **Clear Tenant Isolation:**

   ```
   organizations/{org-slug}/courses/{course-slug}/
   platform/courses/{course-slug}/
   ```

   - Easy to identify which files belong to which tenant
   - Simple prefix-based IAM policies for security
   - Clear billing/usage tracking per organization

2. **Human-Readable Paths:**

   - `organizations/ghl-mastery/courses/onboarding-basics/thumbnail-1704067200000-a3b4c5d6.jpg`
   - Debugging is easy (you can see which org/course immediately)
   - Support team can locate files without guessing

3. **Collision Prevention:**

   - `{type}-{timestamp}-{secureId}.{ext}` ensures uniqueness
   - 48 bits of entropy from secureId prevents conflicts
   - Timestamp allows chronological sorting

4. **Scalability:**
   - Each organization gets its own prefix
   - S3 can handle 5,500 GET/sec PER organization prefix
   - No performance degradation as you grow

---

## The "Confusion" Problem & Solutions

### What Makes Your Bucket Confusing Right Now

**Problem:** When you open Tigris console, you see a flat list of files without folder hierarchy visualization.

**This is NOT a structure problem** - it's a **tooling problem**.

### Solutions to Improve Visibility

#### Option 1: Use AWS CLI with Prefix Filtering (Immediate Fix)

```bash
# View all files for a specific organization
aws s3 ls s3://sidecar-uploads/organizations/ghl-mastery/ --recursive

# View all platform courses
aws s3 ls s3://sidecar-uploads/platform/courses/ --recursive

# View specific course
aws s3 ls s3://sidecar-uploads/organizations/ghl-mastery/courses/onboarding-basics/
```

**Benefits:**

- No code changes needed
- Filters by prefix (organization or course)
- Works immediately

#### Option 2: Build Admin Dashboard for Storage (Recommended for Production)

**Create:** `/app/platform/admin/storage/page.tsx`

**Features:**

- List organizations and their storage usage
- Drill down into specific organization → courses → files
- Click to delete entire course folder
- Visual hierarchy (like Finder/Explorer)

**Implementation:**

```typescript
// lib/services/storage-service.ts
export async function listOrganizationFiles(orgSlug: string) {
  const command = new ListObjectsV2Command({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    Prefix: `organizations/${orgSlug}/`,
  });

  const response = await S3.send(command);
  return response.Contents; // Array of files
}

export async function deleteCourseFolder(orgSlug: string, courseSlug: string) {
  const prefix = `organizations/${orgSlug}/courses/${courseSlug}/`;

  // 1. List all files in folder
  const files = await listOrganizationFiles(orgSlug);
  const courseFiles = files.filter(f => f.Key?.startsWith(prefix));

  // 2. Delete all files (max 1000 per batch)
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    Delete: {
      Objects: courseFiles.map(f => ({ Key: f.Key })),
    },
  });

  await S3.send(deleteCommand);
}
```

**Status:** Not implemented (add to ROADMAP.md Phase 2)

#### Option 3: Use S3 Browser Tools (Immediate Fix)

**Free Tools:**

- **Cyberduck** (Mac/Windows) - Visual S3 browser with folder view
- **S3 Browser** (Windows) - Dedicated S3 explorer
- **CloudBerry Explorer** (Mac/Windows) - Multi-cloud file manager

**Setup:**

1. Install Cyberduck
2. Add connection with Tigris credentials
3. Browse bucket with folder hierarchy
4. Right-click folder → Delete (deletes all files in prefix)

---

## Cloudflare R2 vs Tigris Decision

### Should You Switch to R2?

**TL;DR: NO - Stay with Tigris for now.**

### Performance Comparison

| Metric                | Tigris         | R2           | AWS S3    |
| --------------------- | -------------- | ------------ | --------- |
| **GET Latency (p90)** | 8ms ⚡         | 199ms 🐌     | 42ms      |
| **PUT Latency (p90)** | 36ms ⚡        | 340ms 🐌     | 38ms      |
| **Read Throughput**   | 3,300 ops/s ⚡ | 170 ops/s 🐌 | 892 ops/s |
| **Write Throughput**  | 828 ops/s ⚡   | 43 ops/s 🐌  | 224 ops/s |

**Tigris is 20× faster than R2 for your video upload workload.**

### Cost Comparison

**Tigris:**

- Storage: Unknown (need to check your plan)
- Egress: Pay per GB
- Operations: Pay per request

**R2:**

- Storage: $0.015/GB/month
- **Egress: FREE** 🎉
- Operations: $0.36 per million reads, $4.50 per million writes

### When to Choose R2

✅ **Choose R2 if:**

- High egress is expected (serving videos to thousands of users)
- Cost predictability matters more than performance
- Users are globally distributed (R2 has global caching)
- You want zero vendor lock-in

❌ **Avoid R2 if:**

- Performance is critical (admin uploading videos needs fast feedback)
- Upload-heavy workload (20× slower writes)
- Low latency required for preview/testing

### Your Situation: Recommendation

**STAY WITH TIGRIS** because:

1. **Your workload is upload-heavy:** Admins uploading videos, not end-users streaming
2. **Performance matters:** 36ms vs 340ms upload latency = better UX
3. **Low egress initially:** Few users watching videos in MVP phase
4. **Already working:** CORS configured, presigned URLs working

**When to Reconsider:**

- Phase 3 (Scale): Thousands of users streaming videos (high egress costs)
- International expansion: Global audience needs R2's edge caching
- Cost analysis: Calculate actual egress costs and compare

---

## Migration Considerations (If You Ever Switch)

### Both Are S3-Compatible ✅

**Good news:** Your code doesn't need to change. Just swap credentials.

```typescript
// lib/S3Client.ts - CURRENT (Tigris)
export const S3 = new S3Client({
  region: "auto",
  endpoint: env.AWS_ENDPOINT_URL_S3, // Tigris endpoint
  forcePathStyle: false,
});

// lib/S3Client.ts - IF SWITCHING TO R2
export const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: false,
});
```

**Environment variables change, code stays the same.**

### Migration Script (For Future)

```typescript
// scripts/migrate-tigris-to-r2.ts
async function migrateBucket() {
  // 1. List all files in Tigris
  const tigrisFiles = await listAllTigrisFiles();

  // 2. For each file:
  for (const file of tigrisFiles) {
    // Download from Tigris
    const data = await downloadFromTigris(file.Key);

    // Upload to R2 (same key preserves structure)
    await uploadToR2(file.Key, data);
  }

  // 3. Update database fileKeys (no change needed - same structure)
  // 4. Switch env vars to R2
  // 5. Delete Tigris bucket
}
```

**Status:** Not needed now, document for future

---

## Immediate Action Plan

### ✅ DO THIS NOW

1. **Install Cyberduck or S3 Browser**

   - Solves your "confusion" problem immediately
   - Provides folder view and bulk delete
   - No code changes needed

2. **Document Storage Structure** (this file)

   - Team understands where files live
   - Future developers know the pattern
   - Prevents accidental structure changes

3. **Add Storage Cleanup Script** (see below)
   - Delete old videos when uploading new ones
   - Remove orphaned files from failed uploads

### 📋 ADD TO ROADMAP

**Phase 1 (Critical - This Week):**

- [ ] Video replacement cleanup (delete old video when uploading new one)
- [ ] Orphaned file cleanup script (manual run)

**Phase 2 (MVP Polish):**

- [ ] Admin storage dashboard (view files by organization)
- [ ] Bulk delete functionality (delete entire course folder)
- [ ] Storage usage analytics per organization

**Phase 3 (Scale - After 50+ Agencies):**

- [ ] Evaluate R2 migration (if egress costs high)
- [ ] Automated cleanup cron job
- [ ] Storage limit enforcement per plan tier

---

## Cleanup Implementation (Priority 1)

### Problem: Old Videos Accumulate

When you replace a lesson video, the old file stays in S3 forever.

**Example:**

```
organizations/ghl-mastery/courses/onboarding/
├── asset-1704067200000-old123.mp4  ❌ 500MB orphaned
└── asset-1704070800000-new456.mp4  ✅ 500MB current
```

**Cost:** 1GB storage for 500MB of content.

### Solution: Auto-Delete on Replace

```typescript
// app/agency/[slug]/admin/courses/[courseId]/[chapterId]/[lessonId]/actions.ts

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@/lib/S3Client";

export async function updateLesson(formData: FormData) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });

  // If uploading new video and old video exists
  if (newVideoKey && lesson.videoKey && newVideoKey !== lesson.videoKey) {
    // Delete old video from S3
    await S3.send(
      new DeleteObjectCommand({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
        Key: lesson.videoKey,
      })
    );
  }

  // Update lesson with new video
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { videoKey: newVideoKey },
  });
}
```

**Status:** Not implemented (add to ROADMAP.md)

---

## Summary & Decision

### ✅ RECOMMENDATIONS

1. **KEEP current S3 structure** - It's production-grade and follows AWS best practices
2. **STAY with Tigris** - Performance is 20× better than R2 for uploads
3. **INSTALL Cyberduck** - Solves folder visibility problem today
4. **IMPLEMENT cleanup** - Delete old videos on replacement (prevents storage bloat)
5. **BUILD storage dashboard** - Phase 2 improvement for better management

### 🚫 DO NOT

- Switch to R2 now (performance regression)
- Restructure S3 paths (current structure is optimal)
- Create bucket-per-tenant (overkill for your scale)

### 📊 When to Reconsider R2

**Evaluate R2 migration when:**

- Monthly egress costs exceed $500/month
- Serving 100,000+ video views/month
- Global audience requires edge caching
- Performance testing shows R2 latency improved

**How to evaluate:**

```bash
# Check your monthly Tigris egress costs
# If egress > $500 and growing, R2 saves money
# R2 egress = FREE, Tigris egress = $$$
```

---

## Questions for You

Before implementing cleanup:

1. **Tigris pricing:** What's your current Tigris plan? (Free tier, Pro, Enterprise?)
2. **Current usage:** How many GB stored? How much egress/month?
3. **Testing:** Do you want to test file deletion on a dummy course first?
4. **Cyberduck:** Want me to guide you through setting up Cyberduck?

Let me know and I'll implement the cleanup script!
