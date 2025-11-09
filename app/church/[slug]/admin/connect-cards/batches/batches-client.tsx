"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  MapPin,
  Calendar,
  FileText,
  Trash2,
  Loader2,
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
import { formatDistanceToNow } from "date-fns";
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
  _count: {
    cards: number;
  };
}

interface BatchesClientProps {
  batches: Batch[];
  slug: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary">Pending Review</Badge>;
    case "IN_REVIEW":
      return <Badge variant="default">In Review</Badge>;
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Completed
        </Badge>
      );
    case "ARCHIVED":
      return <Badge variant="outline">Archived</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function BatchesClient({ batches, slug }: BatchesClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [isPending, startTransition] = useTransition();

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

  // Filter batches by status
  const filteredBatches = batches.filter(batch => {
    if (filter === "all") return true;
    if (filter === "pending")
      return batch.status === "PENDING" || batch.status === "IN_REVIEW";
    if (filter === "completed") return batch.status === "COMPLETED";
    return true;
  });

  const pendingCount = batches.filter(
    b => b.status === "PENDING" || b.status === "IN_REVIEW"
  ).length;
  const completedCount = batches.filter(b => b.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Connect Card Batches
          </h2>
          <p className="text-muted-foreground">
            Review and manage uploaded connect card batches
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({batches.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed ({completedCount})
          </Button>
        </div>
      </div>

      {/* Batch list */}
      {filteredBatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No batches yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Upload connect cards to create your first batch. Cards are
              automatically grouped into batches for easy review.
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
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {batch.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {batch.location.name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(batch.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {batch._count.cards}{" "}
                        {batch._count.cards === 1 ? "card" : "cards"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(batch.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link
                      href={
                        batch.status === "COMPLETED"
                          ? `/church/${slug}/admin/connect-cards/batches/${batch.id}`
                          : `/church/${slug}/admin/connect-cards/review/${batch.id}`
                      }
                    >
                      {batch.status === "COMPLETED"
                        ? "View Batch"
                        : "Review Cards"}
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
