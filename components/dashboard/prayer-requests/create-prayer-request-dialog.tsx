"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { CreatePrayerRequestForm } from "./create-prayer-request-form";

interface Location {
  id: string;
  name: string;
}

interface CreatePrayerRequestDialogProps {
  slug: string;
  locations: Location[];
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * Create Prayer Request Dialog Component
 *
 * Dialog wrapper for the create prayer request form.
 *
 * Features:
 * - Customizable trigger button (defaults to "+ New Prayer Request")
 * - Auto-closes on successful submission
 * - Cancellable with keyboard (Esc) or close button
 * - Responsive design
 * - Optional onSuccess callback for parent component refresh
 */
export function CreatePrayerRequestDialog({
  slug,
  locations,
  triggerButton,
  onSuccess,
}: CreatePrayerRequestDialogProps) {
  const [open, setOpen] = useState(false);

  // Handle successful form submission
  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.(); // Call parent's success handler if provided
  };

  // Handle cancel button click
  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            New Prayer Request
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Prayer Request</DialogTitle>
          <DialogDescription>
            Create a new prayer request manually. The system will automatically
            categorize and detect sensitive requests based on keywords.
          </DialogDescription>
        </DialogHeader>
        <CreatePrayerRequestForm
          slug={slug}
          locations={locations}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
