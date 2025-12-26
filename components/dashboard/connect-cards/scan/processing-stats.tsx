"use client";

import { ProcessingStats } from "@/hooks/use-async-card-processor";
import { cn } from "@/lib/utils";

interface ProcessingStatsProps {
  stats: ProcessingStats;
  isProcessing: boolean;
  onClick?: () => void;
}

/**
 * Compact inline stats display for card processing
 * Shows: ✓8 🔄3 ❌1 format
 * Tappable to expand queue drawer
 */
export function ProcessingStatsDisplay({
  stats,
  isProcessing,
  onClick,
}: ProcessingStatsProps) {
  const { complete, processing, queued, failed } = stats;
  const totalProcessing = processing + queued;

  // Don't show anything if nothing to display
  if (stats.total === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 hover:bg-muted transition-colors text-sm font-medium"
      aria-label="View processing queue"
    >
      {/* Complete count - always show if > 0 */}
      {complete > 0 && (
        <span className="flex items-center gap-1 text-green-600">
          <span>✓</span>
          <span>{complete}</span>
        </span>
      )}

      {/* Processing count - show spinner animation while active */}
      {totalProcessing > 0 && (
        <span
          className={cn(
            "flex items-center gap-1 text-primary",
            isProcessing && "animate-pulse"
          )}
        >
          <span>🔄</span>
          <span>{totalProcessing}</span>
        </span>
      )}

      {/* Failed count - only show if > 0 */}
      {failed > 0 && (
        <span className="flex items-center gap-1 text-destructive">
          <span>❌</span>
          <span>{failed}</span>
        </span>
      )}
    </button>
  );
}
