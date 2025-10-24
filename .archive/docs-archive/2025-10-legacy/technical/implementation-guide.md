# Technical Implementation Guide

**Last Updated**: 2025-10-16
**Status**: CRM Pivot - Updated for AI-Powered Operations Dashboard
**Purpose**: Comprehensive guide for authentication, integrations, security, and multi-tenant architecture

---

## Platform Pivot Notice

**IMPORTANT**: This platform has pivoted from a training-focused LMS to an **AI-powered CRM operations dashboard** for GoHighLevel agencies.

**Current Focus:**

- Real-time GHL contact and calendar integration
- Cal.com for appointment scheduling infrastructure
- AI-powered features using Vercel AI SDK (Phase 2)
- Operations dashboard for medical practices (IV therapy clinics, med spas)
- Multi-location agency support

**Legacy Features (Preserved):**

- LMS functionality remains for future training academy
- Course management system available for onboarding content
- Payment infrastructure supports both subscription and per-course models

**For CRM-Specific Documentation:**

- [Calendar Architecture](./calendar-architecture.md) - Multi-tenant calendar infrastructure
- [AI Architecture](./ai-architecture.md) - Vercel AI SDK integration patterns
- [Integrations](./integrations.md) - GHL, Cal.com, AI SDK integrations
- [Architecture Decisions](./architecture-decisions.md) - ADRs for Cal.com, AI SDK, calendar strategy

---

## Table of Contents

