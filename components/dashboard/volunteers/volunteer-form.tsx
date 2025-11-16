"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerSchema, type VolunteerSchemaType } from "@/lib/zodSchemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { IconCalendar, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createVolunteer } from "@/actions/volunteers/volunteers";

interface ChurchMember {
  id: string;
  name: string;
  email: string | null;
}

interface Location {
  id: string;
  name: string;
}

interface VolunteerFormProps {
  slug: string;
  organizationId: string;
  members: ChurchMember[];
  locations: Location[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Volunteer Form Component
 *
 * Form for creating a new volunteer profile from an existing church member.
 *
 * Features:
 * - Church member dropdown selection
 * - Status selection (Active, On Break, Inactive, Pending)
 * - Date pickers (start date, end date, background check dates)
 * - Emergency contact fields
 * - Background check status tracking
 * - Optional notes field
 * - Form validation with Zod
 * - Loading states and error handling
 * - Toast notifications
 */
export function VolunteerForm({
  slug,
  organizationId,
  members,
  locations,
  onSuccess,
  onCancel,
}: VolunteerFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form setup with Zod validation
  const form = useForm<VolunteerSchemaType>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      churchMemberId: "",
      organizationId,
      locationId: locations.length === 1 ? locations[0].id : null,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: null,
      inactiveReason: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      backgroundCheckStatus: "NOT_STARTED",
      backgroundCheckDate: null,
      backgroundCheckExpiry: null,
      notes: null,
    },
  });

  // Watch status field to conditionally show fields
  const selectedStatus = form.watch("status");
  const selectedBackgroundCheckStatus = form.watch("backgroundCheckStatus");

  // Form submission handler
  async function onSubmit(data: VolunteerSchemaType) {
    startTransition(async () => {
      try {
        // Convert "none" to null for locationId since Radix Select doesn't allow empty string values
        const processedData = {
          ...data,
          locationId: data.locationId === "none" ? null : data.locationId,
        };
        const result = await createVolunteer(slug, processedData);

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
        {/* Church Member Selection */}
        <FormField
          control={form.control}
          name="churchMemberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Church Member *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a church member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                      {member.email && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({member.email})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the church member to create a volunteer profile for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    <SelectItem value="none">No specific campus</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Assign volunteer to a specific campus (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Status Selection */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_BREAK">On Break</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">
                    Pending Approval
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When did this volunteer start serving?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date (conditional - show if INACTIVE) */}
        {selectedStatus === "INACTIVE" && (
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date: Date | undefined) =>
                        field.onChange(date || null)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When did this volunteer stop serving?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Inactive Reason (conditional) */}
        {selectedStatus === "INACTIVE" && (
          <FormField
            control={form.control}
            name="inactiveReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Inactivity</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain why this volunteer is inactive..."
                    className="resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Emergency Contact Name */}
        <FormField
          control={form.control}
          name="emergencyContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Name of person to contact in case of emergency
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Emergency Contact Phone */}
        <FormField
          control={form.control}
          name="emergencyContactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Phone number in E.164 format (e.g., +1234567890)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Background Check Status */}
        <FormField
          control={form.control}
          name="backgroundCheckStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background Check Status *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="CLEARED">Cleared</SelectItem>
                  <SelectItem value="FLAGGED">Flagged</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Background Check Date (conditional) */}
        {(selectedBackgroundCheckStatus === "CLEARED" ||
          selectedBackgroundCheckStatus === "FLAGGED") && (
          <FormField
            control={form.control}
            name="backgroundCheckDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Background Check Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date: Date | undefined) =>
                        field.onChange(date || null)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When was the background check completed?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Background Check Expiry (conditional) */}
        {selectedBackgroundCheckStatus === "CLEARED" && (
          <FormField
            control={form.control}
            name="backgroundCheckExpiry"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Background Check Expiry</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date: Date | undefined) =>
                        field.onChange(date || null)
                      }
                      initialFocus
                      disabled={(date: Date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When does the background check expire?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this volunteer..."
                  className="resize-none min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Internal notes about this volunteer (max 1000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
            {isPending ? "Creating..." : "Create Volunteer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
