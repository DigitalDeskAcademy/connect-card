# React Dropzone

## Package Overview

- **Package**: `react-dropzone` (v14.3.8)
- **Types**: `@types/react-dropzone` (v5.1.0)
- **Purpose**: File upload drag-and-drop interface
- **Installation Date**: File upload system development
- **TypeScript Support**: ✅ Community types

## Why React Dropzone?

- **User Experience**: Intuitive drag-and-drop file uploads
- **File Validation**: Built-in file type and size validation
- **Accessibility**: Keyboard navigation and screen reader support
- **Customizable**: Full control over styling and behavior
- **Mobile Support**: Works on touch devices

## Implementation Details

### Key Files:

- `components/file-uploader/Uploader.tsx` - Main upload component
- `components/file-uploader/RenderState.tsx` - Upload state management
- `app/api/s3/upload/route.ts` - Backend integration

### Basic Usage:

```typescript
import { useDropzone } from 'react-dropzone';

function FileUploader() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      // Handle file upload
    },
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop files here...</p>
      ) : (
        <p>Drag files here, or click to select</p>
      )}
    </div>
  );
}
```

## Integration with LMS:

### File Upload Flow:

1. **User selects/drops files** into dropzone
2. **Validation** checks file type and size
3. **Presigned URL** requested from API
4. **Direct S3 upload** using XMLHttpRequest
5. **Progress tracking** via upload events
6. **Success/error handling** with user feedback

### Validation Rules:

- **Images**: PNG, JPG, JPEG only
- **Videos**: MP4, MOV, AVI formats
- **Size Limit**: 10MB per file
- **Multiple Files**: Disabled (one file at a time)

## Key Features Used:

- **File Type Validation**: `accept` prop with MIME types
- **Size Validation**: `maxSize` prop in bytes
- **Visual Feedback**: `isDragActive`, `isDragReject` states
- **Error Handling**: `fileRejections` for validation failures
- **Custom Styling**: Full control over drag states

## Security Considerations:

- **Client-Side Validation**: File type/size checked before upload
- **Server-Side Validation**: API validates file metadata
- **Presigned URLs**: No AWS credentials exposed to frontend
- **Rate Limiting**: Arcjet prevents upload abuse

## Styling Integration:

```typescript
// Tailwind classes for different drag states
const baseClasses = "border-2 border-dashed rounded-lg p-8";
const activeClasses = isDragActive
  ? "border-primary bg-primary/5"
  : "border-gray-300";
const rejectClasses = isDragReject ? "border-red-500 bg-red-50" : "";
```

## Error Handling:

```typescript
const onDropRejected = useCallback(fileRejections => {
  fileRejections.forEach(file => {
    file.errors.forEach(error => {
      if (error.code === "file-too-large") {
        toast.error("File is too large. Max size is 10MB.");
      } else if (error.code === "file-invalid-type") {
        toast.error("Invalid file type. Please select an image or video.");
      }
    });
  });
}, []);
```

## Alternatives Considered:

- **Native File Input**: Poor UX, no drag-and-drop
- **react-filepond**: More features but heavier bundle
- **uppy**: Complex setup, overkill for basic uploads
- **Custom Implementation**: Too much work for drag-and-drop UX

## Performance Considerations:

- **File Preview**: Generate previews only when needed
- **Memory Management**: Clean up object URLs after use
- **Large Files**: Consider chunked uploads for files >10MB
- **Bundle Size**: Import only needed functions from library

## Troubleshooting:

- **Files Not Accepted**: Check `accept` prop matches file MIME types
- **Drag Not Working**: Ensure proper event preventDefault in parent elements
- **Mobile Issues**: Test touch events on actual devices
- **Validation Errors**: Use `fileRejections` to debug acceptance issues

## Usage in Components:

- **Course Creation**: Upload course thumbnail images
- **Lesson Management**: Upload lesson video files
- **User Profiles**: Profile picture uploads (future)
- **Bulk Content**: Multiple file uploads (future enhancement)

## Future Enhancements:

- **Multiple File Support**: Upload multiple files at once
- **Progress Indicators**: Show individual file upload progress
- **Image Preview**: Generate thumbnails before upload
- **Chunked Uploads**: Handle very large video files
- **Resume Uploads**: Allow pausing and resuming uploads
