"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  MapPin,
  Calendar,
  FileText,
  Trash2,
  Loader2,
  FileDown,
  AlertTriangle,
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

export function BatchesClient({ batches, slug }: BatchesClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [exportWarningOpen, setExportWarningOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Count pending batches for export warning
  const pendingBatches = batches.filter(
    b => b.status === "PENDING" || b.status === "IN_REVIEW"
  );
  const pendingCardCount = pendingBatches.reduce(
    (sum, b) => sum + b._count.cards,
    0
  );

  const handleExportClick = () => {
    if (pendingBatches.length > 0) {
      setExportWarningOpen(true);
    } else {
      router.push(`/church/${slug}/admin/export`);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Connect Card Batches
          </h2>
          <p className="text-muted-foreground">
            Review and manage uploaded connect card batches
          </p>
        </div>
        <Button onClick={handleExportClick} className="gap-2">
          <FileDown className="h-4 w-4" />
          Export to ChMS
        </Button>
      </div>

      {/* Batch list */}
      {batches.length === 0 ? (
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
          {batches.map(batch => (
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

      {/* Export Warning Dialog */}
      <AlertDialog open={exportWarningOpen} onOpenChange={setExportWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pending Batches Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You have{" "}
                <strong>
                  {pendingBatches.length} batch
                  {pendingBatches.length !== 1 ? "es" : ""}
                </strong>{" "}
                with{" "}
                <strong>
                  {pendingCardCount} card{pendingCardCount !== 1 ? "s" : ""}
                </strong>{" "}
                still pending review.
              </p>
              <p>
                These cards won&apos;t be included in your export until
                they&apos;re reviewed and processed.
              </p>
              <p className="text-sm text-muted-foreground">
                You can export now with only the processed cards, or review the
                pending batches first.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setExportWarningOpen(false);
                // Navigate to pending batches or show them
                router.push(
                  `/church/${slug}/admin/connect-cards/batches?status=pending`
                );
              }}
            >
              Review Pending Batches
            </Button>
            <AlertDialogAction
              onClick={() => router.push(`/church/${slug}/admin/export`)}
            >
              Export Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
