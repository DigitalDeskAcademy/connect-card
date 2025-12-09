"use client";

import { useState, useTransition } from "react";
import { processVolunteer } from "@/actions/volunteers/volunteers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconLoader2, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { volunteerCategoryTypes } from "@/lib/zodSchemas";
import { formatVolunteerCategoryLabel } from "@/lib/types/connect-card";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Process Volunteer Dialog
 *
 * Modal dialog for processing pending volunteers (PENDING → ACTIVE).
 *
 * Features:
 * - Displays volunteer info (name, email, phone) as read-only
 * - Multi-select combobox for ministry category assignment (OR logic)
 * - Optional background check status update
 * - Calls processVolunteer() server action
 * - Toast notifications
 * - Auto-refresh on success
 *
 * Used in Pending Volunteers tab for onboarding workflow.
 */

interface ProcessVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteer: {
    id: string;
    churchMember: {
      name: string;
      email: string | null;
      phone: string | null;
    } | null;
  };
  slug: string;
}

export function ProcessVolunteerDialog({
  open,
  onOpenChange,
  volunteer,
  slug,
}: ProcessVolunteerDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [backgroundCheckStatus, setBackgroundCheckStatus] = useState<
    string | undefined
  >(undefined);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  // Toggle category selection (multi-select with OR logic)
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle form submission
  const handleProcess = () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one ministry category");
      return;
    }

    startTransition(async () => {
      try {
        const result = await processVolunteer(
          slug,
          volunteer.id,
          selectedCategories,
          backgroundCheckStatus
        );

        if (result.status === "success") {
          toast.success(result.message);
          onOpenChange(false);
          router.refresh(); // Refresh to show updated data
          // Reset form state
          setSelectedCategories([]);
          setBackgroundCheckStatus(undefined);
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Volunteer</DialogTitle>
          <DialogDescription>
            Assign ministry categories and activate this volunteer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Volunteer Information (Read-Only) */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Volunteer Information
            </h3>
            <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium">
                  {volunteer.churchMember?.name || "No name"}
                </p>
              </div>
              {volunteer.churchMember?.email && (
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm">{volunteer.churchMember.email}</p>
                </div>
              )}
              {volunteer.churchMember?.phone && (
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm">{volunteer.churchMember.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ministry Categories (Multi-Select) */}
          <div className="space-y-2">
            <Label>Ministry Categories *</Label>
            <Popover
              open={categoryPopoverOpen}
              onOpenChange={setCategoryPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryPopoverOpen}
                  className="w-full justify-between"
                >
                  {selectedCategories.length === 0 ? (
                    <span className="text-muted-foreground">
                      Select ministry categories...
                    </span>
                  ) : (
                    <span className="text-sm">
                      {selectedCategories.length} selected
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      {volunteerCategoryTypes.map(category => (
                        <CommandItem
                          key={category}
                          onSelect={() => toggleCategory(category)}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedCategories.includes(category)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <IconCheck className="h-3 w-3" />
                          </div>
                          {formatVolunteerCategoryLabel(category)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Select one or more ministry areas for this volunteer
            </p>
            {/* Selected Categories Display */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedCategories.map(category => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {formatVolunteerCategoryLabel(category)}
                    <span className="ml-1 text-xs">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Background Check Status (Optional) */}
          <div className="space-y-2">
            <Label>Background Check Status (Optional)</Label>
            <Select
              value={backgroundCheckStatus}
              onValueChange={setBackgroundCheckStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="CLEARED">Cleared</SelectItem>
                <SelectItem value="FLAGGED">Flagged</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Update background check status if available
            </p>
          </div>
        </div>

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
          <Button onClick={handleProcess} disabled={isPending}>
            {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Processing..." : "Process Volunteer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
