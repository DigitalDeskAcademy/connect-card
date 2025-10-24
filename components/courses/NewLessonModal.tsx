/**
 * New Lesson Modal - Contextual lesson creation within chapter structure
 *
 * Shared component for creating new lessons in both platform and agency contexts.
 * Follows callback pattern for multi-tenant compatibility.
 *
 * Admin Workflow:
 * - Chapter-contextual lesson creation with automatic parent associations
 * - Minimal form interface focused on essential lesson information
 * - Real-time validation with immediate feedback on input errors
 * - Automatic modal state management with form cleanup on cancellation
 * - Seamless integration with course structure drag-and-drop interface
 *
 * Content Management Features:
 * - Lesson name validation with comprehensive Zod schema enforcement
 * - Automatic course and chapter relationship establishment
 * - Server-side validation preventing duplicate lesson names within chapters
 * - Optimistic UI updates with loading states during async operations
 *
 * User Experience:
 * - Contextual placement within chapter sections for logical workflow
 * - Full-width trigger button for easy access within chapter interface
 * - Form reset functionality on modal close to prevent data persistence
 * - Loading states with clear visual feedback during submission
 * - Success toast notifications with automatic modal closure
 *
 * Technical Implementation:
 * - React Hook Form integration with Zod resolver for type-safe validation
 * - Dual ID management (courseId and chapterId) for proper data relationships
 * - Controlled modal state with cleanup handlers for optimal user experience
 * - Callback pattern for multi-tenant server action integration
 * - Responsive modal design optimized for content creation workflows
 *
 * Hierarchical Context:
 * - Maintains Course → Chapter → Lesson relationship integrity
 * - Prevents orphaned lessons through required parent associations
 * - Enables proper content organization within educational structure
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { ApiResponse } from "@/lib/types";

interface NewLessonModalProps {
  courseId: string;
  chapterId: string;
  onSubmit: (data: LessonSchemaType) => Promise<
    ApiResponse<{
      lessonId: string;
      title: string;
      description: string | null;
      videoKey: string | null;
    }>
  >;
  onSuccess?: (
    lessonData: {
      lessonId: string;
      title: string;
      description: string | null;
      videoKey: string | null;
    },
    chapterId: string
  ) => void;
}

/**
 * New Lesson Modal Component
 *
 * Chapter-contextual lesson creation interface with automatic parent relationship management.
 * Accepts onSubmit callback for multi-tenant compatibility.
 *
 * @param courseId - The course ID for lesson association and data integrity
 * @param chapterId - The parent chapter ID for hierarchical lesson organization
 * @param onSubmit - Callback function to handle lesson creation (platform/agency specific)
 * @param onSuccess - Optional callback invoked with created lesson data for auto-opening edit dialog
 */
export function NewLessonModal({
  courseId,
  chapterId,
  onSubmit,
  onSuccess,
}: NewLessonModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
      chapterId: chapterId,
    },
  });

  async function handleSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(onSubmit(values));

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        form.reset();
        setIsOpen(false);
        // Call onSuccess callback with lesson data if provided
        if (result.data && onSuccess) {
          onSuccess(result.data, chapterId);
        }
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
    }

    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-center gap-1">
          <Plus className="size-4" /> New Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new lesson</DialogTitle>
          <DialogDescription>
            What would you like to name your lesson?
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lesson Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button disabled={pending} type="submit">
                {pending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
