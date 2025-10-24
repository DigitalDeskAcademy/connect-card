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
import { IconUserPlus, IconMail } from "@tabler/icons-react";
import { format } from "date-fns";
import { inviteClinicStaff } from "@/app/actions/clinic/invite-staff";
import { useToast } from "@/hooks/use-toast";
import type { DataScope } from "@/app/data/dashboard/data-scope-types";
import { isClinicScope } from "@/app/data/dashboard/data-scope-types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string | null;
  clinicId: string | null;
  createdAt: Date;
  clinic: {
    name: string;
  } | null;
}

interface TeamManagementClientProps {
  teamMembers: TeamMember[];
  dataScope: DataScope;
  userClinic: {
    id: string;
    name: string;
  } | null;
  currentUserId: string;
}

export default function TeamManagementClient({
  teamMembers,
  dataScope,
  userClinic,
  currentUserId,
}: TeamManagementClientProps) {
  const { toast } = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "clinic_staff" as "clinic_admin" | "clinic_staff",
  });

  const canInviteUsers = dataScope.filters.canManageUsers;

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!userClinic && dataScope.type === "clinic") {
      toast({
        title: "Error",
        description: "Clinic information not found",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      const result = await inviteClinicStaff({
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        clinicId:
          userClinic?.id ||
          (isClinicScope(dataScope) ? dataScope.clinicId : ""),
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Invitation sent successfully",
        });
        setIsInviteOpen(false);
        setInviteForm({ email: "", name: "", role: "clinic_staff" });

        // In development, show the invitation link
        if (result.invitationLink) {
          console.log("Invitation link:", result.invitationLink);
          toast({
            title: "Development Mode",
            description: "Check console for invitation link",
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invitation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "platform_admin":
        return "bg-purple-100 text-purple-800";
      case "agency_owner":
        return "bg-blue-100 text-blue-800";
      case "agency_admin":
        return "bg-indigo-100 text-indigo-800";
      case "clinic_admin":
        return "bg-green-100 text-green-800";
      case "clinic_staff":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "platform_admin":
        return "Platform Admin";
      case "agency_owner":
        return "Agency Owner";
      case "agency_admin":
        return "Agency Admin";
      case "clinic_admin":
        return "Clinic Admin";
      case "clinic_staff":
        return "Clinic Staff";
      default:
        return "User";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            {dataScope.type === "clinic" && userClinic
              ? `Manage staff for ${userClinic.name}`
              : "Manage your organization's team members"}
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
                  Send an invitation to add a new staff member to{" "}
                  {userClinic ? userClinic.name : "your organization"}.
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={inviteForm.name}
                    onChange={e =>
                      setInviteForm({ ...inviteForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value: "clinic_admin" | "clinic_staff") =>
                      setInviteForm({ ...inviteForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic_staff">Clinic Staff</SelectItem>
                      <SelectItem value="clinic_admin">
                        Clinic Administrator
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isInviting}>
                  {isInviting ? (
                    "Sending..."
                  ) : (
                    <>
                      <IconMail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
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
            your {dataScope.type === "clinic" ? "clinic" : "organization"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {dataScope.type !== "clinic" && <TableHead>Clinic</TableHead>}
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={dataScope.type === "clinic" ? 4 : 5}
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
                    {dataScope.type !== "clinic" && (
                      <TableCell>
                        {member.clinic?.name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
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

      {/* Pending Invitations (TODO: Add this when we fetch invitation data) */}
      {canInviteUsers && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that have been sent but not yet accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No pending invitations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
