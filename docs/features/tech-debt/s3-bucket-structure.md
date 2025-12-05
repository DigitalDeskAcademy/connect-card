# S3 Bucket Structure

**Status:** Documentation Complete | Implementation Pending
**Bucket:** `connect-card-testing` (dev) | TBD (production)
**Last Updated:** 2025-11-30

---

## Overview

This document defines the S3 bucket organization for the Church Connect Hub platform. Proper structure ensures:

- **Multi-tenant isolation** - Each organization's files are separated
- **Easy cleanup/archival** - Files organized by date
- **Security** - Path-based access control validation
- **Cost management** - Lifecycle policies by folder

---

## Directory Structure

```
{bucket}/
├── organizations/
│   └── {org-slug}/
│       ├── connect-cards/
│       │   └── {YYYY-MM}/
│       │       ├── front-{timestamp}-{secureId}.jpg
│       │       └── back-{timestamp}-{secureId}.jpg
│       ├── assets/
│       │   └── {fileType}-{timestamp}-{secureId}.{ext}
│       ├── courses/
│       │   └── {course-slug}/
│       │       ├── thumbnail-{timestamp}-{secureId}.{ext}
│       │       ├── banner-{timestamp}-{secureId}.{ext}
│       │       └── asset-{timestamp}-{secureId}.{ext}
│       └── volunteer-documents/
│           └── {volunteer-id}/
│               └── {document-type}-{timestamp}.{ext}
├── platform/
│   └── courses/
│       └── {course-slug}/
│           └── ... (same as org courses)
└── uploads/
    └── general/
        └── ... (legacy - to be migrated)
```

---

## Path Patterns

### Connect Cards

```
organizations/{org-slug}/connect-cards/{YYYY-MM}/{side}-{timestamp}-{secureId}.jpg
```

| Component     | Description                 | Example           |
| ------------- | --------------------------- | ----------------- |
| `{org-slug}`  | Organization's URL slug     | `bainbridge`      |
| `{YYYY-MM}`   | Year and month for archival | `2025-11`         |
| `{side}`      | Card side                   | `front` or `back` |
| `{timestamp}` | Unix timestamp (ms)         | `1732956789123`   |
| `{secureId}`  | 8-char random ID            | `a1b2c3d4`        |

**Example:** `organizations/bainbridge/connect-cards/2025-11/front-1732956789123-a1b2c3d4.jpg`

### Organization Assets

```
organizations/{org-slug}/assets/{fileType}-{timestamp}-{secureId}.{ext}
```

### Course Content

```
organizations/{org-slug}/courses/{course-slug}/{fileType}-{timestamp}-{secureId}.{ext}
platform/courses/{course-slug}/{fileType}-{timestamp}-{secureId}.{ext}
```

### Volunteer Documents

```
organizations/{org-slug}/volunteer-documents/{volunteer-id}/{doc-type}-{timestamp}.{ext}
```

---

## Access Control

### API Validation

The `/api/s3/view` endpoint validates access:

1. User must be authenticated
2. User's organization slug must match the path prefix
3. Fallback: Check database for legacy paths

```typescript
// Path validation in /api/s3/view/route.ts
const orgPrefix = `organizations/${user.organization.slug}/`;
const isOrgFile = imageKey.startsWith(orgPrefix);
```

### Legacy Path Support

Files uploaded before the structure update may be in:

- `uploads/general/{fileType}-{timestamp}-{secureId}.{ext}`

These are validated by checking the database for matching `imageKey`.

---

## Lifecycle Policies (Recommended)

| Path Pattern              | Retention | Notes                      |
| ------------------------- | --------- | -------------------------- |
| `*/connect-cards/*`       | 2 years   | Legal/compliance retention |
| `*/volunteer-documents/*` | 7 years   | Background check records   |
| `uploads/general/*`       | 90 days   | Migrate then delete        |

---

## Implementation Status

### Completed

- [x] S3 upload API supports `connect-card` file type
- [x] Scan wizard uses organization-scoped paths
- [x] Bulk upload uses organization-scoped paths
- [x] View API validates organization access
- [x] Documentation created

### Pending (Tech Debt Worktree)

- [ ] **Dev Dashboard: S3 Structure Setup** - Admin UI to initialize bucket structure
- [ ] **Migration Script** - Move legacy `uploads/general/` files to org paths
- [ ] **Lifecycle Policies** - Configure via Tigris/S3 console
- [ ] **Bucket Initialization API** - Create org folder on first upload

---

## Related Files

- `/app/api/s3/upload/route.ts` - Presigned URL generation with path logic
- `/app/api/s3/view/route.ts` - Signed URL generation with access validation
- `/app/api/s3/delete/route.ts` - File deletion
- `/lib/S3Client.ts` - S3 client configuration
- `/lib/data/connect-card-review.ts` - Signed URL generation for review queue

---

## Environment Variables

```bash
# S3/Tigris Configuration
AWS_ACCESS_KEY_ID=           # Tigris access key
AWS_SECRET_ACCESS_KEY=       # Tigris secret key
AWS_ENDPOINT_URL_S3=         # Tigris endpoint (e.g., https://fly.storage.tigris.dev)
AWS_REGION=                  # Region (e.g., auto)
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=  # Bucket name (e.g., connect-card-testing)
```

See `/docs/features/tech-debt/environment-configuration.md` for full env setup.
