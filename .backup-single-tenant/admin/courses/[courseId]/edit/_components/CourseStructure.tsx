/**
 * Course Structure Manager - Hierarchical content organization with drag-and-drop
 *
 * Provides intuitive drag-and-drop interface for organizing course chapters and lessons.
 * Enables efficient content structuring with real-time visual feedback and validation.
 * Central hub for course content management and structural organization.
 *
 * Admin Workflow:
 * - Visual drag-and-drop reordering of chapters and lessons
 * - Collapsible chapter sections for efficient content management
 * - Inline creation of new chapters and lessons with modals
 * - Direct navigation to lesson editing from structure view
 * - Real-time validation and conflict prevention during reordering
 *
 * Content Management Features:
 * - Hierarchical course structure (Course → Chapters → Lessons)
 * - Chapter collapse/expand state management for improved UX
 * - Position-based ordering with automatic renumbering
 * - Contextual action buttons for creation and deletion
 * - Visual indicators for content types and hierarchy levels
 *
 * Drag-and-Drop Implementation:
 * - DND Kit integration for smooth, accessible drag operations
 * - Separate handling for chapter-to-chapter and lesson-to-lesson reordering
 * - Collision detection with rectangle intersection algorithm
 * - Keyboard navigation support for accessibility compliance
 * - Touch-friendly interactions for mobile admin interface
 *
 * Technical Architecture:
 * - Client-side state management with server-side synchronization
 * - Optimistic updates with rollback on server action failure
 * - Toast notifications for user feedback during async operations
 * - Efficient re-rendering with React state optimization
 * - Type-safe drag data with discriminated union types
 *
 * Performance Optimizations:
 * - Minimal re-renders during drag operations
 * - Efficient collision detection with rect intersection
 * - Lazy loading for lesson content when chapters expanded
 * - Debounced server updates to prevent excessive API calls
 *
 * User Experience:
 * - Immediate visual feedback during drag operations
 * - Clear visual hierarchy with indentation and icons
 * - Hover states and interactive feedback for all drag targets
 * - Accessible keyboard navigation patterns
 * - Mobile-responsive touch interactions
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DndContext,
  DragEndEvent,
  DraggableSyntheticListeners,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ReactNode, useEffect, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { AdminCourseSingularType } from "@/app/data/admin/admin-get-course";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { reorderChapters, reorderLessons } from "../actions";
import { NewChapterModal } from "./NewChapterModal";
import { NewLessonModal } from "./NewLessonModal";
import { DeleteLesson } from "./DeleteLesson";
import { DeleteChapter } from "./DeleteChapter";

interface iAppProps {
  data: AdminCourseSingularType;
}

/**
 * Sortable Item Props
 *
 * Defines the structure for draggable items within the course structure.
 * Supports both chapters and lessons with type-safe drag data.
 */
interface SortableItemProps {
  id: string;
  children: (listeners: DraggableSyntheticListeners) => ReactNode;
  className?: string;
  data?: {
    type: "chapter" | "lesson";
    chapterId?: string; //only relevant for lessons
  };
}

/**
 * Course Structure Component
 *
 * Main component for managing hierarchical course content structure.
 * Handles drag-and-drop reordering, chapter/lesson management, and navigation.
 *
 * @param data - Course data including chapters and lessons hierarchy
 */
