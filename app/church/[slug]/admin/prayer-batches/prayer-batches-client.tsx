"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Calendar, FileText, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface PrayerBatch {
  id: string;
  name: string;
  batchDate: Date;
  status: string;
  prayerCount: number;
  locationId: string | null;
  location: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: Date;
  _count: {
    prayerRequests: number;
  };
}

interface PrayerBatchesClientProps {
  batches: PrayerBatch[];
  slug: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary">Pending Assignment</Badge>;
    case "IN_REVIEW":
      return <Badge variant="default">Assigned</Badge>;
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

export function PrayerBatchesClient({
  batches,
  slug,
}: PrayerBatchesClientProps) {
  const [filter, setFilter] = useState<string>("all");

  // Filter batches by status
  const filteredBatches = batches.filter(batch => {
    if (filter === "all") return true;
    if (filter === "pending") return batch.status === "PENDING";
    if (filter === "assigned")
      return batch.status === "IN_REVIEW" || batch.assignedTo !== null;
    if (filter === "completed") return batch.status === "COMPLETED";
    return true;
  });

  const pendingCount = batches.filter(b => b.status === "PENDING").length;
  const assignedCount = batches.filter(
    b => b.status === "IN_REVIEW" || b.assignedTo !== null
  ).length;
  const completedCount = batches.filter(b => b.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prayer Batches</h2>
          <p className="text-muted-foreground">
            Daily batches of prayer requests for prayer team assignment
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
            variant={filter === "assigned" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("assigned")}
          >
            Assigned ({assignedCount})
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
            <h3 className="text-lg font-semibold mb-2">
              No prayer batches yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Prayer batches are automatically created daily when connect cards
              with prayer requests are submitted. Check back after processing
              some connect cards.
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
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(batch.batchDate), "MMM d, yyyy")}
                      </div>
                      {batch.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {batch.location.name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {batch._count.prayerRequests}{" "}
                        {batch._count.prayerRequests === 1
                          ? "prayer"
                          : "prayers"}
                      </div>
                      {batch.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {batch.assignedTo.name || batch.assignedTo.email}
                        </div>
                      )}
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
                      href={`/church/${slug}/admin/prayer-batches/${batch.id}`}
                    >
                      {batch.assignedTo ? "View Batch" : "Assign Prayers"}
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
