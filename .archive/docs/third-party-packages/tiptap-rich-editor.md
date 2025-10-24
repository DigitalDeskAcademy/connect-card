# Tiptap Rich Text Editor

## Package Overview

- **Package**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`
- **Purpose**: WYSIWYG rich text editor for course descriptions
- **Installation Date**: Course development phase
- **TypeScript Support**: ✅ Built-in declarations

## Why Tiptap?

- **Headless**: Full control over UI/styling (matches shadcn/ui design)
- **Modern**: Built on ProseMirror, actively maintained
- **Extensible**: Easy to add custom functionality
- **React Integration**: First-class React support
- **JSON Output**: Stores content as structured JSON (better than HTML)

## Implementation Details

### Key Files:

- `components/rich-text-editor/RenderDescription.tsx` - Display component
- Course descriptions stored as JSON in database
- Integrates with Prisma schema `Course.description` field

### Configuration:

```typescript
// Basic starter kit with essential extensions
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const editor = useEditor({
  extensions: [StarterKit],
  content: jsonContent,
});
```

### JSON Storage Format:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Course Overview" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Course description..." }]
    }
  ]
}
```

## Usage in LMS:

- **Course Creation**: Admin creates rich course descriptions
- **Course Display**: JSON rendered as formatted HTML for students
- **Seed Data**: Auto-generated course descriptions in structured format

## Alternatives Considered:

- **React-Quill**: More traditional, less modern
- **TinyMCE**: Heavy, subscription-based
- **Draft.js**: Facebook's editor, more complex setup
- **Simple Textarea**: Too basic for professional course descriptions

## Troubleshooting:

- **JSON Parse Errors**: Ensure database contains valid JSON structure
- **Styling Issues**: Tiptap content needs custom CSS classes for proper display
- **Extensions**: Add carefully - each extension increases bundle size

## Future Enhancements:

- Add image upload capability within editor
- Implement collaborative editing for course creation
- Add custom blocks for course-specific content (prerequisites, learning objectives)