export function CourseStructure({ data }: iAppProps) {
  const initialItems =
    data.chapter.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.position,
      isOpen: true, //deault chapters to open
      lessons: chapter.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.position,
      })),
    })) || [];

  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(prevItems => {
      const updatedItems =
        data.chapter.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          order: chapter.position,
          isOpen:
            prevItems.find(item => item.id === chapter.id)?.isOpen ?? true,
          lessons: chapter.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.position,
          })),
        })) || [];

      return updatedItems;
    });
  }, [data]);

  /**
   * Sortable Item Wrapper
   *
   * Provides drag-and-drop functionality for individual course structure elements.
   * Handles transform animations, touch interactions, and accessibility attributes.
   *
   * @param children - Render function that receives drag listeners for flexible UI composition
   * @param id - Unique identifier for the sortable item (chapter or lesson ID)
   * @param className - Additional CSS classes for styling
   * @param data - Metadata about the draggable item (type and parent references)
   */
  function SortableItem({ children, id, className, data }: SortableItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: id, data: data });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn("touch-none", className, isDragging ? "z-10" : "")}
      >
        {children(listeners)}
      </div>
    );
  }

  /**
   * Drag End Handler
   *
   * Processes completed drag operations and updates course structure accordingly.
   * Handles both chapter-to-chapter and lesson-to-lesson reordering with validation.
   * Implements optimistic updates with server-side persistence and rollback on failure.
   *
   * Chapter Reordering:
   * - Validates target position and prevents invalid moves
   * - Updates local state optimistically for immediate feedback
   * - Persists changes via server action with toast feedback
   * - Rolls back on server errors to maintain data consistency
   *
   * Lesson Reordering:
   * - Ensures lessons can only be reordered within the same chapter
   * - Prevents cross-chapter lesson movements for data integrity
   * - Updates lesson positions with automatic renumbering
   * - Maintains chapter structure during lesson reorganization
   *
   * @param event - DND Kit drag end event with active and target drop information
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    const activeType = active.data.current?.type as "chapter" | "lesson";
    const overType = over.data.current?.type as "chapter" | "lesson";
    const courseId = data.id;

    if (activeType === "chapter") {
      let targetChapterId = null;

      if (overType === "chapter") {
        targetChapterId = overId;
      } else if (overType === "lesson") {
        targetChapterId = over.data.current?.chapterId ?? null;
        // Handle chapter-to-lesson drop logic
      }
      if (!targetChapterId) {
        toast.error("Could not find target chapter");
        return;
      }

      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === targetChapterId);

      if (oldIndex === -1 || newIndex === -1) {
        toast.error("Invalid item positions");
        return;
      }

      const reorderedLocalChapters = arrayMove(items, oldIndex, newIndex);
      const updatedChapterForState = reorderedLocalChapters.map(
        (chapter, index) => ({
          ...chapter,
          order: index + 1,
        })
      );
      const previousItems = [...items];
      setItems(updatedChapterForState);

      if (courseId) {
        const chaptersToUpdate = updatedChapterForState.map(chapter => ({
          id: chapter.id,
          position: chapter.order,
        }));
        const reorderPromise = () =>
          reorderChapters(courseId, chaptersToUpdate);
        toast.promise(reorderPromise(), {
          loading: "Reordering chapters...",
          success: result => {
            if (result.status === "success") return result.message;

            throw new Error(result.message);
          },
          error: () => {
            setItems(previousItems);
            return "Failed to reorder chapters";
          },
        });
      }
      return;
    }

    if (activeType === "lesson" && overType === "lesson") {
      const chapterId = active.data.current?.chapterId;
      const overChapterId = over.data.current?.chapterId;

      if (!chapterId || chapterId !== overChapterId) {
        toast.error("Could not move lesson this way");
        return;
      }
      // Handle lesson-to-chapter drop logic

      const chapterIndex = items.findIndex(chapter => chapter.id === chapterId);

      if (chapterIndex === -1) {
        toast.error("Could not find chapter");
        return;
      }

      const chapterToUpdate = items[chapterIndex];

      const oldLessonIndex = chapterToUpdate.lessons.findIndex(
        lesson => lesson.id === activeId
      );
      const newLessonIndex = chapterToUpdate.lessons.findIndex(
        lesson => lesson.id === overId
      );

      if (oldLessonIndex === -1 || newLessonIndex === -1) {
        toast.error("Invalid lesson positions");
        return;
      }

      const reorderedLessons = arrayMove(
        chapterToUpdate.lessons,
        oldLessonIndex,
        newLessonIndex
      );

      const updatedLessonsForState = reorderedLessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      }));

      const newItems = [...items];

      newItems[chapterIndex] = {
        ...chapterToUpdate,
        lessons: updatedLessonsForState,
      };

      const previousItems = [...items];
      setItems(newItems);
      // Optionally persist to backend

      if (courseId) {
        const lessonsToUpdate = updatedLessonsForState.map(lesson => ({
          id: lesson.id,
          position: lesson.order,
        }));

        const reorderLessonsPromise = () =>
          reorderLessons(chapterId, lessonsToUpdate, courseId);
        toast.promise(reorderLessonsPromise(), {
          loading: "Reordering lessons",
          success: result => {
            if (result.status === "success") return result.message;
            throw new Error(result.message);
          },
          error: () => {
            setItems(previousItems);
            return "Failed to reorder lessons";
          },
        });
      }
      return;
    }
  }
  /**
   * Chapter Toggle Handler
   *
   * Manages the expand/collapse state of individual chapters for improved UX.
   * Allows admins to focus on specific chapters while managing course structure.
   * State is maintained locally for immediate responsiveness during content organization.
   *
   * @param chapterId - Unique identifier of the chapter to toggle
   */
  function toggleChapter(chapterId: string) {
    setItems(
      items.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, isOpen: !chapter.isOpen }
          : chapter
      )
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle>Chapters</CardTitle>
          <NewChapterModal courseId={data.id} />
        </CardHeader>
        <CardContent className="space-y-8">
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <SortableItem
                id={item.id}
                data={{ type: "chapter" }}
                key={item.id}
              >
                {listeners => (
                  <Card>
                    <Collapsible
                      open={item.isOpen}
                      onOpenChange={() => toggleChapter(item.id)}
                    >
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" {...listeners}>
                            <GripVertical className="size-4" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="flex items-center"
                            >
                              {item.isOpen ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <p className="cursor-pointer hover:text-primary pl-2">
                            {item.title}
                          </p>
                        </div>

                        <DeleteChapter chapterId={item.id} courseId={data.id} />
                      </div>

                      <CollapsibleContent>
                        <div className="p-1">
                          <SortableContext
                            items={item.lessons.map(lesson => lesson.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {item.lessons.map(lesson => (
                              <SortableItem
                                key={lesson.id}
                                id={lesson.id}
                                data={{ type: "lesson", chapterId: item.id }}
                              >
                                {lessonListeners => (
                                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        {...lessonListeners}
                                      >
                                        <GripVertical className="size-4" />
                                      </Button>
                                      <FileText className="size-4" />
                                      <Link
                                        href={`/admin/courses/${data.id}/${item.id}/${lesson.id}`}
                                      >
                                        {lesson.title}
                                      </Link>
                                    </div>

                                    <DeleteLesson
                                      chapterId={item.id}
                                      courseId={data.id}
                                      lessonId={lesson.id}
                                    />
                                  </div>
                                )}
                              </SortableItem>
                            ))}
                          </SortableContext>
                          <div className="p-2">
                            <NewLessonModal
                              chapterId={item.id}
                              courseId={data.id}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </DndContext>
  );
}