1. [Authentication](#authentication)
2. [Third-Party Integrations](#third-party-integrations)
   - [AWS S3 / Tigris Storage](#aws-s3--tigris-storage)
   - [GoHighLevel OAuth Integration](#gohighlevel-oauth-integration)
   - [Stripe Payment Processing](#stripe-payment-processing)
3. [Security](#security)
   - [Security Overview](#security-overview)
   - [Critical Vulnerabilities](#critical-vulnerabilities)
   - [Security Hardening](#security-hardening)
   - [Testing Checklist](#testing-checklist)
4. [Multi-Tenant Strategy](#multi-tenant-strategy)
   - [Storage Structure](#storage-structure)
   - [Data Isolation](#data-isolation)
   - [Storage Management](#storage-management)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Environment Variables Reference](#environment-variables-reference)

---

## Authentication

### Better Auth Implementation

**Authentication Provider**: Better Auth
**Methods**: GitHub OAuth + Email OTP
**Architecture**: Multi-tenant with organization plugin
**Access Control**: Role-based (platform_admin, agency_owner, agency_admin, user)

### Authentication Flow

1. **Signup**: User creates account → Welcome checkpoint → Organization setup
2. **Login**: Email OTP (creates user via Better Auth if new)
3. **Welcome Checkpoint**: `/setup/welcome` prevents auto-organization creation
4. **Organization Setup**: Explicit user action required with validation

### Key Files

- `/lib/auth.ts` - Auth configuration and session management
- `/app/setup/welcome/` - Welcome checkpoint page
- `/app/data/organization/` - Organization data access
- `/app/data/agency/require-agency-admin.ts` - Authorization checks

### Role Hierarchy

```
platform_admin → Full system access
agency_owner → Agency management + admin access
agency_admin → Content management within agency
user → Course consumption only
```

### Configuration

```typescript
// lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [organization()],
  advanced: {
    disableCSRFCheck: process.env.NODE_ENV === "development",
  },
});
```

### Security Considerations

- **CSRF Protection**: Enabled in production (verify NODE_ENV is set correctly)
- **Session Management**: Better Auth handles session tokens
- **OTP Logging**: Wrapped in development checks only
- **Role Validation**: All admin routes require explicit role checks

---

## Third-Party Integrations

## AWS S3 / Tigris Storage

### Package Overview

- **Packages**:
  - `@aws-sdk/client-s3` (v3.839.0) - S3 client for operations
  - `@aws-sdk/s3-request-presigner` (v3.839.0) - Presigned URL generation
- **Purpose**: Secure file uploads for course thumbnails and lesson videos
- **TypeScript Support**: Built-in declarations

### Why AWS SDK v3?

- **Modern**: Latest AWS SDK with tree-shaking support
- **Secure**: Presigned URLs eliminate direct AWS credentials in frontend
- **Scalable**: Handles any file size, supports Tigris S3-compatible storage
- **Direct Upload**: Files go directly to S3, reducing server load

### Implementation Details

#### Key Files

- `lib/S3Client.ts` - S3 client configuration
- `app/api/s3/upload/route.ts` - Presigned URL generation API
- `hooks/use-construct-url.ts` - S3 URL construction helper
- `components/file-uploader/` - Complete upload UI system

#### Configuration

```typescript
// S3 Client setup for Tigris
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

#### Upload Flow

1. **Frontend**: Request presigned URL from `/api/s3/upload`
2. **Backend**: Generate secure presigned URL (6-minute expiry)
3. **Frontend**: Upload directly to S3/Tigris using presigned URL
4. **Database**: Store `fileKey` for future URL construction

### Security Features

- **Admin-Only Access**: Upload API requires admin authentication
- **Rate Limited**: Arcjet limits to 5 uploads per minute per user
- **Presigned URLs**: Short-lived, specific to exact file and bucket
- **Industry-Standard CORS**: Backend validates origin before issuing upload URLs
  - S3 bucket allows all origins (`*`) - API is the security gatekeeper
  - API validates origin against allowed patterns:
    - Development: `localhost:*`
    - Preview: All Vercel deployments (`*.vercel.app`)
    - Production: `sidecar-platform.vercel.app`
  - Works with ANY preview URL without manual CORS updates
  - Same pattern used by Vercel, Supabase, AWS Amplify

### CORS Architecture (Industry Standard)

#### How It Works

**Traditional Approach (Problematic)**:

- S3 CORS tries to validate origin
- Each new preview deployment needs manual CORS update
- Wildcards may not work with all S3-compatible providers
- Tight coupling between S3 config and deployment URLs

**Our Approach (Industry Standard)**:

1. **S3 Layer (Dumb Storage)**:

   - CORS allows all origins (`*`)
   - No origin validation at S3 level
   - Just accepts uploads via presigned URLs

2. **API Layer (Smart Gatekeeper)**:

   - Validates origin before issuing presigned URLs
   - Checks authentication (admin only)
   - Applies rate limiting (5 requests/min)
   - Returns dynamic `Access-Control-Allow-Origin` header

3. **Security Model**:
   - Presigned URLs are temporary access tokens (6min expiry)
   - API won't issue URLs to unauthorized origins
   - S3 can't be accessed directly without valid presigned URL

#### Implementation

**Origin Validation** (`/api/s3/upload/route.ts`):

```typescript
function validateOrigin(origin: string | null): boolean {
  const allowedPatterns = [
    /^http:\/\/localhost:\d+$/, // localhost:3000, :3001, etc.
    /^https:\/\/.*\.vercel\.app$/, // All Vercel previews
  ];

  // Add production domains from environment variable
  // Supports comma-separated list: "domain.com,www.domain.com"
  const productionDomains =
    process.env.S3_UPLOAD_ALLOWED_DOMAINS?.split(",") || [];
  productionDomains.forEach(domain => {
    const trimmedDomain = domain.trim();
    if (trimmedDomain) {
      const escapedDomain = trimmedDomain.replace(/\./g, "\\.");
      allowedPatterns.push(new RegExp(`^https://${escapedDomain}$`));
    }
  });

  return allowedPatterns.some(pattern => pattern.test(origin));
}
```

**Dynamic CORS Headers**:

```typescript
return NextResponse.json(response, {
  headers: {
    "Access-Control-Allow-Origin": origin, // Matches requesting origin
    "Access-Control-Allow-Credentials": "true",
  },
});
```

#### Benefits

- Works with ANY Vercel preview URL automatically
- No manual CORS config updates needed
- Future-proof (works with Netlify, Cloudflare Pages, etc.)
- More secure (API validates auth + origin + rate limits)
- Same pattern as Vercel Blob, Supabase Storage, AWS Amplify

#### Updating CORS Configuration

```bash
# Run CORS update script (one-time setup)
node scripts/load-env-and-run-cors.mjs
```

This sets S3 CORS to `AllowedOrigins: ["*"]` and lets the API handle origin validation.

### Usage in LMS

- **Course Thumbnails**: Uploaded via admin course creation
- **Lesson Videos**: Attached to individual lessons
- **File Storage**: All uploads stored with consistent naming scheme
- **URL Construction**: `constructUrl(fileKey)` generates public URLs

### Troubleshooting

- **CORS Errors on New Preview**: API should handle automatically - check browser console for specific error
- **403 Origin Not Allowed**: Origin not matching allowed patterns - check `/api/s3/upload` validation
- **Presigned URL Expired**: URLs expire in 6 minutes, generate fresh ones
- **Upload Fails**: Check Arcjet rate limiting and auth status
- **URL Construction Fails**: Verify bucket name in environment variables

### S3 API Automation Capabilities

The AWS SDK provides full S3 API access, enabling advanced storage management features beyond basic uploads.

#### Current Automation Scripts

**CORS Configuration** (`scripts/update-tigris-cors.ts`):

- Updates bucket CORS policy to allow uploads from multiple origins
- Run with: `node scripts/load-env-and-run-cors.mjs`
- Enables preview deployments and production uploads

#### Planned Automation Features

**1. Video Replacement Cleanup**

**Problem**: When replacing lesson videos, old files remain in S3 indefinitely
**Solution**: Automatic deletion of replaced files

```typescript
// Planned: lib/services/storage-service.ts
async function deleteFile(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    Key: fileKey,
  });
  await S3.send(command);
}

// Usage in lesson update action:
if (lesson.videoKey && newVideoKey !== lesson.videoKey) {
  await deleteFile(lesson.videoKey); // Clean up old video
}
```

**Status**: Not implemented (see ROADMAP.md Phase 1)

**2. Storage Usage Tracking**

**Business Need**: Track storage per organization for billing/limits

```typescript
// Planned: lib/services/storage-service.ts
async function getOrganizationStorageUsage(orgSlug: string) {
  const command = new ListObjectsV2Command({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    Prefix: `organizations/${orgSlug}/`,
  });

  const response = await S3.send(command);
  const totalBytes =
    response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;

  return {
    bytes: totalBytes,
    gigabytes: totalBytes / 1024 ** 3,
    fileCount: response.KeyCount || 0,
  };
}
```

**Status**: Planned for Phase 4

**3. Orphaned File Cleanup**

**Problem**: Failed uploads and testing leave abandoned files in S3
**Solution**: Compare S3 files against database records, delete orphans

```typescript
// Planned: scripts/cleanup-orphaned-files.ts
async function findOrphanedFiles() {
  // 1. List all S3 files
  const s3Files = await listAllFiles();

  // 2. Query database for all fileKey references
  const dbFiles = await prisma.course.findMany({
    select: { fileKey: true },
  });
  const dbFileKeys = new Set(dbFiles.map(c => c.fileKey));

  // 3. Find files in S3 not in database
  const orphaned = s3Files.filter(key => !dbFileKeys.has(key));

  // 4. Delete orphaned files (with dry-run option)
  for (const key of orphaned) {
    await deleteFile(key);
  }
}
```

**Status**: Planned for Phase 1 (high priority)

**4. Bulk File Operations**

**Use Cases**:

- Migrate files to new folder structure
- Bulk delete files for organization
- Export organization files for backup

```typescript
// Planned: scripts/migrate-file-structure.ts
async function reorganizeFiles(oldPrefix: string, newPrefix: string) {
  const files = await listFiles(oldPrefix);

  for (const file of files) {
    const newKey = file.Key.replace(oldPrefix, newPrefix);

    // Copy to new location
    await copyFile(file.Key, newKey);

    // Delete old location
    await deleteFile(file.Key);
  }
}
```

**Status**: Future enhancement (Phase 4)

### Automated Cleanup Jobs (Vercel Cron)

**Scheduled Task**: `/app/api/cron/cleanup-storage/route.ts`

- Runs weekly via Vercel Cron
- Finds orphaned files older than 7 days
- Automatically deletes to save storage costs
- Sends notification to admin

**Status**: Not implemented (requires Vercel Pro for cron)

### Storage Management Roadmap

**Phase 1 (Critical - Pre-Launch)**:

- [x] CORS configuration for preview/production uploads
- [ ] Automatic cleanup on video replacement
- [ ] Manual orphaned file cleanup script

**Phase 2 (MVP Polish)**:

- [ ] Storage usage dashboard per organization
- [ ] File size validation before upload
- [ ] Storage limit enforcement (per plan tier)

**Phase 3 (Scale)**:

- [ ] Automated weekly cleanup cron job
- [ ] Storage analytics and reporting
- [ ] File archival for old courses

**Phase 4 (Enterprise)**:

- [ ] Multi-region storage replication
- [ ] CDN integration for global delivery
- [ ] Video transcoding and optimization

### Production Migration

- **Current**: Tigris (development/staging)
- **Future**: Migrate to Cloudflare R2 for 25% cost savings + zero egress fees
- **Migration**: File copy + URL construction update only

### Future Enhancements

- **Image Optimization**: Automatic resizing/compression before upload
- **Video Processing**: Transcoding and multiple resolution support
- **CDN Integration**: CloudFlare CDN for faster global delivery
- **File Type Validation**: Restrict uploads to specific formats

---

## GoHighLevel OAuth Integration

### Overview

Full OAuth 2.0 integration for GoHighLevel API access. Enables automated lesson completion tracking and integration testing per organization.

### Implementation

**Authentication Flow**: OAuth 2.0 Authorization Code Grant
**Token Storage**: Database per organization (GHLToken model)
**Token Refresh**: Automatic via utility function
**Access Control**: Platform admin only

### Key Files

- `prisma/schema.prisma` - GHLToken model for per-organization token storage
- `lib/ghl-token.ts` - Token retrieval and automatic refresh logic
- `app/api/ghl/authorize/route.ts` - OAuth authorization redirect
- `app/api/ghl/callback/route.ts` - OAuth callback and token exchange
- `app/platform/admin/api/page.tsx` - API testing dashboard
- `app/platform/admin/api/actions.ts` - GHL API test server actions

### OAuth Flow

1. **Authorization**: User clicks "Connect GHL" → redirects to GHL OAuth
2. **Callback**: GHL redirects back with authorization code
3. **Token Exchange**: Exchange code for access token + refresh token
4. **Storage**: Store tokens in database linked to organization
5. **API Calls**: Retrieve token → auto-refresh if expired → make API call

### Database Schema

```prisma
model GHLToken {
  id             String       @id @default(uuid())
  organizationId String       @unique
  accessToken    String       # Expires ~24 hours
  refreshToken   String       # Expires 1 year
  expiresAt      DateTime
  locationId     String?
  scopes         String[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

### Token Refresh Logic

```typescript
// Automatic refresh with 5-minute buffer
const isExpired =
  new Date(tokenRecord.expiresAt).getTime() - Date.now() < 5 * 60 * 1000;

if (isExpired) {
  // Exchange refresh token for new access token
  // Update database with new tokens
}
```

### API Scopes

Currently requested scopes:

- `locations.readonly` - Read location details
- `contacts.readonly` - Read contact information
- `contacts.write` - Update contact information
- `opportunities.readonly` - Read opportunities
- `opportunities.write` - Update opportunities

### Security Features

- **Organization Isolation**: Tokens stored per organization, can't access other orgs
- **Rate Limiting**: 5 API tests per minute via Arcjet
- **Admin Only**: requireAdmin() check on all routes
- **Automatic Refresh**: Tokens refreshed transparently before expiration
- **Secure Storage**: Tokens stored in database, never exposed to client

### Usage Example

```typescript
// Server action automatically handles token retrieval and refresh
export async function testGHLConnection(): Promise<ApiResponse> {
  const session = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  // Get valid token (auto-refreshes if needed)
  const accessToken = await getGHLAccessToken(user.organizationId);

  const response = await fetch(
    `https://services.leadconnectorhq.com/locations/${locationId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: "2021-07-28",
      },
    }
  );
}
```

### API Testing Dashboard

**Location**: `/platform/admin/api`

**Features**:

- **Connect GHL Button**: Initiates OAuth flow if not connected
- **Connection Status**: Shows connected/disconnected state and location ID
- **Test Cards**: 6 API test buttons with result display
- **Run All Tests**: Execute all tests sequentially
- **Clear Results**: Reset all test results

### Future Enhancements

- **Webhook Handler**: `/api/webhook/ghl` for lesson completion events
- **Automated Tracking**: Trigger GHL contact updates on lesson completion
- **Multi-Location Support**: Support agencies with multiple GHL locations
- **Scope Management**: Allow users to select required scopes during OAuth

### Troubleshooting

- **"GHL not connected"**: Click "Connect GHL" to authorize
- **Token expired**: Automatic refresh should handle this, check refresh token validity
- **No location ID**: May need to store location ID during OAuth callback
- **API calls failing**: Verify scopes are correctly requested during authorization

---

## Stripe Payment Processing

### Implementation

- **Webhook endpoint**: `/api/webhook/stripe`
- **Model**: Products created per course (needs refactoring for subscription model)
- **Environment**: Test mode in development, production keys needed for deployment

### Database Schema

```prisma
model Organization {
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  subscriptionStatus    String?
  trialEndsAt          DateTime?
}

model Course {
  stripePriceId        String?    # Nullable - only for paid courses
  isFree              Boolean    @default(false)
}
```

### Payment Flow

1. Organization signs up → 14-day trial begins
2. Trial ends → subscription required
3. Stripe webhook updates subscription status
4. Platform checks subscription before access

### Security

- Webhook signature verification required
- Test vs production keys separated
- Subscription status validated on each request

---

## Security

## Security Overview

**Overall Security Score**: 7.5/10
**Status**: Approaching Production Ready - Some issues remain
**Last Security Audit**: January 2025

### What's Working Well

- **Strong Points**:
  - Excellent multi-tenant architecture with `organizationId` filtering
  - Prisma ORM preventing SQL injection
  - Good Zod schema validation
  - Arcjet rate limiting properly implemented
  - Welcome checkpoint prevents organization spam
  - Proper role standardization (lowercase)

### Authentication Flow - FIXED

**Status**: RESOLVED

The authentication flow has been properly fixed with:

- Welcome checkpoint page (`/setup/welcome`) prevents auto-organization creation
- Proper separation of login vs signup flows
- Organization setup requires explicit user action
- Member records created for Better Auth compatibility
- Trial period standardized to 14 days

### Stripe Model - FIXED

**Status**: RESOLVED

The Stripe integration has been properly aligned with the B2B subscription model:

- `stripePriceId` made nullable in schema
- Conditional Stripe product creation (only for paid courses)
- `isFree` flag added to Course model
- Organization subscription fields added
- Proper subscription status tracking

---

## Critical Vulnerabilities

### 1. Console Logging - PARTIALLY MITIGATED

**Severity**: MEDIUM
**Status**: PARTIALLY FIXED

**Current State**:

- `/lib/auth.ts:73-77` - OTP logging is wrapped in development check
- `/lib/tenant-utils.ts:32,51` - Still logging warnings without env check
- `/middleware.ts:62` - Still logging invalid slug attempts
- `/app/data/organization/get-organization-by-slug.ts:39` - Error details logged
- `/app/data/agency/require-agency-admin.ts:59,80` - User IDs logged

**Remaining Risk**: While OTP codes are protected, other console statements could still leak information in production logs.

**Fix Required**:

```typescript
// Add environment checks to all console statements
if (process.env.NODE_ENV === "development") {
  console.warn(`Invalid slug format detected: ${slug}`);
}

// Or better, create a logger utility that handles this automatically
```

### 2. Error Message Information Disclosure

**Severity**: HIGH

**Issue**: Raw error objects and stack traces exposed to clients

**Critical Locations**:

- `/app/(public)/courses/[slug]/actions.ts:396` - Full error object in response
- Multiple server actions returning error details
- API routes exposing internal errors

**Example**:

```typescript
// WRONG - Exposes system details
return {
  status: "error",
  message: `Failed to enroll in course: ${error}`, // Leaks stack trace!
};

// CORRECT - Generic message
return {
  status: "error",
  message: "Failed to process request",
};
```

### 3. Missing Multi-Tenant Data Isolation

**Severity**: HIGH

**Issue**: No organization boundary validation in data access layers

**Problems Identified**:

- Server actions don't validate organization membership
- Prisma queries lack organization scoping
- Middleware doesn't enforce tenant boundaries
- Cross-tenant data access possible with manipulated IDs

**Example Vulnerability**:

```typescript
// VULNERABLE - No org validation
const course = await prisma.course.findUnique({
  where: { id: courseId }, // Could be from another org!
});

// SECURE - With org validation
const course = await prisma.course.findFirst({
  where: {
    id: courseId,
    organizationId: user.organizationId, // Enforces boundary
  },
});
```

### 4. CSRF Protection Configuration

**Severity**: MEDIUM

**Issue**: CSRF protection disabled based on NODE_ENV alone

**Location**: `/lib/auth.ts:65`

```typescript
advanced: {
  disableCSRFCheck: process.env.NODE_ENV === "development",
},
```

**Risk**: If NODE_ENV not properly set in production, CSRF protection could be disabled

### 5. Missing `requireAdmin()` Function

**Severity**: CRITICAL

**Locations**: `/app/api/s3/upload/route.ts`, `/app/api/s3/delete/route.ts`

**Issue**: Using custom authentication instead of consistent pattern

**Risk**: Authorization bypass potential

**Fix**: Create proper `requireAdmin()` function matching `requireAgencyAdmin()` pattern

### 6. Rate Limiting Bypass Vulnerability

**Location**: `/app/api/s3/upload/route.ts:182`

**Issue**: Optional chaining on fingerprint could result in undefined, allowing rate limiting bypass

### 7. Missing Request Size Limits

**Issues**:

- No limits on file upload sizes
- No limits on webhook payload sizes
- DoS attack vulnerability

### 8. Stripe Webhook Security Gap

**Location**: `/app/api/webhook/stripe/route.ts:99`

**Issue**: Generic catch doesn't differentiate signature failures, potential webhook replay attacks

### 9. Session Security Headers Missing

**Missing Headers**:

- No HSTS headers
- No CSP headers
- No X-Frame-Options
- No X-Content-Type-Options

### 10. File Upload Security

**Issues**:

- Only client-side MIME type validation
- No server-side content scanning
- Potential malicious file uploads

---

## Security Hardening

### Phase 3: Security Hardening (2-3 hours)

#### 3.1 Remove Unprotected Console Logging (30 minutes)

```typescript
// Create /lib/logger.ts
export const logger = {
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(message, data);
    }
    // In production, send to monitoring service
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.error(message, error);
    }
    // In production, send to error tracking
  },
};

// Update all console.* statements to use logger
```

#### 3.2 Fix Error Message Disclosure (30 minutes)

```typescript
// Update all server actions
catch (error) {
  logger.error('Action failed', error); // Log internally
  return {
    status: "error",
    message: "Request failed" // Generic message
  };
}
```

#### 3.3 Multi-Tenant Data Isolation (1 hour)

```typescript
// Add to all data queries
const course = await prisma.course.findFirst({
  where: {
    id: courseId,
    organizationId: user.organizationId, // Enforce boundary
  },
});
```

#### 3.4 Security Headers (30 minutes)

```typescript
// next.config.ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  },
];
```

---

## Testing Checklist

### Authentication Tests

- [ ] Login with wrong email shows "No account found"
- [ ] Signup creates exactly one organization
- [ ] No console.log statements in production build
- [ ] Generic error messages only
- [ ] OTP codes not visible in logs

### Multi-Tenant Tests

- [ ] Users cannot access other organizations
- [ ] Platform admins cannot access agency routes
- [ ] Agency users cannot access platform routes
- [ ] Data queries respect org boundaries

### Security Tests

- [ ] Rate limiting blocks excessive requests
- [ ] CSRF protection enabled
- [ ] Security headers present
- [ ] File uploads validated server-side
- [ ] Webhook signatures verified

### Performance Tests

- [ ] Page loads under 2 seconds
- [ ] API responses under 500ms
- [ ] Database queries optimized
- [ ] No N+1 query problems

---

## Multi-Tenant Strategy

## Storage Structure

### Current State Analysis

Your current implementation at `app/api/s3/upload/route.ts` is **already following industry best practices**:

```typescript
// Agency course: organizations/{org-slug}/courses/{course-slug}/{type}-{timestamp}-{secureId}.{ext}
uniqueKey = `organizations/${organizationSlug}/courses/${courseSlug}/${fileType}-${timestamp}-${secureId}.${fileExtension}`;

// Platform course: platform/courses/{course-slug}/{type}-{timestamp}-{secureId}.{ext}
uniqueKey = `platform/courses/${courseSlug}/${fileType}-${timestamp}-${secureId}.${fileExtension}`;
```

**This is the AWS-recommended pattern for multi-tenant SaaS applications.**

### Current Structure in Bucket

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

### Industry Standards: How Big Companies Do It

#### Pattern 1: Shared Bucket with Prefix-Based Isolation (What You're Using)

**Used by**: Dropbox Business, Slack, Notion, most B2B SaaS platforms

**Structure**:

```
bucket-name/
├── tenant-1/resources/
├── tenant-2/resources/
└── tenant-3/resources/
```

**Advantages**:

- Scales to thousands of tenants
- No bucket quota concerns (10,000 bucket limit per AWS account)
- Centralized CORS, lifecycle policies, and monitoring
- **Can achieve 5,500 GET requests/sec PER PREFIX** (unlimited prefixes)
- Easy to implement per-tenant storage quotas via prefix analytics

**Your Implementation**: Perfect for your use case

#### Pattern 2: Bucket-Per-Tenant (NOT Recommended for You)

**Used by**: Enterprise platforms with <100 high-value clients (e.g., Salesforce Shield encryption)

**Advantages**:

- Strongest data isolation
- Tenant-specific encryption keys
- Easy to delete entire tenant

**Disadvantages**:

- AWS limit: 10,000 buckets per account (can increase to 1M, but complex)
- Management overhead scales linearly with tenants
- CORS config must be set per bucket
- Not practical for 100+ agencies

### Why Your Structure Works Well

1. **Clear Tenant Isolation**:

   ```
   organizations/{org-slug}/courses/{course-slug}/
   platform/courses/{course-slug}/
   ```

   - Easy to identify which files belong to which tenant
   - Simple prefix-based IAM policies for security
   - Clear billing/usage tracking per organization

2. **Human-Readable Paths**:

   - `organizations/ghl-mastery/courses/onboarding-basics/thumbnail-1704067200000-a3b4c5d6.jpg`
   - Debugging is easy (you can see which org/course immediately)
   - Support team can locate files without guessing

3. **Collision Prevention**:

   - `{type}-{timestamp}-{secureId}.{ext}` ensures uniqueness
   - 48 bits of entropy from secureId prevents conflicts
   - Timestamp allows chronological sorting

4. **Scalability**:
   - Each organization gets its own prefix
   - S3 can handle 5,500 GET/sec PER organization prefix
   - No performance degradation as you grow

### Cloudflare R2 vs Tigris Decision

**Recommendation**: STAY WITH TIGRIS

#### Performance Comparison

| Metric                | Tigris         | R2           | AWS S3    |
| --------------------- | -------------- | ------------ | --------- |
| **GET Latency (p90)** | 8ms ⚡         | 199ms 🐌     | 42ms      |
| **PUT Latency (p90)** | 36ms ⚡        | 340ms 🐌     | 38ms      |
| **Read Throughput**   | 3,300 ops/s ⚡ | 170 ops/s 🐌 | 892 ops/s |
| **Write Throughput**  | 828 ops/s ⚡   | 43 ops/s 🐌  | 224 ops/s |

**Tigris is 20× faster than R2 for your video upload workload.**

#### Cost Comparison

**Tigris**:

- Storage: Check your plan
- Egress: Pay per GB
- Operations: Pay per request

**R2**:

- Storage: $0.015/GB/month
- **Egress: FREE**
- Operations: $0.36 per million reads, $4.50 per million writes

#### When to Choose R2

**Choose R2 if**:

- High egress is expected (serving videos to thousands of users)
- Cost predictability matters more than performance
- Users are globally distributed (R2 has global caching)
- You want zero vendor lock-in

**Avoid R2 if**:

- Performance is critical (admin uploading videos needs fast feedback)
- Upload-heavy workload (20× slower writes)
- Low latency required for preview/testing

#### Your Situation: STAY WITH TIGRIS

**Reasons**:

1. **Your workload is upload-heavy**: Admins uploading videos, not end-users streaming
2. **Performance matters**: 36ms vs 340ms upload latency = better UX
3. **Low egress initially**: Few users watching videos in MVP phase
4. **Already working**: CORS configured, presigned URLs working

**When to Reconsider**:

- Phase 3 (Scale): Thousands of users streaming videos (high egress costs)
- International expansion: Global audience needs R2's edge caching
- Cost analysis: Calculate actual egress costs and compare

---

## Data Isolation

### Multi-Tenant Security Principles

1. **Organization Boundaries**: Every query must respect organization boundaries
2. **Role-Based Access**: Enforce proper role checks on all routes
3. **Data Validation**: Validate organization membership before data access
4. **URL Parameters**: Never trust user-provided IDs without validation

### Secure Query Pattern

```typescript
// ALWAYS include organizationId in queries
const course = await prisma.course.findFirst({
  where: {
    id: courseId,
    organizationId: user.organizationId, // Critical: Enforce boundary
  },
});
```

### Authorization Helpers

```typescript
// lib/auth-helpers.ts
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "platform_admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAgencyAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  // Verify user is admin within their organization
  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId: user.organizationId,
      role: { in: ["agency_owner", "agency_admin"] },
    },
  });

  if (!member) throw new Error("Unauthorized");
  return session;
}
```

---

## Storage Management

### Immediate Solutions for File Management

#### Option 1: Use AWS CLI with Prefix Filtering

```bash
# View all files for a specific organization
aws s3 ls s3://sidecar-uploads/organizations/ghl-mastery/ --recursive

# View all platform courses
aws s3 ls s3://sidecar-uploads/platform/courses/ --recursive

# View specific course
aws s3 ls s3://sidecar-uploads/organizations/ghl-mastery/courses/onboarding-basics/
```

#### Option 2: Build Admin Dashboard for Storage

**Create**: `/app/platform/admin/storage/page.tsx`

**Features**:

- List organizations and their storage usage
- Drill down into specific organization → courses → files
- Click to delete entire course folder
- Visual hierarchy (like Finder/Explorer)

**Implementation**:

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

**Status**: Not implemented (add to ROADMAP.md Phase 2)

#### Option 3: Use S3 Browser Tools

**Free Tools**:

- **Cyberduck** (Mac/Windows) - Visual S3 browser with folder view
- **S3 Browser** (Windows) - Dedicated S3 explorer
- **CloudBerry Explorer** (Mac/Windows) - Multi-cloud file manager

**Setup**:

1. Install Cyberduck
2. Add connection with Tigris credentials
3. Browse bucket with folder hierarchy
4. Right-click folder → Delete (deletes all files in prefix)

### Cleanup Implementation (Priority 1)

#### Problem: Old Videos Accumulate

When you replace a lesson video, the old file stays in S3 forever.

**Example**:

```
organizations/ghl-mastery/courses/onboarding/
├── asset-1704067200000-old123.mp4  ❌ 500MB orphaned
└── asset-1704070800000-new456.mp4  ✅ 500MB current
```

**Cost**: 1GB storage for 500MB of content.

#### Solution: Auto-Delete on Replace

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

**Status**: Not implemented (add to ROADMAP.md)

---

## Implementation Roadmap

### Completed Phases

#### Phase 0-2: Authentication & Data Model - COMPLETED

- Welcome checkpoint implemented at `/setup/welcome`
- Organization creation requires explicit user action
- Proper signup page with trial messaging
- Login page with email OTP
- Organization setup with validation
- Member records created for Better Auth compatibility
- `stripePriceId` made nullable
- Subscription fields added to Organization
- `isFree` flag on courses
- Proper B2B subscription model implemented

### Remaining Phases

### Phase 3: Security Hardening (2-3 hours)

**Priority 1 - Before Production**

1. Remove unprotected console logging (30 minutes)
2. Fix error message disclosure (30 minutes)
3. Add multi-tenant data isolation (1 hour)
4. Configure security headers (30 minutes)

### Phase 4: Storage Management (2-3 hours)

**Priority 2 - MVP Polish**

1. Implement video replacement cleanup (1 hour)
2. Create orphaned file cleanup script (1 hour)
3. Build admin storage dashboard (2-3 hours)

### Phase 5: Production Deployment (4 hours)

**When: After Phase 3 & 4 Complete**

1. Environment Setup

   - Configure all environment variables
   - Set up production database
   - Configure Stripe webhooks
   - SSL and custom domain

2. Monitoring

   - Error tracking (Sentry)
   - Uptime monitoring
   - Analytics setup
   - Security alerts

3. Launch Checklist
   - [ ] All critical issues fixed
   - [ ] Security audit passed
   - [ ] Performance tested
   - [ ] Backups configured
   - [ ] Rollback plan ready

---

## Environment Variables Reference

### Authentication

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
BETTER_AUTH_SECRET=your-random-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

### Database

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

### AWS S3 / Tigris Storage

```bash
AWS_ACCESS_KEY_ID=tid_xxx           # Tigris access key
AWS_SECRET_ACCESS_KEY=tsec_xxx      # Tigris secret key
AWS_ENDPOINT_URL_S3=https://t3.storage.tigris.dev
AWS_REGION=auto                     # Tigris requires "auto"
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=your-bucket-name

# S3 Upload Allowed Domains (comma-separated production domains)
S3_UPLOAD_ALLOWED_DOMAINS=sidecaronboarding.com,www.sidecaronboarding.com
```

### Stripe

```bash
STRIPE_SECRET_KEY=sk_test_xxx       # Test key for development
STRIPE_WEBHOOK_SECRET=whsec_xxx     # Webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### GoHighLevel

```bash
GHL_CLIENT_ID=your-client-id                    # From marketplace app
GHL_CLIENT_SECRET=your-client-secret            # From marketplace app
GHL_REDIRECT_URI=http://localhost:3000/api/ghl/callback
```

### Rate Limiting (Arcjet)

```bash
ARCJET_KEY=your-arcjet-key
```

### Application

```bash
NODE_ENV=development                # development | production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Summary & Recommendations

### DO THIS NOW

1. **Install Cyberduck or S3 Browser** - Solves file management immediately
2. **Document Storage Structure** - Team understands where files live
3. **Add Storage Cleanup Script** - Delete old videos when uploading new ones

### ADD TO ROADMAP

**Phase 1 (Critical - This Week)**:

- [ ] Video replacement cleanup (delete old video when uploading new one)
- [ ] Orphaned file cleanup script (manual run)
- [ ] Remove unprotected console logging
- [ ] Fix error message disclosure
- [ ] Add multi-tenant data validation

**Phase 2 (MVP Polish)**:

- [ ] Admin storage dashboard (view files by organization)
- [ ] Bulk delete functionality (delete entire course folder)
- [ ] Storage usage analytics per organization
- [ ] Security headers configuration

**Phase 3 (Scale - After 50+ Agencies)**:

- [ ] Evaluate R2 migration (if egress costs high)
- [ ] Automated cleanup cron job
- [ ] Storage limit enforcement per plan tier

### DO NOT

- Switch to R2 now (performance regression)
- Restructure S3 paths (current structure is optimal)
- Create bucket-per-tenant (overkill for your scale)
- Deploy to production until all critical security issues resolved

### When to Reconsider R2

**Evaluate R2 migration when**:

- Monthly egress costs exceed $500/month
- Serving 100,000+ video views/month
- Global audience requires edge caching
- Performance testing shows R2 latency improved

---

**Last Updated**: 2025-10-10
**Maintainer**: Development Team
**Review Schedule**: Weekly until production, then quarterly
