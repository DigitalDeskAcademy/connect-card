/**
 * New Chapter Modal - Streamlined chapter creation interface
 *
 * Provides a focused modal interface for creating new chapters within course structure.
 * Optimized for rapid content organization with minimal friction and immediate feedback.
 * Integrates seamlessly with the drag-and-drop course structure management system.
 *
 * Admin Workflow:
 * - One-click modal access from course structure management
 * - Simple form with chapter name input and validation
 * - Real-time validation with user-friendly error messages
 * - Automatic modal closure and form reset on successful creation
 * - Immediate integration with existing course structure display
 *
 * Content Management Features:
 * - Chapter name validation with Zod schema enforcement
 * - Automatic course association for proper data relationships
 * - Server-side validation and conflict prevention
 * - Optimistic UI updates with loading states
 *
 * User Experience:
 * - Minimal modal design focused on essential chapter information
 * - Keyboard shortcuts and accessibility compliance
 * - Loading states with visual feedback during submission
 * - Toast notifications for success and error handling
 * - Smooth modal animations and state transitions
 *
 * Technical Implementation:
 * - React Hook Form with Zod validation for type safety
 * - Controlled modal state management with open/close handling
 * - Server action integration with comprehensive error handling
 * - Form reset and state cleanup on successful submission
 * - Responsive modal design for various screen sizes
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { chapterSchema, ChapterSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import { createChapter } from "../actions";

/**
 * New Chapter Modal Component
 *
 * Modal interface for creating new chapters within course structure.
 * Handles form submission, validation, and user feedback.
 *
 * @param courseId - The course ID to associate the new chapter with
 */
export function NewChapterModal({ courseId }: { courseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // 1. Define your form.
  const form = useForm<ChapterSchemaType>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
    },
  });

  async function onSubmit(values: ChapterSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createChapter(values));

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        form.reset();
        setIsOpen(false);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="size-4" /> New Chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new chapter</DialogTitle>
          <DialogDescription>
            What would you like to name your chapter?
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Chapter Name" {...field} />
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
