# AWS S3 File Uploads (Tigris)

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
- **CORS Configured**: Tigris bucket allows cross-origin uploads from localhost

## Environment Variables:

```bash
AWS_ACCESS_KEY_ID=tid_xxx           # Tigris access key
AWS_SECRET_ACCESS_KEY=tsec_xxx      # Tigris secret key
AWS_ENDPOINT_URL_S3=https://t3.storage.tigris.dev
AWS_REGION=auto                     # Tigris requires "auto"
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=your-bucket-name
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

## Troubleshooting:

- **CORS Errors**: Ensure Tigris bucket CORS allows localhost origin
- **Presigned URL Expired**: URLs expire in 6 minutes, generate fresh ones
- **Upload Fails**: Check Arcjet rate limiting and auth status
- **URL Construction Fails**: Verify bucket name in environment variables

## Future Enhancements:

- **Image Optimization**: Automatic resizing/compression before upload
- **Video Processing**: Transcoding and multiple resolution support
- **CDN Integration**: CloudFlare CDN for faster global delivery
- **File Type Validation**: Restrict uploads to specific formats
