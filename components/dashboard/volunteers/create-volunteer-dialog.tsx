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
import { VolunteerForm } from "./volunteer-form";

interface Location {
  id: string;
  name: string;
}

interface CreateVolunteerDialogProps {
  slug: string;
  organizationId: string;
  locations: Location[];
  onSuccess?: () => void;
}

/**
 * Create Volunteer Dialog Component
 *
 * Dialog wrapper for the volunteer creation form with inline member creation.
 *
 * Features:
 * - Button trigger with plus icon
 * - Responsive dialog with scrollable content
 * - Inline member creation (automatically creates or links to existing member)
 * - Automatic close on successful creation
 * - Refresh parent table on success
 */
export function CreateVolunteerDialog({
  slug,
  organizationId,
  locations,
  onSuccess,
}: CreateVolunteerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          New Volunteer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Volunteer Profile</DialogTitle>
          <DialogDescription>
            Add a new volunteer profile. If the member doesn&apos;t exist in the
            system, a new member will be created automatically.
          </DialogDescription>
        </DialogHeader>
        <VolunteerForm
          slug={slug}
          organizationId={organizationId}
          locations={locations}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
