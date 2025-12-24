"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search,
  Users,
  User,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  Shield,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvailableVolunteer } from "@/lib/data/events";
import {
  bulkAssignVolunteers,
  inviteVolunteersToSession,
} from "@/actions/events/assignments";

// =============================================================================
// Types
// =============================================================================

interface SessionInfo {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  slotsNeeded: number;
  slotsFilled: number;
}

interface AssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionInfo;
  eventId: string;
  eventName: string;
  slug: string;
}

// =============================================================================
// Component
// =============================================================================

export function AssignModal({
  open,
  onOpenChange,
  session,
  eventId,
  eventName,
  slug,
}: AssignModalProps) {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<AvailableVolunteer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendSmsInvite, setSendSmsInvite] = useState(false);

  // Load available volunteers when modal opens
  const loadVolunteers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/sessions/${session.id}/available-volunteers`
      );
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data.volunteers || []);
      }
    } catch (error) {
      console.error("Failed to load volunteers:", error);
      toast.error("Failed to load volunteers");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, session.id]);

  useEffect(() => {
    if (open) {
      loadVolunteers();
    } else {
      // Reset state when closing
      setSelectedIds(new Set());
      setSearchQuery("");
      setSendSmsInvite(false);
    }
  }, [open, loadVolunteers]);

  // Filter volunteers by search query
  const filteredVolunteers = volunteers.filter(v => {
    if (!searchQuery) return true;
    const name = v.churchMember?.name?.toLowerCase() || "";
    const email = v.churchMember?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Toggle volunteer selection
  const toggleSelection = (volunteerId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(volunteerId)) {
        next.delete(volunteerId);
      } else {
        next.add(volunteerId);
      }
      return next;
    });
  };

  // Select/deselect all visible
  const toggleAll = () => {
    if (selectedIds.size === filteredVolunteers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVolunteers.map(v => v.id)));
    }
  };

  // Submit assignments (or invites)
  const handleAssign = async () => {
    if (selectedIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const volunteerIds = Array.from(selectedIds);

      const result = sendSmsInvite
        ? await inviteVolunteersToSession(slug, session.id, volunteerIds)
        : await bulkAssignVolunteers(slug, session.id, volunteerIds);

      if (result.status === "success") {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(
        sendSmsInvite ? "Failed to send invites" : "Failed to assign volunteers"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const spotsRemaining = session.slotsNeeded - session.slotsFilled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Volunteers
          </DialogTitle>
          <DialogDescription>
            Select volunteers to assign to this session
          </DialogDescription>
        </DialogHeader>

        {/* Session Info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <p className="font-medium text-sm">{eventName}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(session.date, "EEE, MMM d")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(session.startTime, "h:mm a")} -{" "}
              {format(session.endTime, "h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={spotsRemaining > 0 ? "secondary" : "default"}
              className={cn(
                spotsRemaining === 0 &&
                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              )}
            >
              {spotsRemaining > 0
                ? `${spotsRemaining} spot${spotsRemaining !== 1 ? "s" : ""} remaining`
                : "Fully staffed"}
            </Badge>
          </div>
        </div>

        {/* Action Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-3">
            {sendSmsInvite ? (
              <MessageSquare className="h-5 w-5 text-blue-600" />
            ) : (
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="send-invite" className="font-medium">
                {sendSmsInvite ? "Send SMS Invite" : "Direct Assign"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {sendSmsInvite
                  ? "Volunteers will receive an SMS invitation"
                  : "Add volunteers directly without notification"}
              </p>
            </div>
          </div>
          <Switch
            id="send-invite"
            checked={sendSmsInvite}
            onCheckedChange={setSendSmsInvite}
          />
        </div>

        <Separator />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search volunteers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Volunteer List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No volunteers match your search"
                  : "No available volunteers for this session"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {!searchQuery &&
                  "Check event requirements (category, background check, location)"}
              </p>
            </div>
          ) : (
            <div>
              {/* Select All Header */}
              <div
                className="flex items-center gap-3 px-3 py-2 border-b bg-muted/30 sticky top-0"
                onClick={toggleAll}
              >
                <Checkbox
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size === filteredVolunteers.length
                  }
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">
                  Select All ({filteredVolunteers.length})
                </span>
              </div>

              {/* Volunteer Rows */}
              {filteredVolunteers.map(volunteer => {
                const member = volunteer.churchMember;
                const isSelected = selectedIds.has(volunteer.id);

                return (
                  <div
                    key={volunteer.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer border-b last:border-b-0",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => toggleSelection(volunteer.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(volunteer.id)}
                    />
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member?.name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {member?.email && (
                          <span className="truncate">{member.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {volunteer.backgroundCheckStatus === "CLEARED" && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          <Shield className="h-3 w-3 mr-0.5 text-green-600" />
                          BG
                        </Badge>
                      )}
                      {volunteer.lastServedDate && (
                        <span className="text-xs text-muted-foreground">
                          Last: {format(volunteer.lastServedDate, "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : "Select volunteers to assign"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedIds.size === 0 || isSubmitting}
              className={cn(sendSmsInvite && "bg-blue-600 hover:bg-blue-700")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {sendSmsInvite ? "Sending..." : "Assigning..."}
                </>
              ) : sendSmsInvite ? (
                <>
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Send Invite ({selectedIds.size})
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Assign ({selectedIds.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
