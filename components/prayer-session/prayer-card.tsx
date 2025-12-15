"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Lock,
  Check,
  CheckCircle2,
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
 * A compact, devotional-focused card for displaying individual prayer requests.
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

  // Get display name - always hide for private prayers
  const displayName = prayer.isPrivate ? null : prayer.submittedBy;

  return (
    <Card
      className={cn(
        "py-2 gap-0 transition-all print:shadow-none print:border print:break-inside-avoid",
        isAnswered && "opacity-50",
        isCritical && !isAnswered && "border-red-500/30"
      )}
    >
      <CardContent className="px-4">
        {/* Header: Name, Date, and Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Submitter name or Anonymous */}
            <span className="font-medium text-sm truncate">
              {displayName || (
                <span className="text-muted-foreground italic flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Anonymous
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(prayer.createdAt), "MMM d")}
            </span>
          </div>

          {/* Badges - minimal and subtle */}
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end print:hidden">
            {isCritical && (
              <Badge
                variant="destructive"
                className="gap-0.5 text-[10px] px-1.5 py-0 h-5 font-medium"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                Critical
              </Badge>
            )}
            {prayer.isUrgent && !isCritical && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 font-medium text-amber-600 border-amber-600/30"
              >
                Urgent
              </Badge>
            )}
            {/* Category badge - subtle outline */}
            {prayer.category && !isCritical && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground"
              >
                {prayer.category === "Other" ? "General" : prayer.category}
              </Badge>
            )}
            {isAnswered && (
              <Badge
                variant="outline"
                className="gap-0.5 text-[10px] px-1.5 py-0 h-5 font-medium text-green-600 border-green-600/30"
              >
                <Check className="h-2.5 w-2.5" />
                Answered
              </Badge>
            )}
          </div>

          {/* Print-only badges */}
          <div className="hidden print:flex items-center gap-1 flex-shrink-0">
            {isCritical && (
              <span className="text-[10px] font-bold text-red-600 border border-red-300 px-1 py-0 rounded">
                CRITICAL
              </span>
            )}
            {prayer.isPrivate && (
              <span className="text-[10px] font-bold text-slate-600 border border-slate-300 px-1 py-0 rounded">
                PRIVATE
              </span>
            )}
          </div>
        </div>

        {/* Prayer request text */}
        <div
          className={cn(
            "text-sm leading-relaxed",
            isAnswered && "line-through decoration-green-500"
          )}
        >
          {prayer.request}
        </div>

        {/* Actions - CTA button right-aligned */}
        {showActions && !isAnswered && (
          <div className="mt-2 flex justify-end print:hidden">
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAnswered}
              disabled={isLoading}
              className="gap-1.5 h-7 px-3 text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Mark Answered
                </>
              )}
            </Button>
          </div>
        )}

        {/* Answered indicator - more compact */}
        {isAnswered && (
          <div className="mt-2 flex items-center gap-1.5 text-green-600 print:hidden">
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Answered</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
