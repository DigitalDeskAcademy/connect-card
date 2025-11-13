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

interface ChurchMember {
  id: string;
  name: string;
  email: string | null;
}

interface Location {
  id: string;
  name: string;
}

interface CreateVolunteerDialogProps {
  slug: string;
  organizationId: string;
  members: ChurchMember[];
  locations: Location[];
  onSuccess?: () => void;
}

/**
 * Create Volunteer Dialog Component
 *
 * Dialog wrapper for the volunteer creation form.
 *
 * Features:
 * - Button trigger with plus icon
 * - Responsive dialog with scrollable content
 * - Automatic close on successful creation
 * - Refresh parent table on success
 */
export function CreateVolunteerDialog({
  slug,
  organizationId,
  members,
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
            Add a new volunteer profile for an existing church member. Fill in
            the details below to get started.
          </DialogDescription>
        </DialogHeader>
        <VolunteerForm
          slug={slug}
          organizationId={organizationId}
          members={members}
          locations={locations}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
