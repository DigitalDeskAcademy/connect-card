"use client";

import { X, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProcessingItem,
  ProcessingStatus,
} from "@/hooks/use-async-card-processor";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ProcessingItem[];
  onRetry: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

/**
 * Queue Drawer - slides up from bottom to show all cards with status
 * Provides Retry/Remove actions for failed cards
 */
export function QueueDrawer({
  isOpen,
  onClose,
  items,
  onRetry,
  onRemove,
}: QueueDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full bg-background rounded-t-xl shadow-lg max-h-[60vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Processing Queue</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Card list */}
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No cards in queue
              </p>
            ) : (
              items.map((item, index) => (
                <QueueItem
                  key={item.id}
                  item={item}
                  index={index}
                  onRetry={onRetry}
                  onRemove={onRemove}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface QueueItemProps {
  item: ProcessingItem;
  index: number;
  onRetry: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

function QueueItem({ item, index, onRetry, onRemove }: QueueItemProps) {
  const statusConfig = getStatusConfig(item.status);

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <span className={cn("text-lg", statusConfig.colorClass)}>
          {statusConfig.icon}
        </span>

        {/* Card info */}
        <div>
          <span className="font-medium">Card #{index + 1}</span>
          <p className="text-xs text-muted-foreground">
            {statusConfig.label}
            {item.error && item.status === "failed" && (
              <span className="block text-destructive">{item.error}</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions for failed cards */}
      {item.status === "failed" && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onRetry(item.id)}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      )}

      {/* Progress indicator for processing items */}
      {["uploading", "creating", "extracting"].includes(item.status) && (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
    </div>
  );
}

function getStatusConfig(status: ProcessingStatus): {
  icon: string;
  label: string;
  colorClass: string;
} {
  switch (status) {
    case "complete":
      return { icon: "✓", label: "Complete", colorClass: "text-green-600" };
    case "failed":
      return { icon: "❌", label: "Failed", colorClass: "text-destructive" };
    case "duplicate":
      return { icon: "⚠️", label: "Duplicate", colorClass: "text-yellow-600" };
    case "queued":
      return {
        icon: "⏳",
        label: "Queued",
        colorClass: "text-muted-foreground",
      };
    case "uploading":
      return { icon: "🔄", label: "Uploading...", colorClass: "text-primary" };
    case "creating":
      return { icon: "🔄", label: "Creating...", colorClass: "text-primary" };
    case "extracting":
      return { icon: "🔄", label: "Extracting...", colorClass: "text-primary" };
    default:
      return { icon: "?", label: status, colorClass: "text-muted-foreground" };
  }
}
