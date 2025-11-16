"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePrayerRequest } from "@/actions/prayer-requests/update-prayer-request";
import {
  updatePrayerRequestSchema,
  type UpdatePrayerRequestSchemaType,
} from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader } from "@tabler/icons-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";

interface EditPrayerRequestFormProps {
  slug: string;
  prayerRequest: PrayerRequestListItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Edit Prayer Request Form
 *
 * Pre-populated form for updating existing prayer requests.
 * Handles request text, category, privacy, and urgency.
 * Note: Location cannot be edited after creation.
 */
export function EditPrayerRequestForm({
  slug,
  prayerRequest,
  onSuccess,
  onCancel,
}: EditPrayerRequestFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form setup with Zod validation and pre-populated defaults
  const form = useForm({
    resolver: zodResolver(updatePrayerRequestSchema),
    defaultValues: {
      id: prayerRequest.id,
      request: prayerRequest.request,
      category: prayerRequest.category as
        | "Health"
        | "Family"
        | "Salvation"
        | "Financial"
        | "Relationships"
        | "Spiritual Growth"
        | "Work/Career"
        | "Other"
        | null,
      isPrivate: prayerRequest.isPrivate,
      isUrgent: prayerRequest.isUrgent,
    },
  });

  /**
   * Handle form submission
   * Calls updatePrayerRequest server action and shows toast notifications
   */
  async function onSubmit(data: UpdatePrayerRequestSchemaType) {
    startTransition(async () => {
      try {
        const result = await updatePrayerRequest(slug, data);

        if (result.status === "success") {
          toast.success(result.message);
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Prayer Request Text */}
        <FormField
          control={form.control}
          name="request"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Prayer Request <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter the prayer request..."
                  className="min-h-[120px] resize-y"
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Update the prayer request text. The system will automatically
                re-categorize and detect sensitive keywords if the text changes
                significantly.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (Optional)</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "null" ? null : value)
                }
                value={field.value || "null"}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Auto-detect category</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Salvation">Salvation</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Relationships">Relationships</SelectItem>
                  <SelectItem value="Spiritual Growth">
                    Spiritual Growth
                  </SelectItem>
                  <SelectItem value="Work/Career">Work/Career</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Leave as &quot;Auto-detect&quot; to let the system categorize
                based on keywords, or manually select a category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Privacy & Urgency Checkboxes */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Private Request</FormLabel>
                  <FormDescription>
                    Only viewable by assigned prayer team members. The system
                    auto-detects sensitive keywords and marks requests as
                    private.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isUrgent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Urgent</FormLabel>
                  <FormDescription>
                    Requires immediate prayer attention (crisis situations).
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
