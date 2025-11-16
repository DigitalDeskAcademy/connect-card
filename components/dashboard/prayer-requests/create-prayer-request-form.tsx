"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPrayerRequestSchema,
  type CreatePrayerRequestSchemaType,
  prayerCategories,
} from "@/lib/zodSchemas";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { createPrayerRequest } from "@/actions/prayer-requests/create-prayer-request";

interface Location {
  id: string;
  name: string;
}

interface CreatePrayerRequestFormProps {
  slug: string;
  locations: Location[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Create Prayer Request Form Component
 *
 * Form for manually creating a new prayer request.
 *
 * Features:
 * - Prayer request text input (required)
 * - Category selection (optional - auto-detected if not provided)
 * - Privacy checkbox (optional - auto-detected based on sensitive keywords)
 * - Urgency checkbox (optional)
 * - Location selection (optional for multi-campus)
 * - Submitter information (name, email, phone - optional)
 * - Form validation with Zod
 * - Loading states and error handling
 * - Toast notifications
 */
export function CreatePrayerRequestForm({
  slug,
  locations,
  onSuccess,
  onCancel,
}: CreatePrayerRequestFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form setup with Zod validation
  const form = useForm({
    resolver: zodResolver(createPrayerRequestSchema),
    defaultValues: {
      request: "",
      category: null,
      isPrivate: false,
      isUrgent: false,
      locationId: locations.length === 1 ? locations[0].id : null,
      submittedBy: null,
      submitterEmail: null,
      submitterPhone: null,
    },
  });

  // Form submission handler
  async function onSubmit(data: CreatePrayerRequestSchemaType) {
    startTransition(async () => {
      try {
        const result = await createPrayerRequest(slug, data);

        if (result.status === "success") {
          toast.success(result.message);
          form.reset();
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
              <FormLabel>Prayer Request *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please pray for..."
                  className="resize-none min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the prayer request (max 2000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Selection (Optional) */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={value => field.onChange(value || null)}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Auto-detect</SelectItem>
                  {prayerCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Leave blank to auto-detect based on keywords
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Privacy and Urgency Checkboxes */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Private Request</FormLabel>
                  <FormDescription>
                    Only visible to admins and assigned staff
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
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Urgent</FormLabel>
                  <FormDescription>
                    Requires immediate attention
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Location Selection (if multi-campus) */}
        {locations.length > 1 && (
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campus Location</FormLabel>
                <Select
                  onValueChange={value => field.onChange(value || null)}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campus (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No specific campus</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Assign to a specific campus (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Submitter Information (Optional) */}
        <div className="space-y-4">
          <div className="text-sm font-medium">
            Submitter Information (Optional)
          </div>

          <FormField
            control={form.control}
            name="submittedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submitted By</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Name of person submitting the prayer request
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="submitterEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>Email for follow-up</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="submitterPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>Phone number for follow-up</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create Prayer Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
