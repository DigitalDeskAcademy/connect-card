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
// TODO: Implement church-specific invite functionality
// import { inviteClinicStaff } from "@/app/actions/clinic/invite-staff";
import { useToast } from "@/hooks/use-toast";
import type { DataScope } from "@/app/data/dashboard/data-scope-types";

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
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "volunteer_leader" as "church_admin" | "volunteer_leader",
  });

  const canInviteUsers = dataScope.filters.canManageUsers;

  const handleInvite = async () => {
    // TODO: Implement church-specific invite functionality
    toast({
      title: "Feature Not Available",
      description: "Church staff invitation feature coming soon",
      variant: "destructive",
    });
    setIsInviteOpen(false);
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "platform_admin":
        return "bg-purple-100 text-purple-800";
      case "church_owner":
        return "bg-blue-100 text-blue-800";
      case "church_admin":
        return "bg-indigo-100 text-indigo-800";
      case "volunteer_leader":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "platform_admin":
        return "Platform Admin";
      case "church_owner":
        return "Church Owner";
      case "church_admin":
        return "Church Admin";
      case "volunteer_leader":
        return "Volunteer Leader";
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
                    onValueChange={(
                      value: "church_admin" | "volunteer_leader"
                    ) => setInviteForm({ ...inviteForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volunteer_leader">
                        Volunteer Leader
                      </SelectItem>
                      <SelectItem value="church_admin">
                        Church Administrator
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite}>
                  <IconMail className="mr-2 h-4 w-4" />
                  Send Invitation
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
