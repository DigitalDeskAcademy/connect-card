/**
 * Create Course Form Component - Shared course creation interface
 *
 * Comprehensive course builder used across both platform and agency contexts.
 * Follows callback pattern for multi-tenant compatibility.
 *
 * Admin Workflow:
 * - Guided form progression from basic to advanced course details
 * - Automatic slug generation from course title for SEO optimization
 * - Rich text editing with Tiptap integration for detailed descriptions
 * - S3 thumbnail upload with drag-and-drop interface
 * - Comprehensive validation with real-time feedback
 *
 * Content Management Features:
 * - Course categorization with predefined categories
 * - Difficulty level selection for appropriate student targeting
 * - Pricing and duration configuration for business operations
 * - Course status management (Draft, Published, Archived)
 * - SEO-friendly slug generation with validation
 *
 * User Experience:
 * - Responsive form layout adapting to screen sizes
 * - Loading states with visual indicators during submission
 * - Celebratory confetti animation on successful creation
 * - Error handling with user-friendly toast notifications
 * - Form reset and navigation after successful creation
 *
 * Technical Implementation:
 * - React Hook Form with Zod validation for type safety
 * - Optimistic UI updates with React transitions
 * - Callback pattern for platform/agency specific actions
 * - File upload integration with S3 storage
 * - Configurable UI for different contexts
 *
 * Context Flexibility:
 * - Platform: Active pricing with Stripe integration
 * - Agency: Subscription-based with disabled pricing field
 * - Custom navigation paths per context
 * - Organization-scoped uploads for multi-tenancy
 */

"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  courseCategories,
  courseLevels,
  courseSchema,
  CourseSchemaType,
  courseStatus,
} from "@/lib/zodSchemas";
import { ArrowLeft, Info, Loader2, PlusIcon, SparkleIcon } from "lucide-react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
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
import slugify from "slugify";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/hooks/use-confetti";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiResponse } from "@/lib/types";

interface CreateCourseFormProps {
  onSubmit: (data: CourseSchemaType) => Promise<ApiResponse>;
  backHref: string;
  redirectPath: string;
  pageTitle?: string;
  cardTitle?: string;
  cardDescription?: string;
  priceFieldDisabled?: boolean;
  priceTooltipContent?: {
    line1: string;
    line2: string;
  };
  organizationSlug?: string;
}

/**
 * Create Course Form Component
 *
 * Comprehensive course builder with form validation, file uploads, and rich content editing.
 * Accepts onSubmit callback for multi-tenant compatibility.
 *
 * @param onSubmit - Callback function to handle course creation (platform/agency specific)
 * @param backHref - URL for the back button navigation
 * @param redirectPath - Path to redirect after successful creation
 * @param pageTitle - Title displayed at the top of the page
 * @param cardTitle - Title displayed in the card header
 * @param cardDescription - Description displayed in the card header
 * @param priceFieldDisabled - Whether the price field should be disabled (agency mode)
 * @param priceTooltipContent - Custom content for the price field tooltip
 * @param organizationSlug - Organization slug for scoped file uploads (agency only)
 */
export function CreateCourseForm({
  onSubmit,
  backHref,
  redirectPath,
  pageTitle = "Create Course",
  cardTitle = "Basic Information",
  cardDescription = "Provide basic information about the course",
  priceFieldDisabled = false,
  priceTooltipContent = {
    line1: "Enter 0 for free courses.",
    line2: "Free courses won't require payment or Stripe integration.",
  },
  organizationSlug,
}: CreateCourseFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { triggerConfetti } = useConfetti();

  // Initialize form with default values
  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      fileKey: "",
      price: 0,
      duration: 0,
      level: "Core",
      category: "Essentials",
      status: "Draft",
      slug: "",
      smallDescription: "",
    },
  });

  // Watch the title field for S3 path organization
  const watchedTitle = useWatch({ control: form.control, name: "title" });

  // Handle form submission
  function handleSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(onSubmit(values));

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
        form.reset();
        router.push(redirectPath);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={backHref}
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Course Title" {...field} />
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
                      <FormLabel>
                        Slug
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="inline-block w-4 h-4 ml-1 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              The slug is the URL-friendly version of your
                              course title.
                            </p>
                            <p className="mt-1">
                              Example: &ldquo;my-awesome-course&rdquo;
                            </p>
                            <p className="mt-1 font-medium">
                              If you&rsquo;re unsure, enter a title above and
                              click &ldquo;Generate Slug&rdquo;.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="course-url-path" {...field} />
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
                    <FormLabel>
                      {priceFieldDisabled
                        ? "Brief Description"
                        : "Small Description"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          priceFieldDisabled
                            ? "A short description of your course"
                            : "Small Description"
                        }
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
                    <FormLabel>
                      {priceFieldDisabled ? "Full Description" : "Description"}
                    </FormLabel>
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
                    <FormLabel>
                      {priceFieldDisabled
                        ? "Course Thumbnail"
                        : "Thumbnail image"}
                    </FormLabel>
                    <FormControl>
                      <Uploader
                        fileTypeAccepted="image"
                        onChange={field.onChange}
                        value={field.value}
                        fileType="thumbnail"
                        organizationSlug={organizationSlug}
                        courseName={watchedTitle}
                      />
                    </FormControl>
                    <FormMessage />
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
                      <FormLabel>
                        {priceFieldDisabled ? "Difficulty Level" : "Level"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                priceFieldDisabled
                                  ? "Select Level"
                                  : "Select Value"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courseLevels.map(level => (
                            <SelectItem key={level} value={level}>
                              {level}
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
                        <Input
                          placeholder={
                            priceFieldDisabled ? "Estimated hours" : "Duration"
                          }
                          type="number"
                          {...field}
                        />
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
                      <FormLabel>
                        {priceFieldDisabled ? "Price" : "Price ($)"}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="inline-block w-4 h-4 ml-1 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{priceTooltipContent.line1}</p>
                            <p className="mt-1">{priceTooltipContent.line2}</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={priceFieldDisabled ? "0" : "Price"}
                          type="number"
                          min="0"
                          disabled={priceFieldDisabled}
                          {...field}
                        />
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
                    <FormLabel>
                      {priceFieldDisabled ? "Publication Status" : "Status"}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courseStatus.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    Creating...
                    <Loader2 className="animate-spin ml-1" />
                  </>
                ) : (
                  <>
                    Create Course <PlusIcon className="ml-1" size={16} />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
