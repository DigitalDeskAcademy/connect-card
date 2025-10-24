# Third-Party Integrations

## Core Integrations

### AWS S3 / Tigris Storage

## Package Overview

- **Packages**:
  - `@aws-sdk/client-s3` (v3.839.0) - S3 client for operations
  - `@aws-sdk/s3-request-presigner` (v3.839.0) - Presigned URL generation
- **Purpose**: Secure file uploads for course thumbnails and lesson videos
- **Installation Date**: Course development phase
- **TypeScript Support**: ✅ Built-in declarations

## Why AWS SDK v3?

- **Modern**: Latest AWS SDK with tree-shaking support
- **Secure**: Presigned URLs eliminate direct AWS credentials in frontend
- **Scalable**: Handles any file size, supports Tigris S3-compatible storage
- **Direct Upload**: Files go directly to S3, reducing server load

## Implementation Details

### Key Files:

- `lib/S3Client.ts` - S3 client configuration
- `app/api/s3/upload/route.ts` - Presigned URL generation API
- `hooks/use-construct-url.ts` - S3 URL construction helper
- `components/file-uploader/` - Complete upload UI system

### Configuration:

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

### Upload Flow:

1. **Frontend**: Request presigned URL from `/api/s3/upload`
2. **Backend**: Generate secure presigned URL (6-minute expiry)
3. **Frontend**: Upload directly to S3/Tigris using presigned URL
4. **Database**: Store `fileKey` for future URL construction

## Security Features:

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

## Environment Variables:

```bash
AWS_ACCESS_KEY_ID=tid_xxx           # Tigris access key
AWS_SECRET_ACCESS_KEY=tsec_xxx      # Tigris secret key
AWS_ENDPOINT_URL_S3=https://t3.storage.tigris.dev
AWS_REGION=auto                     # Tigris requires "auto"
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=your-bucket-name

# S3 Upload Allowed Domains (comma-separated production domains)
S3_UPLOAD_ALLOWED_DOMAINS=sidecaronboarding.com,www.sidecaronboarding.com
```

## Usage in LMS:

- **Course Thumbnails**: Uploaded via admin course creation
- **Lesson Videos**: Attached to individual lessons
- **File Storage**: All uploads stored with consistent naming scheme
- **URL Construction**: `constructUrl(fileKey)` generates public URLs

## Production Migration:

- **Current**: Tigris (development/staging)
- **Future**: Migrate to Cloudflare R2 for 25% cost savings + zero egress fees
- **Migration**: File copy + URL construction update only

## Alternatives Considered:

- **Direct Server Upload**: Would overload Next.js serverless functions
- **Cloudflare R2**: Better for production, more setup required
- **Local File Storage**: Not scalable, problematic in serverless environment

## CORS Architecture (Industry Standard)

### How It Works:

**Traditional Approach (Problematic):**

- S3 CORS tries to validate origin
- Each new preview deployment needs manual CORS update
- Wildcards may not work with all S3-compatible providers
- Tight coupling between S3 config and deployment URLs

**Our Approach (Industry Standard):**

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

### Implementation:

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

### Benefits:

- ✅ Works with ANY Vercel preview URL automatically
- ✅ No manual CORS config updates needed
- ✅ Future-proof (works with Netlify, Cloudflare Pages, etc.)
- ✅ More secure (API validates auth + origin + rate limits)
- ✅ Same pattern as Vercel Blob, Supabase Storage, AWS Amplify

### Updating CORS Configuration:

```bash
# Run CORS update script (one-time setup)
node scripts/load-env-and-run-cors.mjs
```

This sets S3 CORS to `AllowedOrigins: ["*"]` and lets the API handle origin validation.

## Troubleshooting:

- **CORS Errors on New Preview**: API should handle automatically - check browser console for specific error
- **403 Origin Not Allowed**: Origin not matching allowed patterns - check `/api/s3/upload` validation
- **Presigned URL Expired**: URLs expire in 6 minutes, generate fresh ones
- **Upload Fails**: Check Arcjet rate limiting and auth status
- **URL Construction Fails**: Verify bucket name in environment variables

---

## S3 API Automation Capabilities

The AWS SDK provides full S3 API access, enabling advanced storage management features beyond basic uploads.

### Current Automation Scripts:

**CORS Configuration** (`scripts/update-tigris-cors.ts`):

- Updates bucket CORS policy to allow uploads from multiple origins
- Run with: `node scripts/load-env-and-run-cors.mjs`
- Enables preview deployments and production uploads

### Planned Automation Features:

#### 1. Video Replacement Cleanup

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

#### 2. Storage Usage Tracking

**Business Need**: Track storage per organization for billing/limits
**Implementation**: Query S3 bucket by organization prefix

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

**Status**: Planned for Phase 4 (see ROADMAP.md)

#### 3. Orphaned File Cleanup

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

#### 4. Bulk File Operations

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

---

## Storage Management Roadmap

### Phase 1 (Critical - Pre-Launch):

- [x] ✅ CORS configuration for preview/production uploads
- [ ] Automatic cleanup on video replacement
- [ ] Manual orphaned file cleanup script

### Phase 2 (MVP Polish):

- [ ] Storage usage dashboard per organization
- [ ] File size validation before upload
- [ ] Storage limit enforcement (per plan tier)

### Phase 3 (Scale):

- [ ] Automated weekly cleanup cron job
- [ ] Storage analytics and reporting
- [ ] File archival for old courses

### Phase 4 (Enterprise):

- [ ] Multi-region storage replication
- [ ] CDN integration for global delivery
- [ ] Video transcoding and optimization

---

## Future Enhancements:

- **Image Optimization**: Automatic resizing/compression before upload
- **Video Processing**: Transcoding and multiple resolution support
- **CDN Integration**: CloudFlare CDN for faster global delivery
- **File Type Validation**: Restrict uploads to specific formats

---

### Stripe Payment Processing

- Webhook endpoint: /api/webhook/stripe
- Products created per course (needs refactoring for subscription model)
- Test mode in development, production keys needed for deployment

---

### Better Auth

- GitHub OAuth + Email OTP authentication
- Multi-tenant with organization plugin
- Role-based access control

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

### Environment Variables

```bash
GHL_CLIENT_ID=your-client-id                    # From marketplace app
GHL_CLIENT_SECRET=your-client-secret            # From marketplace app
GHL_REDIRECT_URI=http://localhost:3000/api/ghl/callback
```

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

Location: `/platform/admin/api`

Features:

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
