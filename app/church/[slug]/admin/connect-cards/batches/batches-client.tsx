"use client";

import { useState, useTransition, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  MapPin,
  Clock,
  FileText,
  Trash2,
  Loader2,
  Filter,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { deleteBatchAction } from "@/actions/connect-card/batch-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Batch {
  id: string;
  name: string;
  status: string;
  cardCount: number;
  locationId: string | null;
  location: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    cards: number;
  };
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface BatchesClientProps {
  batches: Batch[];
  slug: string;
  locations: Location[];
}

export function BatchesClient({
  batches,
  slug,
  locations,
}: BatchesClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

  // Filter batches by selected location
  const filteredBatches = useMemo(() => {
    if (selectedLocationId === "all") {
      return batches;
    }
    return batches.filter(batch => batch.locationId === selectedLocationId);
  }, [batches, selectedLocationId]);

  const handleDeleteClick = (batch: Batch) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return;

    startTransition(async () => {
      const result = await deleteBatchAction(slug, batchToDelete.id);

      if (result.status === "success") {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setBatchToDelete(null);
        router.refresh(); // Refresh to show updated batch list
      } else {
        toast.error(result.message);
      }
    });
  };

  // Get unique locations from batches to know if we should show filter
  const uniqueLocationIds = useMemo(() => {
    const ids = new Set(batches.map(b => b.locationId).filter(Boolean));
    return ids;
  }, [batches]);

  // Only show filter if there are multiple locations
  const showLocationFilter = uniqueLocationIds.size > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Connect Card Batches
          </h2>
          <p className="text-muted-foreground">
            Review and manage uploaded connect card batches
          </p>
        </div>

        {/* Campus Filter - only show if user has access to multiple locations */}
        {showLocationFilter && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
            >
              <SelectTrigger className="min-w-[180px] w-auto shrink-0">
                <SelectValue placeholder="All Campuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Batch list */}
      {filteredBatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedLocationId !== "all"
                ? "No batches for this campus"
                : "No batches yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {selectedLocationId !== "all" ? (
                <>
                  There are no connect card batches for the selected campus. Try
                  selecting a different campus or &quot;All Campuses&quot;.
                </>
              ) : (
                <>
                  Upload connect cards to create your first batch. Cards are
                  automatically grouped into batches for easy review.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBatches.map(batch => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      {batch.name}
                      {differenceInMinutes(
                        new Date(),
                        new Date(batch.updatedAt)
                      ) <= 5 && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {batch.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {batch.location.name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Last activity{" "}
                          {formatDistanceToNow(new Date(batch.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {batch._count.cards}{" "}
                        {batch._count.cards === 1 ? "card" : "cards"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link
                      href={`/church/${slug}/admin/connect-cards/review/${batch.id}`}
                    >
                      Review Cards
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(batch)}
                    disabled={isPending}
                  >
                    {isPending && batchToDelete?.id === batch.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
            <AlertDialogDescription>
              {batchToDelete && (
                <>
                  Are you sure you want to delete &quot;{batchToDelete.name}
                  &quot;?
                  <br />
                  <br />
                  {batchToDelete._count.cards > 0 ? (
                    <span className="text-destructive font-medium">
                      This will permanently delete {batchToDelete._count.cards}{" "}
                      card{batchToDelete._count.cards !== 1 ? "s" : ""} and
                      cannot be undone.
                    </span>
                  ) : (
                    <span>
                      This batch has no cards and can be safely deleted.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Batch"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
