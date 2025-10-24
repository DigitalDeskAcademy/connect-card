# DND Kit Drag & Drop

## Package Overview

- **Package**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`
- **Purpose**: Drag-and-drop reordering for course structure (chapters and lessons)
- **Installation Date**: Course structure development
- **TypeScript Support**: ✅ Built-in declarations

## Why DND Kit?

- **Modern**: Built for React, uses modern APIs
- **Accessible**: Full keyboard navigation and screen reader support
- **Performant**: Optimized for large lists and complex interactions
- **Flexible**: Can handle any draggable content type
- **TypeScript**: Excellent TypeScript support out of the box

## Implementation Details

### Key Components:

- `DndContext` - Main drag-and-drop wrapper provider
- `SortableContext` - Container for sortable lists
- `useSortable` - Hook to make individual items draggable
- `DragOverlay` - Custom drag preview during drag operations

### Basic Setup:

```typescript
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

function CourseStructureEditor() {
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={chapters} strategy={verticalListSortingStrategy}>
        {chapters.map(chapter => (
          <SortableChapter key={chapter.id} chapter={chapter} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

## Use Cases in LMS:

- **Chapter Reordering**: Drag chapters to change course sequence
- **Lesson Reordering**: Drag lessons within chapters to adjust order
- **Visual Feedback**: Drag handles, hover states, drop indicators
- **Database Updates**: Position changes saved via server actions

## Integration with Database:

- **Position Field**: Each chapter/lesson has `position` field (1-based)
- **Server Actions**: Drag end triggers database position updates
- **Optimistic Updates**: UI updates immediately, database syncs after

## Key Features Implemented:

- **Drag Handles**: Visual indicators for draggable areas
- **Drop Zones**: Clear visual feedback during drag operations
- **Auto-scroll**: Lists auto-scroll when dragging near edges
- **Touch Support**: Works on mobile devices and tablets

## Alternatives Considered:

- **react-beautiful-dnd**: Popular but has performance issues with large lists
- **react-sortable-hoc**: Older, not actively maintained
- **Native HTML5 Drag**: Too basic, poor accessibility
- **Custom Implementation**: Too much work, accessibility concerns

## Configuration Options:

```typescript
// Vertical sorting strategy for lists
import { verticalListSortingStrategy } from "@dnd-kit/sortable";

// Collision detection algorithms
import { closestCenter, closestCorners, rectIntersection } from "@dnd-kit/core";

// Modifiers for constraints
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
```

## Performance Considerations:

- **Large Lists**: Use `restrictToVerticalAxis` modifier to improve performance
- **Virtual Scrolling**: Consider for courses with 100+ items
- **Debounced Updates**: Don't save position on every drag event
- **Optimistic UI**: Update immediately, handle errors gracefully

## Troubleshooting:

- **Items Not Dragging**: Check if `useSortable` hook is properly implemented
- **Position Not Saving**: Verify server action is called in `onDragEnd`
- **Visual Glitches**: Ensure proper CSS for drag states and overlays
- **Touch Issues**: Test touch events on actual mobile devices, not just browser dev tools

## Future Enhancements:

- **Multi-Select Drag**: Select and drag multiple items at once
- **Cross-List Drag**: Move items between different course sections
- **Undo/Redo**: Allow users to undo reordering operations
- **Animation**: Smooth animations for better user experience
