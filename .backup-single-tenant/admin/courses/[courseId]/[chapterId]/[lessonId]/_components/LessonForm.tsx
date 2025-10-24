/**
 * Lesson Form Component - Comprehensive lesson content editing interface
 *
 * Provides complete lesson management with rich content editing, media upload, and validation.
 * Central component for detailed lesson development within the hierarchical course structure.
 * Optimized for content creator productivity with immediate feedback and seamless media integration.
 *
 * Admin Workflow:
 * - Navigation breadcrumb for easy return to course structure management
 * - Comprehensive lesson editing with title, description, thumbnail, and video
 * - Rich text editor integration for detailed lesson descriptions and content
 * - Dual file upload system supporting both image thumbnails and video content
 * - Real-time validation with immediate feedback on all form fields
 *
 * Content Management Features:
 * - Lesson title editing with validation and duplicate prevention
 * - Rich text description editing with Tiptap editor integration
 * - Thumbnail image upload with S3 storage and preview functionality
 * - Video file upload with S3 storage and progress tracking
 * - Form state persistence and validation across all content types
 *
 * Media Management:
 * - Dual uploader components optimized for different media types
 * - S3 integration for scalable media storage and delivery
 * - File type validation ensuring appropriate content for each field
 * - Upload progress tracking with visual feedback during file operations
 * - Automatic URL construction for uploaded media assets
 *
 * User Experience:
 * - Clear navigation with breadcrumb return to course editing
 * - Logical form progression from basic information to rich content
 * - Loading states with visual feedback during async operations
 * - Success navigation back to course structure after lesson update
 * - Toast notifications for comprehensive user feedback
 *
 * Technical Implementation:
 * - React Hook Form with Zod validation for comprehensive type safety
 * - Pre-populated form fields from existing lesson data
 * - Server action integration with proper error handling patterns
 * - Router navigation for seamless admin workflow transitions
 * - Responsive design optimized for various screen sizes and devices
 *
 * Data Integration:
 * - Hierarchical ID management (courseId, chapterId, lessonId)
 * - Proper lesson data initialization from database
 * - Server-side validation and authorization checks
 * - Optimistic UI updates with rollback on server errors
 */

"use client";

import { AdminLessonType } from "@/app/data/admin/admin-get-lesson";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateLesson } from "../actions";
import { useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";

interface iAppProps {
  data: AdminLessonType;
  chapterId: string;
  courseId: string;
}

/**
 * Lesson Form Component
 *
 * Comprehensive lesson editing interface with media upload and rich content editing.
 * Handles all aspects of lesson content management within course structure.
 *
 * @param data - Existing lesson data for form initialization
 * @param chapterId - Parent chapter ID for hierarchical organization
 * @param courseId - Parent course ID for navigation and authorization
 */
export function LessonForm({ chapterId, data, courseId }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.description ?? undefined,
      videoKey: data.videoKey ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
    },
  });

  async function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateLesson(values, data.id)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result && result.status === "success") {
        toast.success(result.message);
        router.push(`/admin/courses/${courseId}/edit`);
      } else if (result && result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <Link
        className={`${buttonVariants({ variant: "outline" })} mb-6`}
        href={`/admin/courses/${courseId}/edit`}
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="thumbnailKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail Image</FormLabel>
                    <FormControl>
                      <Uploader
                        onChange={field.onChange}
                        value={field.value}
                        fileTypeAccepted="image"
                      />
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
