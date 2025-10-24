# S3 Upload Testing & Implementation Documentation

## 📁 S3 File Organization Implementation

### Overview

The S3 file organization system has been redesigned to use human-readable, multi-tenant paths instead of UUID-based naming. This improves file management, cost tracking, and debugging capabilities.

### Path Structure

#### New Path Format

```
# Platform courses (no organization)
platform/courses/{course-slug}/{file-type}-{timestamp}-{secureId}.{ext}

# Agency/Organization courses
organizations/{org-slug}/courses/{course-slug}/{file-type}-{timestamp}-{secureId}.{ext}

# General uploads (fallback)
uploads/general/{file-type}-{timestamp}-{secureId}.{ext}
```

#### Examples

```
platform/courses/react-fundamentals/thumbnail-1735678901234-x7K9mN2q.jpg
organizations/digitaldesk/courses/ghl-onboarding/banner-1735678901234-aB3dE8fG.mp4
organizations/acme-corp/courses/crm-basics/asset-1735678901234-h9J2kL4m.pdf
```

### Security Features

- **Cryptographically Secure IDs**: Uses Node.js `crypto.randomBytes()` for unpredictable file names
- **8-character Secure ID**: Provides ~48 bits of entropy (281 trillion possibilities)
- **URL-safe Encoding**: Base64URL encoding ensures no special characters
- **Timestamp + SecureID**: Prevents collisions even with simultaneous uploads

### Implementation Details

#### Modified Files

1. `/app/api/s3/upload/route.ts` - S3 upload route with new path generation
2. `/components/file-uploader/Uploader.tsx` - Updated to pass organization and course data
3. Platform course forms - Updated to pass course names
4. Agency course forms - Updated to pass organization slugs

#### Key Components

**Upload Route Changes:**

- Added `organizationSlug` and `courseName` to request schema
- Generates URL-safe slugs from course names
- Uses cryptographically secure random IDs
- Maintains backwards compatibility

**Uploader Component Changes:**

- New optional props: `organizationSlug` and `courseName`
- Passes additional context to upload API
- Fully backwards compatible

---

## 🧪 Testing Tools

### 1. Browser-Based Interactive Test Page

**Location**: `/app/test-upload/page.tsx`
**Access**: `http://localhost:3000/test-upload`

#### Features

- Visual interface with real-time results
- Automated test suite with 10+ scenarios
- Manual testing with custom inputs
- Concurrent upload testing (5 simultaneous uploads)
- Shows S3 paths, timing, and success rates
- No setup or dependencies required

#### How to Use

1. Navigate to `http://localhost:3000/test-upload`
2. Choose between:
   - **Automated Tests**: Click "Run All Tests" to execute comprehensive test suite
   - **Manual Test**: Enter custom course name and organization slug
3. View results in real-time with success/failure indicators
4. Check generated S3 paths for correctness

#### Test Scenarios

- Platform course uploads
- Agency course uploads with organization context
- Special characters handling (e.g., "GHL: Advanced! @2024")
- Numeric course names
- Long course names (truncation test)
- Concurrent upload collision testing

---

### 2. Node.js Script with Real Images

**Location**: `/scripts/test-s3-simple.js`
**Run**: `node scripts/test-s3-simple.js`

#### Features

- Downloads real test images from free services:
  - `picsum.photos` - Random images
  - `via.placeholder.com` - Placeholder images
  - `dummyimage.com` - Dummy image generator
- Tests actual S3 upload flow end-to-end
- No npm dependencies required
- Stress testing capability

#### Usage

```bash
# Basic test run
node scripts/test-s3-simple.js

# Run with stress test (5 concurrent uploads)
node scripts/test-s3-simple.js --stress
```

#### Flags

- `--stress` - Runs stress test with 5 concurrent uploads to test collision prevention

#### Test Flow

1. Downloads test image from external service
2. Calls upload API to get presigned URL
3. Verifies path structure
4. Uploads file to S3 using presigned URL
5. Reports success/failure with timing

---

### 3. Advanced Test Script with Canvas

**Location**: `/scripts/test-s3-upload.js`
**Run**: `node scripts/test-s3-upload.js`

#### Prerequisites

```bash
npm install canvas
```

#### Features

- Generates test images programmatically
- Load testing with configurable upload count
- Concurrent upload testing
- Performance metrics and statistics
- Detailed progress reporting

#### Usage

```bash
# Basic test run
node scripts/test-s3-upload.js

# Run with load test (20 sequential uploads)
node scripts/test-s3-upload.js --load-test
```

#### Flags

- `--load-test` - Runs load test with 20 sequential uploads and performance metrics

#### Test Scenarios

1. Platform course upload
2. Agency course upload
3. Special characters in course names
4. Concurrent uploads (5 simultaneous)
5. Load testing (rapid sequential uploads)

#### Metrics Provided

- Total upload count
- Success/failure rates
- Average time per upload
- Unique key verification
- Path pattern validation

---

## 📊 Expected Results

### Success Criteria

#### Path Validation

✅ **Correct patterns:**

- `platform/courses/course-slug/thumbnail-{timestamp}-{id}.jpg`
- `organizations/org-slug/courses/course-slug/banner-{timestamp}-{id}.mp4`

❌ **Old patterns (should not appear):**

- `assets/uuid-filename.jpg`
- `courses/uuid/filename.jpg`

#### Performance Targets

- Response time: < 1 second per upload
- Concurrent uploads: No collisions
- Rate limiting: Max 5 requests/minute per user
- Success rate: > 95% under normal conditions

### Debugging Tips

#### Check Browser DevTools

1. Network tab → Filter by `/api/s3/upload`
2. Verify request payload includes `courseName` and `organizationSlug`
3. Check response for correct `key` format

#### Server Logs

Watch dev server console for:

- Rate limiting messages
- Secure ID generation
- Any 500 errors or exceptions

#### S3 Console Verification

1. Log into S3/Tigris console
2. Navigate to bucket
3. Verify folder structure matches expected patterns
4. Check file metadata and timestamps

---

## 🔒 Security Considerations

### Implemented Security Measures

1. **Admin-only access**: `requireAdmin()` guard on upload route
2. **Rate limiting**: 5 requests per minute per user
3. **Cryptographic randomness**: Unpredictable file names
4. **Input validation**: Zod schema validation
5. **Signed URLs**: Short-lived (6 minutes) presigned URLs

### Best Practices

- Never expose S3 credentials in client code
- Always validate file types and sizes
- Use signed URLs for both upload and download
- Monitor for unusual upload patterns
- Regular audit of S3 bucket permissions

---

## 🚀 Quick Start Testing Guide

### Fastest Test Method

1. Ensure dev server is running: `pnpm dev`
2. Open browser to `http://localhost:3000/test-upload`
3. Click "Run All Tests"
4. Review results for any failures
5. Check S3 bucket for uploaded files

### Manual Verification

1. Go to `/platform/admin/courses/create`
2. Enter course title: "Test S3 Upload"
3. Upload a thumbnail image
4. Open DevTools → Network tab
5. Check `/api/s3/upload` response
6. Verify key starts with `platform/courses/test-s3-upload/`

---

## 📝 Notes

- All test files are automatically cleaned up after testing
- Test images are small (200x200 pixels) to minimize bandwidth
- Rate limiting may affect rapid successive tests
- S3 bucket must have CORS configured for browser uploads
- Tests require admin authentication to work properly

---

_Last Updated: 2025-01-18_
_Implementation Version: 1.0.0_
