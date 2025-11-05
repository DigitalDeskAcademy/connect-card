"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { completeBatchAction } from "@/actions/connect-card/batch-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ConnectCard {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  prayerRequest: string | null;
  visitType: string | null;
  status: string;
  createdAt: Date;
}

interface Batch {
  id: string;
  name: string;
  status: string;
  cardCount: number;
  locationId: string | null;
  organizationId: string;
  location: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: Date;
  cards: ConnectCard[];
}

interface BatchDetailClientProps {
  slug: string;
  batch: Batch;
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
    default:
      return <Badge>{status}</Badge>;
  }
}

export function BatchDetailClient({ slug, batch }: BatchDetailClientProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  async function handleCompleteBatch() {
    setIsCompleting(true);
    const result = await completeBatchAction(slug, batch.id);

    if (result.status === "success") {
      toast.success("Batch marked as complete");
      router.refresh();
    } else {
      toast.error(result.message || "Failed to complete batch");
    }
    setIsCompleting(false);
  }

  const isCompleted = batch.status === "COMPLETED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href={`/church/${slug}/admin/connect-cards?tab=batches`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Batches
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
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
              {batch.cards.length} {batch.cards.length === 1 ? "card" : "cards"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(batch.status)}
          {!isCompleted && (
            <Button
              onClick={handleCompleteBatch}
              disabled={isCompleting}
              size="sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {batch.cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No cards in this batch
            </h3>
            <p className="text-sm text-muted-foreground">
              This batch doesn&apos;t contain any connect cards yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {batch.cards.map(card => (
            <Card key={card.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{card.name || "Unnamed Visitor"}</span>
                  <Badge variant="outline" className="font-normal">
                    {card.visitType || "Visitor"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {card.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{card.email}</p>
                    </div>
                  )}
                  {card.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{card.phone}</p>
                    </div>
                  )}
                  {card.address && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address:</span>
                      <p className="font-medium">{card.address}</p>
                    </div>
                  )}
                  {card.prayerRequest && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        Prayer Request:
                      </span>
                      <p className="font-medium">{card.prayerRequest}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
