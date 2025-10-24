/**
 * Lesson Edit Dialog - Modal for editing lesson content
 *
 * Shared component for editing lessons in both platform and agency contexts.
 * Follows the established Dialog pattern used in NewChapterModal and DeleteLesson.
 *
 * Pattern Alignment:
 * - Self-contained component with trigger + dialog (like DeleteLesson)
 * - Form submission with useTransition (like NewChapterModal)
 * - tryCatch error handling (project standard)
 * - ApiResponse return type (project standard)
 * - Toast notifications for feedback (project standard)
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import { ApiResponse } from "@/lib/types";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";

interface LessonEditDialogProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    videoKey: string | null;
  };
  courseId: string;
  chapterId: string;
  courseName?: string; // Optional - used for S3 hierarchical structure
  organizationSlug?: string; // Optional - used for agency courses
  onSubmit: (
    values: LessonSchemaType,
    lessonId: string
  ) => Promise<ApiResponse>;
  defaultOpen?: boolean; // For programmatic control (auto-open after creation)
  onClose?: () => void; // Callback when dialog closes
}

/**
 * Lesson Edit Dialog Component
 *
 * Self-contained dialog for editing lesson content.
 * Follows DeleteLesson pattern for structure, NewChapterModal pattern for form submission.
 *
 * @param lesson - The lesson data to edit
 * @param courseId - Parent course ID
 * @param chapterId - Parent chapter ID
 * @param onSubmit - Server action callback (platform/agency specific)
 * @param defaultOpen - Optional flag to open dialog by default (for auto-open after creation)
 * @param onClose - Optional callback when dialog closes
 */
export function LessonEditDialog({
  lesson,
  courseId,
  chapterId,
  courseName,
  organizationSlug,
  onSubmit,
  defaultOpen = false,
  onClose,
}: LessonEditDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: lesson.title,
      chapterId: chapterId,
      courseId: courseId,
      description: lesson.description ?? undefined,
      videoKey: lesson.videoKey ?? undefined,
    },
  });

  // Reset form when lesson data changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: lesson.title,
        chapterId: chapterId,
        courseId: courseId,
        description: lesson.description ?? undefined,
        videoKey: lesson.videoKey ?? undefined,
      });
    }
  }, [lesson, chapterId, courseId, open, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  async function handleSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        onSubmit(values, lesson.id)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
        setOpen(false);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(newOpen: boolean) {
    // Warn about unsaved changes
    if (!newOpen && form.formState.isDirty && !pending) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close without saving?"
      );
      if (!confirmed) {
        return;
      }
    }

    setOpen(newOpen);

    // Call onClose callback when dialog closes
    if (!newOpen && onClose) {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!defaultOpen && (
        <DialogTrigger asChild>
          <button className="hover:text-primary cursor-pointer transition-colors">
            {lesson.title}
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>
            Configure the title, description, and video for this lesson.
          </DialogDescription>
        </DialogHeader>

        {form.formState.isDirty && (
          <div className="flex items-center gap-2 text-amber-600 text-sm p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900">
            <AlertCircle className="size-4 flex-shrink-0" />
            <span>
              You have unsaved changes - Remember to click &apos;Save
              Lesson&apos;
            </span>
          </div>
        )}

        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Lesson Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Description</FormLabel>
                  <FormControl>
                    <RichTextEditor field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video File</FormLabel>
                  <FormControl>
                    <Uploader
                      onChange={field.onChange}
                      value={field.value}
                      fileTypeAccepted="video"
                      courseName={courseName}
                      organizationSlug={organizationSlug}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button disabled={pending} type="submit">
                {pending ? "Saving..." : "Save Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
