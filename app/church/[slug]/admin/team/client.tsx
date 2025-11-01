/**
 * Team Management Client Component
 *
 * Provides UI for managing team members with role-based permissions.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconUserPlus, IconMail, IconMapPin } from "@tabler/icons-react";
import { format } from "date-fns";
import { inviteStaff } from "@/actions/team/invite-staff";
import { useToast } from "@/hooks/use-toast";
import type { DataScope } from "@/app/data/dashboard/data-scope-types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string | null;
  defaultLocationId: string | null;
  locationName: string | null;
  createdAt: Date;
}

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  locationId: string | null;
  locationName: string | null;
  createdAt: Date;
  expiresAt: Date;
}

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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as "admin" | "member",
    locationId: null as string | null,
  });

  const canInviteUsers = dataScope.filters.canManageUsers;

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

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "platform_admin":
        return "bg-purple-100 text-purple-800";
      case "owner":
        return "bg-blue-100 text-blue-800";
      case "admin":
        return "bg-indigo-100 text-indigo-800";
      case "member":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "platform_admin":
        return "Platform Admin";
      case "owner":
        return "Primary Admin";
      case "admin":
        return "Admin";
      case "member":
        return "Staff";
      default:
        return "Staff";
    }
  };

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

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""} in
            your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No team members found.{" "}
                    {canInviteUsers &&
                      "Invite your first staff member to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name}
                      {member.id === currentUserId && (
                        <Badge variant="outline" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.locationName || (
                        <span className="text-muted-foreground">
                          All locations
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {canInviteUsers && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {pendingInvitations.length} invitation
              {pendingInvitations.length !== 1 ? "s" : ""} awaiting acceptance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending invitations
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map(invitation => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(invitation.role)}>
                          {getRoleLabel(invitation.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invitation.locationName || (
                          <span className="text-muted-foreground">
                            All locations
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Feature Coming Soon",
                              description:
                                "Revoke invitation feature will be available soon",
                            });
                          }}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
