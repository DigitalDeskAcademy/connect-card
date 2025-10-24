/**
 * Shared Lesson Form Component
 *
 * Reusable lesson editing form for both platform and agency admins.
 * Reduces code duplication and ensures consistent lesson management experience.
 */

"use client";

import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTransition, useEffect } from "react";
import { tryCatch } from "@/hooks/try-catch";

export interface LessonData {
  id: string;
  title: string;
  description: string | null;
  videoKey: string | null;
}

interface SharedLessonFormProps {
  lesson: LessonData;
  chapterId: string;
  courseId: string;
  backUrl: string;
  onSubmit: (
    values: LessonSchemaType,
    lessonId: string
  ) => Promise<{
    status: "success" | "error";
    message: string;
  }>;
}

/**
 * Shared Lesson Form Component
 *
 * @param lesson - Existing lesson data
 * @param chapterId - Parent chapter ID
 * @param courseId - Parent course ID
 * @param backUrl - URL to return to after save or cancel
 * @param onSubmit - Server action to handle form submission
 */
export function LessonForm({
  lesson,
  chapterId,
  courseId,
  backUrl,
  onSubmit,
}: SharedLessonFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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

  async function handleSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        onSubmit(values, lesson.id)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result && result.status === "success") {
        toast.success(result.message);
        // Reset form with new values to clear dirty state
        form.reset(values);
        // UX Improvement: Stay on lesson page after save instead of redirecting
        // Users can click "Go Back" when done editing
        // router.push(backUrl);
      } else if (result && result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty && !pending) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty, pending]);

  return (
    <div>
      <Link
        className={`${buttonVariants({ variant: "outline" })} mb-6`}
        href={backUrl}
      >
        <ArrowLeft className="size-4" />
        <span>Go Back</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Configuration</CardTitle>
          <CardDescription>
            Configure the video and description for the lesson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {form.formState.isDirty && (
            <div className="flex items-center gap-2 text-amber-600 text-sm mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>
                You have unsaved changes - Remember to click &apos;Save
                Lesson&apos;
              </span>
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3">
                <Button disabled={pending} type="submit">
                  Save Lesson
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    if (form.formState.isDirty) {
                      const confirmed = window.confirm(
                        "You have unsaved changes. Are you sure you want to leave without saving?"
                      );
                      if (confirmed) {
                        router.push(backUrl);
                      }
                    } else {
                      router.push(backUrl);
                    }
                  }}
                >
                  Cancel
                </Button>
                {pending && (
                  <span className="text-sm text-muted-foreground">
                    Saving...
                  </span>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
