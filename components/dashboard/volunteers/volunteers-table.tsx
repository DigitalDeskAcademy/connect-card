"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VolunteerDataTable } from "./data-table";
import { getVolunteerColumns } from "./columns";
import type { VolunteerWithRelations } from "./volunteers-client";
import { deleteVolunteer } from "@/actions/volunteers/volunteers";

interface Location {
  id: string;
  name: string;
}

interface VolunteersTableProps {
  volunteers: VolunteerWithRelations[];
  slug: string;
  organizationId: string;
  locations: Location[];
  activeTab: string;
  canDelete: boolean;
}

/**
 * Volunteers Table Component
 *
 * Displays volunteer directory with TanStack Table.
 *
 * Features:
 * - Two-tab navigation: "All Volunteers" / "Pending Volunteers"
 * - Sortable columns (name, phone, categories)
 * - Checkbox selection for bulk operations
 * - Search filtering (volunteer name, email)
 * - Category filtering (OR logic)
 * - Pagination (10 items per page)
 * - Empty state for no volunteers
 * - Integrated create volunteer button
 * - Process volunteer dialog (pending tab only)
 * - Actions menu (3-dot) with View Profile and Delete (admin only)
 * - Delete confirmation dialog with volunteer name display
 *
 * Architecture:
 * - columns.tsx: Column definitions with checkbox selection and actions menu
 * - data-table.tsx: VolunteerDataTable component (based on prayer table pattern)
 * - volunteers-table.tsx: Wrapper component with delete confirmation dialog (this file)
 */
export function VolunteersTable({
  volunteers,
  slug,
  organizationId,
  locations,
  activeTab,
  canDelete,
}: VolunteersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Open delete confirmation dialog
  const handleDelete = (id: string) => {
    const volunteer = volunteers.find(v => v.id === id);
    if (volunteer) {
      setVolunteerToDelete({
        id,
        name: volunteer.churchMember?.name || "Unknown",
      });
      setIsDeleteDialogOpen(true);
    }
  };

  // Confirm and execute delete
  const handleDeleteConfirm = () => {
    if (!volunteerToDelete) return;

    startTransition(async () => {
      const result = await deleteVolunteer(slug, volunteerToDelete.id);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        setIsDeleteDialogOpen(false);
        setVolunteerToDelete(null);
      } else {
        toast.error(result.message);
      }
    });
  };

  const columns = getVolunteerColumns({
    slug,
    canDelete,
    onDelete: handleDelete,
  });

  return (
    <>
      <VolunteerDataTable
        columns={columns}
        data={volunteers}
        title="Volunteer Directory"
        pageSize={10}
        slug={slug}
        organizationId={organizationId}
        locations={locations}
        activeTab={activeTab}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Volunteer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {volunteerToDelete?.name}? This
              action cannot be undone and will permanently remove their
              volunteer profile and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Volunteer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
