"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Package, Trash2, ChevronDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { ResourceStatus } from "@/lib/generated/prisma";
import {
  addResource,
  addCommonResources,
  updateResourceStatus,
  deleteResource,
} from "@/actions/events/resources";
import { COMMON_RESOURCES } from "@/lib/constants/event-resources";

// =============================================================================
// Types
// =============================================================================

interface Resource {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  status: ResourceStatus;
  isCommon: boolean;
}

interface ResourcesSectionProps {
  eventId: string;
  resources: Resource[];
  slug: string;
  isEditable: boolean; // Only allow edits for DRAFT/PUBLISHED events
}

// =============================================================================
// Status Config
// =============================================================================

const STATUS_CONFIG: Record<
  ResourceStatus,
  { label: string; className: string; icon: string }
> = {
  NEEDED: {
    label: "Needed",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    icon: "!",
  },
  CONFIRMED: {
    label: "Confirmed",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    icon: "~",
  },
  READY: {
    label: "Ready",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    icon: "✓",
  },
};

const STATUS_ORDER: ResourceStatus[] = ["NEEDED", "CONFIRMED", "READY"];

// =============================================================================
// Add Resource Dialog
// =============================================================================

function AddResourceDialog({
  eventId,
  slug,
  onSuccess,
}: {
  eventId: string;
  slug: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"common" | "custom">("common");
  const [selectedCommon, setSelectedCommon] = useState<
    { name: string; quantity: number }[]
  >([]);
  const [customName, setCustomName] = useState("");
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customNotes, setCustomNotes] = useState("");

  const handleAddCommon = () => {
    if (selectedCommon.length === 0) {
      toast.error("Select at least one resource");
      return;
    }

    startTransition(async () => {
      const result = await addCommonResources(slug, {
        eventId,
        resources: selectedCommon,
      });

      if (result.status === "success") {
        toast.success(result.message);
        setOpen(false);
        setSelectedCommon([]);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleAddCustom = () => {
    if (!customName.trim()) {
      toast.error("Enter a resource name");
      return;
    }

    startTransition(async () => {
      const result = await addResource(slug, {
        eventId,
        name: customName.trim(),
        quantity: customQuantity,
        notes: customNotes.trim() || undefined,
        isCommon: false,
      });

      if (result.status === "success") {
        toast.success(result.message);
        setOpen(false);
        setCustomName("");
        setCustomQuantity(1);
        setCustomNotes("");
        onSuccess();
      } else {
        toast.error(result.message);
      }
    });
  };

  const toggleCommonResource = (name: string, defaultQty: number) => {
    setSelectedCommon(prev => {
      const exists = prev.find(r => r.name === name);
      if (exists) {
        return prev.filter(r => r.name !== name);
      } else {
        return [...prev, { name, quantity: defaultQty }];
      }
    });
  };

  const updateCommonQuantity = (name: string, quantity: number) => {
    setSelectedCommon(prev =>
      prev.map(r => (r.name === name ? { ...r, quantity } : r))
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Resources</DialogTitle>
          <DialogDescription>
            Add equipment or supplies needed for this event.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 border-b pb-3">
          <Button
            variant={mode === "common" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("common")}
          >
            Common Items
          </Button>
          <Button
            variant={mode === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("custom")}
          >
            Custom Item
          </Button>
        </div>

        {mode === "common" ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {COMMON_RESOURCES.map(resource => {
                const selected = selectedCommon.find(
                  r => r.name === resource.name
                );
                return (
                  <div
                    key={resource.name}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() =>
                      toggleCommonResource(
                        resource.name,
                        resource.defaultQuantity
                      )
                    }
                  >
                    <Checkbox checked={!!selected} />
                    <span className="flex-1 text-sm">{resource.name}</span>
                    {selected && (
                      <Input
                        type="number"
                        min={1}
                        value={selected.quantity}
                        onClick={e => e.stopPropagation()}
                        onChange={e =>
                          updateCommonQuantity(
                            resource.name,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 h-8"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedCommon.length} selected
              </span>
              <Button
                onClick={handleAddCommon}
                disabled={isPending || selectedCommon.length === 0}
              >
                {isPending
                  ? "Adding..."
                  : `Add ${selectedCommon.length} Resources`}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Resource Name</Label>
              <Input
                id="name"
                placeholder="e.g., Backdrop Stand"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={customQuantity}
                onChange={e => setCustomQuantity(parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Located in storage room B"
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleAddCustom} disabled={isPending}>
                {isPending ? "Adding..." : "Add Resource"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Resource Row
// =============================================================================

function ResourceRow({
  resource,
  slug,
  isEditable,
  onUpdate,
}: {
  resource: Resource;
  slug: string;
  isEditable: boolean;
  onUpdate: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const config = STATUS_CONFIG[resource.status];

  const handleStatusChange = (newStatus: ResourceStatus) => {
    startTransition(async () => {
      const result = await updateResourceStatus(slug, {
        resourceId: resource.id,
        status: newStatus,
      });

      if (result.status === "success") {
        toast.success(result.message);
        onUpdate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${resource.name}"?`)) return;

    startTransition(async () => {
      const result = await deleteResource(slug, {
        resourceId: resource.id,
      });

      if (result.status === "success") {
        toast.success(result.message);
        onUpdate();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-md transition-opacity",
        resource.status === "READY"
          ? "bg-green-50 dark:bg-green-950/20"
          : "bg-muted/50",
        isPending && "opacity-50"
      )}
    >
      {/* Icon indicator */}
      <div
        className={cn(
          "h-8 w-8 rounded-md flex items-center justify-center text-sm font-bold",
          resource.status === "READY"
            ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
            : resource.status === "CONFIRMED"
              ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
              : "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
        )}
      >
        {resource.status === "READY" ? (
          <Check className="h-4 w-4" />
        ) : (
          resource.quantity
        )}
      </div>

      {/* Resource info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{resource.name}</p>
        {resource.notes && (
          <p className="text-xs text-muted-foreground truncate">
            {resource.notes}
          </p>
        )}
      </div>

      {/* Quantity (when not shown in icon) */}
      {resource.status === "READY" && (
        <span className="text-sm text-muted-foreground">
          x{resource.quantity}
        </span>
      )}

      {/* Status dropdown */}
      {isEditable ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 gap-1", config.className)}
              disabled={isPending}
            >
              {config.label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {STATUS_ORDER.map(status => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={status === resource.status}
              >
                <Badge className={cn("mr-2", STATUS_CONFIG[status].className)}>
                  {STATUS_CONFIG[status].label}
                </Badge>
                {status === resource.status && (
                  <Check className="h-3 w-3 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Badge className={config.className}>{config.label}</Badge>
      )}

      {/* Delete button */}
      {isEditable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ResourcesSection({
  eventId,
  resources,
  slug,
  isEditable,
}: ResourcesSectionProps) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  // Group resources by status for summary
  const statusCounts = {
    NEEDED: resources.filter(r => r.status === "NEEDED").length,
    CONFIRMED: resources.filter(r => r.status === "CONFIRMED").length,
    READY: resources.filter(r => r.status === "READY").length,
  };

  const allReady =
    resources.length > 0 &&
    statusCounts.NEEDED === 0 &&
    statusCounts.CONFIRMED === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resources & Equipment
            </CardTitle>
            <CardDescription>
              {resources.length === 0
                ? "No resources added yet"
                : allReady
                  ? "All resources are ready!"
                  : `${statusCounts.NEEDED + statusCounts.CONFIRMED} items pending`}
            </CardDescription>
          </div>
          {isEditable && (
            <AddResourceDialog
              eventId={eventId}
              slug={slug}
              onSuccess={handleUpdate}
            />
          )}
        </div>

        {/* Status Summary */}
        {resources.length > 0 && (
          <div className="flex gap-2 mt-3">
            {statusCounts.NEEDED > 0 && (
              <Badge className={STATUS_CONFIG.NEEDED.className}>
                {statusCounts.NEEDED} Needed
              </Badge>
            )}
            {statusCounts.CONFIRMED > 0 && (
              <Badge className={STATUS_CONFIG.CONFIRMED.className}>
                {statusCounts.CONFIRMED} Confirmed
              </Badge>
            )}
            {statusCounts.READY > 0 && (
              <Badge className={STATUS_CONFIG.READY.className}>
                {statusCounts.READY} Ready
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {resources.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No resources added yet</p>
            {isEditable && (
              <p className="text-xs mt-1">
                Click &ldquo;Add Resource&rdquo; to get started
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map(resource => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                slug={slug}
                isEditable={isEditable}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
