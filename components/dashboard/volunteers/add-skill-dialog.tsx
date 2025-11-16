"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerSkillSchema } from "@/lib/zodSchemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { IconCalendar, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { addVolunteerSkill } from "@/actions/volunteers/skills";

/**
 * Add Skill Dialog Component
 *
 * Dialog for adding new skills to a volunteer profile.
 *
 * Features:
 * - Skill name input (required)
 * - Proficiency level selection (optional)
 * - Verification checkbox with conditional date pickers
 * - Expiry date for time-limited certifications
 * - Notes field for additional information
 * - Form validation with Zod
 * - Loading states and error handling
 */

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerId: string;
  slug: string;
  onSuccess?: () => void;
}

export function AddSkillDialog({
  open,
  onOpenChange,
  volunteerId,
  slug,
  onSuccess,
}: AddSkillDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Form setup with Zod validation
  const form = useForm({
    resolver: zodResolver(volunteerSkillSchema),
    defaultValues: {
      volunteerId,
      skillName: "",
      proficiency: null,
      isVerified: false,
      verifiedDate: null,
      expiryDate: null,
      notes: null,
    },
  });

  // Watch isVerified field to conditionally show date pickers
  const isVerified = form.watch("isVerified");

  // Form submission handler
  async function onSubmit(data: z.infer<typeof volunteerSkillSchema>) {
    startTransition(async () => {
      try {
        const result = await addVolunteerSkill(slug, data);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Skill or Certification</DialogTitle>
          <DialogDescription>
            Add a new skill, qualification, or certification to this
            volunteer&apos;s profile.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Skill Name */}
            <FormField
              control={form.control}
              name="skillName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., First Aid Certified, Sound Engineering, Childcare"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the skill, qualification, or certification name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Proficiency Level */}
            <FormField
              control={form.control}
              name="proficiency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proficiency Level</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(value || null)}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proficiency level (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        None / Not Applicable
                      </SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional proficiency or experience level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Verified Checkbox */}
            <FormField
              control={form.control}
              name="isVerified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Verified or Certified</FormLabel>
                    <FormDescription>
                      Check if this skill has been officially verified or
                      certified
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Verification Date (conditional) */}
            {isVerified && (
              <FormField
                control={form.control}
                name="verifiedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Verification Date</FormLabel>
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
                          disabled={(date: Date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When was this skill verified or certified?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Expiry Date (conditional) */}
            {isVerified && (
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date</FormLabel>
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
                              <span>Pick a date (optional)</span>
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
                          disabled={(date: Date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When does this certification expire? (if applicable)
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
                      placeholder="Additional notes about this skill..."
                      className="resize-none min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about this skill or certification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <DialogFooter>
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
                {isPending ? "Adding..." : "Add Skill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
