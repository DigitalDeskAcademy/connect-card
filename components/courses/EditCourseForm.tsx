/**
 * Shared Edit Course Form Component
 *
 * Reusable course editing form for both platform and agency admins.
 * Reduces code duplication and ensures consistent course management experience.
 * Follows the same pattern as LessonForm for maintainability.
 */

"use client";

import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tryCatch } from "@/hooks/try-catch";
import {
  courseCategories,
  courseLevels,
  courseSchema,
  CourseSchemaType,
  courseStatus,
} from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SparkleIcon, Loader2, Save } from "lucide-react";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import slugify from "slugify";
import { toast } from "sonner";
import { ApiResponse } from "@/lib/types";

/**
 * Simplified course data interface for the shared form
 * Accepts data from both AdminCourseSingularType and AgencyCourseSingularType
 */
export interface CourseData {
  id: string;
  title: string;
  description: string;
  fileKey: string;
  price: number;
  duration: number;
  level: string; // Prisma returns these as strings from the DB
  category: string;
  status: string;
  slug: string;
  smallDescription: string;
}

interface EditCourseFormProps {
  course: CourseData;
  onSubmit: (
    values: CourseSchemaType,
    courseId: string
  ) => Promise<ApiResponse>;
  onCancel: () => void;
  organizationSlug?: string; // For agency file uploads with proper S3 path
}

/**
 * Shared Edit Course Form Component
 *
 * @param course - Existing course data
 * @param onSubmit - Server action to handle form submission (platform or agency)
 * @param onCancel - Navigation handler for cancel action
 * @param organizationSlug - Optional agency slug for multi-tenant file uploads
 */
export function EditCourseForm({
  course,
  onSubmit,
  onCancel,
  organizationSlug,
}: EditCourseFormProps) {
  const [pending, startTransition] = useTransition();

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course.title,
      description: course.description,
      fileKey: course.fileKey,
      price: course.price,
      duration: course.duration,
      level: course.level as CourseSchemaType["level"],
      category: course.category as CourseSchemaType["category"],
      status: course.status as CourseSchemaType["status"],
      slug: course.slug,
      smallDescription: course.smallDescription,
    },
  });

  // Watch the title field for S3 path organization
  const watchedTitle = useWatch({ control: form.control, name: "title" });

  function handleSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        onSubmit(values, course.id)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        // Reset with updated values instead of clearing form
        form.reset(values);
        onCancel(); // Navigate back using provided callback
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-end">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter a Title and click the Generate Slug button ---->"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            className="w-fit"
            onClick={() => {
              const titleValue = form.getValues("title");

              if (!titleValue || titleValue.trim().length < 3) {
                form.trigger("title");
                return;
              }

              const slug = slugify(titleValue, {
                lower: true,
                strict: true,
                trim: true,
              });

              form.setValue("slug", slug, { shouldValidate: true });
              form.clearErrors("slug");
              form.clearErrors("title");
            }}
          >
            Generate Slug <SparkleIcon className="ml-1" size={16} />
          </Button>
        </div>

        <FormField
          control={form.control}
          name="smallDescription"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Small Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Small Description"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <RichTextEditor field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fileKey"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Thumbnail image</FormLabel>
              <FormControl>
                <Uploader
                  fileTypeAccepted="image"
                  onChange={value => {
                    field.onChange(value);
                    // Manually trigger validation to ensure form knows field changed
                    form.trigger("fileKey");
                  }}
                  value={field.value}
                  courseId={course.id}
                  fileType="thumbnail"
                  organizationSlug={organizationSlug}
                  courseName={watchedTitle || course.title}
                />
              </FormControl>
              <FormMessage />
              {field.value && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current file:{" "}
                  {field.value.substring(field.value.lastIndexOf("/") + 1)}
                </p>
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Value" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseLevels.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input placeholder="Duration" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input placeholder="Price" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courseStatus.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                Updating...
                <Loader2 className="animate-spin ml-1" />
              </>
            ) : (
              <>
                Save Course <Save className="ml-1" size={16} />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
