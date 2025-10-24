# Placeholder Assets

This directory contains placeholder images that are used as defaults when users create new content without uploading their own images.

## Files

- `course-thumbnail-default.jpg` - Default thumbnail for new courses (16:9 aspect ratio, 1920x1080)

## Usage

These placeholders are automatically applied when:

1. A new course is created without an uploaded thumbnail
2. User clicks "Reset to default" in the uploader

## Database Storage

Placeholder assets are stored in the database with the prefix `placeholder:` to distinguish them from S3-uploaded files.

Example: `placeholder:course-thumbnail-default`

## Adding New Placeholders

1. Add the image file to this directory
2. Update this README with the file details
3. Add a corresponding constant in `/lib/constants/placeholder-assets.ts`

## Important Notes

- Keep file sizes reasonable (< 500KB)
- Use optimized JPG/PNG formats
- Maintain consistent aspect ratios for similar content types
- Use generic, professional imagery that works across all industries
