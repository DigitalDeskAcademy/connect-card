"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";

import {
  eventSchema,
  volunteerCategoryTypes,
  type EventSchemaInput,
} from "@/lib/zodSchemas";
import { ALL_EVENT_TYPES } from "@/lib/event-types";
import { createEvent } from "@/actions/events/events";

interface Location {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  /** @deprecated Kept for API compatibility, will be used when server action is implemented */
  organizationId?: string;
  locations: Location[];
  teamMembers: TeamMember[];
}

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  KIDS_MINISTRY: "Kids Ministry",
  WORSHIP: "Worship",
  HOSPITALITY: "Hospitality",
  PARKING: "Parking",
  PRODUCTION: "Production (AV/Tech)",
  PRAYER: "Prayer",
  OUTREACH: "Outreach",
  GROUPS: "Small Groups",
  CARE: "Care/Pastoral",
};

// =============================================================================
// Component
// =============================================================================

/**
 * Event Form Dialog
 *
 * Dialog for creating new volunteer events.
 *
 * Features:
 * - Multi-step form with validation
 * - Dynamic session management (add/remove)
 * - Leader and location selection
 * - Background check requirement toggle
 * - Custom messaging for invites and confirmations
 */
export function EventFormDialog({
  open,
  onOpenChange,
  slug,
  locations,
  teamMembers,
}: EventFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup with default values
  // Use EventSchemaInput for form (input type before Zod parsing)
  const form = useForm<EventSchemaInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      eventType: "SUNDAY_SERVICE",
      locationId: null,
      category: null,
      leaderId: "",
      requiresBackgroundCheck: false,
      volunteerPoolScope: "location",
      inviteMessage: null,
      confirmationMessage: null,
      sessions: [
        {
          date: new Date(),
          startTime: "09:00",
          endTime: "12:00",
          slotsNeeded: 5,
        },
      ],
    },
  });

  // Dynamic sessions array
  const {
    fields: sessionFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "sessions",
  });

  // Form submission (data is already validated by Zod resolver)
  const onSubmit = async (data: EventSchemaInput) => {
    setIsSubmitting(true);

    try {
      const result = await createEvent(slug, data);

      if (result.status === "success") {
        toast.success(result.message);
        onOpenChange(false);
        form.reset();
        router.refresh();

        // Optionally navigate to the new event
        if (result.data?.eventId) {
          router.push(
            `/church/${slug}/admin/volunteer/events/${result.data.eventId}`
          );
        }
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new session
  const addSession = () => {
    const lastSession = sessionFields[sessionFields.length - 1];
    append({
      date: lastSession ? new Date(lastSession.date) : new Date(),
      startTime: lastSession?.startTime || "09:00",
      endTime: lastSession?.endTime || "12:00",
      slotsNeeded: lastSession?.slotsNeeded || 5,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Set up a volunteer event with sessions and capacity requirements.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sunday Kids Check-in" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the event..."
                        className="resize-none"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_EVENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used for filtering and organizing events
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
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
                  name="leaderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Leader *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leader" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamMembers.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volunteer Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {volunteerCategoryTypes.map(category => (
                          <SelectItem key={category} value={category}>
                            {CATEGORY_LABELS[category] || category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Filter volunteers by their ministry category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Requirements */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Requirements
              </h3>

              <FormField
                control={form.control}
                name="requiresBackgroundCheck"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requires Background Check</FormLabel>
                      <FormDescription>
                        Only invite volunteers with cleared background checks
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="volunteerPoolScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volunteer Pool</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="location">
                          Same location only
                        </SelectItem>
                        <SelectItem value="all">All locations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Which volunteers can be invited to this event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Sessions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Sessions
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSession}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Session
                </Button>
              </div>

              <div className="space-y-3">
                {sessionFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <FormField
                            control={form.control}
                            name={`sessions.${index}.date`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Date</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    value={
                                      field.value
                                        ? format(
                                            new Date(field.value),
                                            "yyyy-MM-dd"
                                          )
                                        : ""
                                    }
                                    onChange={e =>
                                      field.onChange(new Date(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`sessions.${index}.startTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Start</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`sessions.${index}.endTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">End</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`sessions.${index}.slotsNeeded`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Volunteers Needed
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    {...field}
                                    onChange={e =>
                                      field.onChange(
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {sessionFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-6 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {form.formState.errors.sessions?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.sessions.root.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Submit Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
