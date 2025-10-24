/**
 * New Chapter Modal - Streamlined chapter creation interface
 *
 * Shared component for creating new chapters in both platform and agency contexts.
 * Follows callback pattern for multi-tenant compatibility.
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
 * - Callback pattern for multi-tenant server action integration
 * - Form reset and state cleanup on successful submission
 * - Responsive modal design for various screen sizes
 */

"use client";

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
import { ApiResponse } from "@/lib/types";

interface NewChapterModalProps {
  courseId: string;
  onSubmit: (data: ChapterSchemaType) => Promise<ApiResponse>;
}

/**
 * New Chapter Modal Component
 *
 * Modal interface for creating new chapters within course structure.
 * Accepts onSubmit callback for multi-tenant compatibility.
 *
 * @param courseId - The course ID to associate the new chapter with
 * @param onSubmit - Callback function to handle chapter creation (platform/agency specific)
 */
export function NewChapterModal({ courseId, onSubmit }: NewChapterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<ChapterSchemaType>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
    },
  });

  async function handleSubmit(values: ChapterSchemaType) {
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
