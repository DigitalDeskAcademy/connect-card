/**
 * Team Management Client Component
 *
 * Provides UI for managing team members with role-based permissions.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconUserPlus, IconMail, IconMapPin } from "@tabler/icons-react";
import { Users, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { inviteStaff } from "@/actions/team/invite-staff";
import { revokeInvitation } from "@/actions/team/revoke-invitation";
import { resendInvitation } from "@/actions/team/resend-invitation";
import { updateMember } from "@/actions/team/update-member";
import { removeMember } from "@/actions/team/remove-member";
import { useToast } from "@/hooks/use-toast";
import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import { TeamDataTable } from "@/components/dashboard/team/team-data-table";
import { createTeamMembersColumns } from "@/components/dashboard/team/team-members-columns";
import { createPendingInvitationsColumns } from "@/components/dashboard/team/pending-invitations-columns";
import type { TeamMember } from "@/components/dashboard/team/team-members-columns";
import type { PendingInvitation } from "@/components/dashboard/team/pending-invitations-columns";
import { mapUserRoleToUIRole } from "@/lib/role-mapping";
import type { UserRole } from "@/lib/generated/prisma";

interface Location {
  id: string;
  name: string;
  slug: string;
}

// Predefined volunteer categories for assignment workflow
const VOLUNTEER_CATEGORIES = [
  "Kids Ministry",
  "Worship Team",
  "Hospitality",
  "Parking & Traffic",
  "Connection Team",
  "Audio/Visual Tech",
  "Prayer Team",
  "Facility Setup",
] as const;

interface TeamManagementClientProps {
  teamMembers: TeamMember[];
  dataScope: DataScope;
  currentUserId: string;
  locations: Location[];
  organizationSlug: string;
  pendingInvitations: PendingInvitation[];
}

export default function TeamManagementClient({
  teamMembers,
  dataScope,
  currentUserId,
  locations,
  organizationSlug,
  pendingInvitations,
}: TeamManagementClientProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("active");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as "admin" | "member",
    locationId: null as string | null,
  });

  const [editForm, setEditForm] = useState({
    role: "member" as "admin" | "member",
    locationId: null as string | null,
    volunteerCategories: [] as string[],
  });

  const canInviteUsers = dataScope.filters.canManageUsers;

  // Handle invite staff
  const handleInvite = async () => {
    // Validation
    if (!inviteForm.email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (inviteForm.role === "member" && !inviteForm.locationId) {
      toast({
        title: "Location Required",
        description: "Please select a location for staff members",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await inviteStaff(organizationSlug, {
        email: inviteForm.email,
        role: inviteForm.role,
        locationId: inviteForm.locationId,
      });

      if (result.status === "success") {
        toast({
          title: "Invitation Sent",
          description: result.message,
        });
        setIsInviteOpen(false);
        // Reset form
        setInviteForm({
          email: "",
          role: "member",
          locationId: null,
        });
      } else {
        toast({
          title: "Failed to Send Invitation",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit member
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);

    // Map database role to UI role (church_owner → owner, church_admin → admin, user → member)
    const uiRole = mapUserRoleToUIRole(member.role as UserRole);

    // Only allow editing admin/member roles (owner role cannot be changed in team UI)
    const editableRole = uiRole === "owner" ? "admin" : uiRole;

    setEditForm({
      role: editableRole as "admin" | "member",
      locationId: member.defaultLocationId,
      volunteerCategories: member.volunteerCategories || [],
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedMember) return;

    if (editForm.role === "member" && !editForm.locationId) {
      toast({
        title: "Location Required",
        description: "Please select a location for staff members",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateMember(organizationSlug, {
        memberId: selectedMember.id,
        role: editForm.role,
        locationId: editForm.locationId,
        volunteerCategories: editForm.volunteerCategories,
      });

      if (result.status === "success") {
        toast({
          title: "Member Updated",
          description: result.message,
        });
        setIsEditOpen(false);
        setSelectedMember(null);
      } else {
        toast({
          title: "Failed to Update Member",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update member error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsRemoveOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);

    try {
      const result = await removeMember(organizationSlug, {
        memberId: selectedMember.id,
      });

      if (result.status === "success") {
        toast({
          title: "Member Removed",
          description: result.message,
        });
        setIsRemoveOpen(false);
        setSelectedMember(null);
      } else {
        toast({
          title: "Failed to Remove Member",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Remove member error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend invitation
  const handleResendInvitation = async (invitation: PendingInvitation) => {
    try {
      const result = await resendInvitation(organizationSlug, {
        invitationId: invitation.id,
      });

      if (result.status === "success") {
        toast({
          title: "Invitation Resent",
          description: result.message,
        });
      } else {
        toast({
          title: "Failed to Resend Invitation",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend invitation error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle copy invite link
  const handleCopyInviteLink = async (invitation: PendingInvitation) => {
    try {
      const inviteUrl = `${window.location.origin}/invite/accept?token=${invitation.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard",
      });
    } catch (error) {
      console.error("Copy link error:", error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle revoke invitation
  const handleRevokeInvitation = async (invitation: PendingInvitation) => {
    try {
      const result = await revokeInvitation(organizationSlug, {
        invitationId: invitation.id,
      });

      if (result.status === "success") {
        toast({
          title: "Invitation Revoked",
          description: result.message,
        });
      } else {
        toast({
          title: "Failed to Revoke Invitation",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Revoke invitation error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create columns with callbacks
  const teamMembersColumns = createTeamMembersColumns({
    currentUserId,
    onEdit: handleEditMember,
    onRemove: handleRemoveMember,
  });

  const pendingInvitationsColumns = createPendingInvitationsColumns({
    onResend: handleResendInvitation,
    onCopyLink: handleCopyInviteLink,
    onRevoke: handleRevokeInvitation,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization&apos;s team members
          </p>
        </div>

        {canInviteUsers && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconUserPlus className="mr-2 h-4 w-4" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Staff Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to add a new staff member to your
                  organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@example.com"
                    value={inviteForm.email}
                    onChange={e =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value: "admin" | "member") =>
                      setInviteForm({
                        ...inviteForm,
                        role: value,
                        // Reset location if switching to admin (admins see all locations)
                        locationId:
                          value === "admin" ? null : inviteForm.locationId,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {inviteForm.role === "admin"
                      ? "Admins can manage team members and see all locations"
                      : "Staff members can scan and process connect cards at their assigned location"}
                  </p>
                </div>

                {/* Location Selector - Only show for staff role */}
                {inviteForm.role === "member" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="location"
                      className="flex items-center gap-2"
                    >
                      <IconMapPin className="h-4 w-4" />
                      Assigned Location
                    </Label>
                    <Select
                      value={inviteForm.locationId || ""}
                      onValueChange={value =>
                        setInviteForm({ ...inviteForm, locationId: value })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Staff members will only see connect cards from their
                      assigned location
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isSubmitting}>
                  <IconMail className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs Layout */}
      <Tabs
        defaultValue="active"
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs">
          <TabsTrigger
            value="active"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <Users className="mr-2 w-4 h-4" />
            Active Members ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <Clock className="mr-2 w-4 h-4" />
            Pending Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Members Tab */}
        <TabsContent value="active" className="mt-6">
          <TeamDataTable
            columns={teamMembersColumns}
            data={teamMembers}
            searchPlaceholder="Search by name or email..."
            searchColumn="name"
            pageSize={10}
            emptyStateTitle="No team members found"
            emptyStateDescription="Invite your first staff member to get started."
            emptyStateAction={
              canInviteUsers ? (
                <Button onClick={() => setIsInviteOpen(true)}>
                  <IconUserPlus className="mr-2 h-4 w-4" />
                  Invite Staff
                </Button>
              ) : undefined
            }
          />
        </TabsContent>

        {/* Pending Invitations Tab */}
        <TabsContent value="pending" className="mt-6">
          <TeamDataTable
            columns={pendingInvitationsColumns}
            data={pendingInvitations}
            searchPlaceholder="Search by email..."
            searchColumn="email"
            pageSize={10}
            emptyStateTitle="No pending invitations"
            emptyStateDescription="All invitations have been accepted or expired."
          />
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update {selectedMember?.name}&apos;s role and assigned location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "admin" | "member") =>
                  setEditForm({
                    ...editForm,
                    role: value,
                    // Reset location if switching to admin
                    locationId: value === "admin" ? null : editForm.locationId,
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Selector - Only show for staff role */}
            {editForm.role === "member" && (
              <div className="space-y-2">
                <Label htmlFor="edit-location">Assigned Location</Label>
                <Select
                  value={editForm.locationId || ""}
                  onValueChange={value =>
                    setEditForm({ ...editForm, locationId: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Volunteer Categories Section */}
            <div className="space-y-3">
              <div>
                <Label>Volunteer Categories (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Assign volunteer leadership categories for the assignment
                  workflow
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {VOLUNTEER_CATEGORIES.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={editForm.volunteerCategories.includes(category)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setEditForm({
                            ...editForm,
                            volunteerCategories: [
                              ...editForm.volunteerCategories,
                              category,
                            ],
                          });
                        } else {
                          setEditForm({
                            ...editForm,
                            volunteerCategories:
                              editForm.volunteerCategories.filter(
                                c => c !== category
                              ),
                          });
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.name} from your
              team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
