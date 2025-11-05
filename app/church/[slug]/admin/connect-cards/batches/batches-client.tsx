"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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
  const [filter, setFilter] = useState<string>("all");

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
                      href={`/church/${slug}/admin/connect-cards/batches/${batch.id}`}
                    >
                      {batch.status === "COMPLETED"
                        ? "View Batch"
                        : "Review Cards"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
