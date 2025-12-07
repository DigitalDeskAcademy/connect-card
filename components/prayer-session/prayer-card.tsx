"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Lock,
  MapPin,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isCriticalPrayer } from "@/lib/utils/prayer-priority";
import { format } from "date-fns";

export interface PrayerCardData {
  id: string;
  request: string;
  category: string | null;
  status: string;
  isPrivate: boolean;
  isUrgent: boolean;
  submittedBy: string | null;
  locationName: string | null;
  createdAt: Date;
}

interface PrayerCardProps {
  prayer: PrayerCardData;
  onMarkAnswered?: (prayerId: string) => Promise<void>;
  showActions?: boolean;
}

/**
 * Prayer Card Component
 *
 * A clean, devotional-focused card for displaying individual prayer requests.
 * Designed for readability during prayer sessions, both digital and print.
 */
export function PrayerCard({
  prayer,
  onMarkAnswered,
  showActions = true,
}: PrayerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isCritical = !prayer.isPrivate && isCriticalPrayer(prayer.request);
  const isAnswered = prayer.status === "ANSWERED";

  const handleMarkAnswered = async () => {
    if (!onMarkAnswered) return;
    setIsLoading(true);
    try {
      await onMarkAnswered(prayer.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all print:shadow-none print:border print:break-inside-avoid",
        isAnswered && "opacity-60 bg-muted/30",
        isCritical &&
          !isAnswered &&
          "border-red-200 bg-red-50/50 dark:bg-red-950/20",
        prayer.isPrivate &&
          !isAnswered &&
          "border-slate-300 bg-slate-50/50 dark:bg-slate-950/20"
      )}
    >
      <CardContent className="pt-4 pb-4">
        {/* Header: Name, Location, Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {/* Submitter name */}
            <div className="font-semibold text-base">
              {prayer.isPrivate && !prayer.submittedBy ? (
                <span className="text-muted-foreground italic flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Anonymous
                </span>
              ) : (
                prayer.submittedBy || (
                  <span className="text-muted-foreground">Unknown</span>
                )
              )}
            </div>

            {/* Location and date */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              {prayer.locationName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {prayer.locationName}
                </span>
              )}
              <span>{format(new Date(prayer.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden">
            {isCritical && (
              <Badge
                variant="destructive"
                className="gap-1 text-xs font-medium"
              >
                <AlertTriangle className="h-3 w-3" />
                Critical
              </Badge>
            )}
            {prayer.isPrivate && (
              <Badge variant="secondary" className="gap-1 text-xs font-medium">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
            {prayer.isUrgent && !isCritical && (
              <Badge
                variant="outline"
                className="gap-1 text-xs font-medium border-orange-300 text-orange-700 bg-orange-50"
              >
                <AlertTriangle className="h-3 w-3" />
                Urgent
              </Badge>
            )}
            {isAnswered && (
              <Badge
                variant="outline"
                className="gap-1 text-xs font-medium border-green-300 text-green-700 bg-green-50"
              >
                <Sparkles className="h-3 w-3" />
                Answered
              </Badge>
            )}
          </div>

          {/* Print-only badges */}
          <div className="hidden print:flex items-center gap-1.5 flex-shrink-0">
            {isCritical && (
              <span className="text-xs font-bold text-red-600 border border-red-300 px-1.5 py-0.5 rounded">
                CRITICAL
              </span>
            )}
            {prayer.isPrivate && (
              <span className="text-xs font-bold text-slate-600 border border-slate-300 px-1.5 py-0.5 rounded">
                PRIVATE
              </span>
            )}
          </div>
        </div>

        {/* Prayer request text */}
        <div
          className={cn(
            "text-base leading-relaxed",
            isAnswered && "line-through decoration-green-500"
          )}
        >
          {prayer.request}
        </div>

        {/* Category tag */}
        {prayer.category && (
          <div className="mt-3">
            <Badge variant="outline" className="text-xs">
              {prayer.category}
            </Badge>
          </div>
        )}

        {/* Actions */}
        {showActions && !isAnswered && (
          <div className="mt-4 flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAnswered}
              disabled={isLoading}
              className="gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Mark Answered
                </>
              )}
            </Button>
          </div>
        )}

        {/* Answered indicator */}
        {isAnswered && (
          <div className="mt-4 flex items-center gap-2 text-green-600 print:hidden">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Prayer Answered</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
