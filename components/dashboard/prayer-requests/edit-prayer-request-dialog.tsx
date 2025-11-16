"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditPrayerRequestForm } from "./edit-prayer-request-form";
import type { PrayerRequestListItem } from "@/lib/types/prayer-request";

interface EditPrayerRequestDialogProps {
  slug: string;
  prayerRequest: PrayerRequestListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Edit Prayer Request Dialog
 *
 * Dialog wrapper for editing existing prayer requests.
 * Pre-populates form with current prayer request data.
 */
export function EditPrayerRequestDialog({
  slug,
  prayerRequest,
  open,
  onOpenChange,
  onSuccess,
}: EditPrayerRequestDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Prayer Request</DialogTitle>
          <DialogDescription>
            Update the prayer request details. The system will automatically
            re-categorize and detect sensitive keywords if the text changes.
          </DialogDescription>
        </DialogHeader>
        <EditPrayerRequestForm
          slug={slug}
          prayerRequest={prayerRequest}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
