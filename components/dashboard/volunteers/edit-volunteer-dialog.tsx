"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerSchema, type VolunteerSchemaType } from "@/lib/zodSchemas";
import { updateVolunteer } from "@/actions/volunteers/volunteers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useRouter } from "next/navigation";
import type { Volunteer } from "@/lib/generated/prisma";

/**
 * Edit Volunteer Dialog
 *
 * Modal dialog for editing volunteer profile with optimistic locking.
 *
 * Features:
 * - Pre-filled form with current volunteer data
 * - Optimistic locking via version field (prevents concurrent edit conflicts)
 * - Handles version mismatch errors with user-friendly message
 * - Status-conditional fields (end date, inactive reason)
 * - Background check conditional fields
 * - Form validation with Zod
 * - Toast notifications
 * - Auto-refresh on success
 *
 * Note: Does NOT allow changing church member or location
 * (those require separate transfer/reassignment actions)
 */

interface EditVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteer: Volunteer & {
    churchMember: {
      id: string;
      name: string | null;
    };
    categories?: Array<{ id: string; category: string }>;
  };
  slug: string;
}

export function EditVolunteerDialog({
  open,
  onOpenChange,
  volunteer,
  slug,
}: EditVolunteerDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Parse member name into first/last name for form (not editable in this dialog)
  const memberName = volunteer.churchMember.name || "";
  const nameParts = memberName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Form setup with pre-filled values
  const form = useForm<VolunteerSchemaType>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      // Member fields (not editable, just for form validation)
      firstName,
      lastName,
      email: "", // Not available in this context, edit dialog doesn't change member info
      phone: null,
      organizationId: volunteer.organizationId,
      locationId: volunteer.locationId,
      status: volunteer.status,
      startDate: new Date(volunteer.startDate),
      endDate: volunteer.endDate ? new Date(volunteer.endDate) : null,
      inactiveReason: volunteer.inactiveReason,
      emergencyContactName: volunteer.emergencyContactName,
      emergencyContactPhone: volunteer.emergencyContactPhone,
      backgroundCheckStatus: volunteer.backgroundCheckStatus,
      backgroundCheckDate: volunteer.backgroundCheckDate
        ? new Date(volunteer.backgroundCheckDate)
        : null,
      backgroundCheckExpiry: volunteer.backgroundCheckExpiry
        ? new Date(volunteer.backgroundCheckExpiry)
        : null,
      notes: volunteer.notes,
      categories: (volunteer.categories?.map(c => c.category) ?? []) as VolunteerSchemaType["categories"],
    },
  });

  // Watch status field for conditional fields
  const selectedStatus = form.watch("status");
  const selectedBackgroundCheckStatus = form.watch("backgroundCheckStatus");

  // Form submission handler with optimistic locking
  async function onSubmit(data: VolunteerSchemaType) {
    startTransition(async () => {
      try {
        const result = await updateVolunteer(
          slug,
          volunteer.id,
          volunteer.version, // Optimistic locking - pass current version
          data
        );

        if (result.status === "success") {
          toast.success(result.message);
          onOpenChange(false);
          router.refresh(); // Refresh to show updated data
        } else {
          toast.error(result.message);
          // If version mismatch, user needs to refresh page to get latest data
          if (
            result.message.includes("updated by another user") ||
            result.message.includes("refresh")
          ) {
            // Show additional guidance
            toast.error(
              "Please close this dialog and refresh the page to see the latest changes.",
              { duration: 5000 }
            );
          }
        }
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Volunteer Profile</DialogTitle>
          <DialogDescription>
            Update volunteer information for{" "}
            {volunteer.churchMember.name || "this volunteer"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      className="min-h-[100px] resize-none"
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
