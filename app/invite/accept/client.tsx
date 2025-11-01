"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconCheck,
  IconMapPin,
  IconBriefcase,
  IconAlertCircle,
} from "@tabler/icons-react";
import { acceptInvitation } from "@/actions/team/accept-invitation";
import { toast } from "sonner";

interface InviteAcceptClientProps {
  invitation: {
    organizationName: string;
    role: string;
    locationName: string | null;
    expiresAt: string;
  };
  token: string;
}

export default function InviteAcceptClient({
  invitation,
  token,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "church_admin":
        return "Church Admin";
      case "user":
        return "Staff";
      default:
        return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "church_admin":
        return "You'll be able to manage team members, view all locations, and access all connect cards.";
      case "user":
        return "You'll be able to scan and process connect cards at your assigned location.";
      default:
        return "";
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const result = await acceptInvitation(token);

      if (result.status === "success") {
        toast.success(result.message);

        // Redirect to organization dashboard
        if (result.data?.redirectUrl) {
          router.push(result.data.redirectUrl);
        }
      } else {
        toast.error(result.message);
        setIsAccepting(false);
      }
    } catch (error) {
      console.error("Accept invitation error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsAccepting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          Join {invitation.organizationName}
        </CardTitle>
        <CardDescription>
          You&apos;ve been invited to join the team. Review the details below
          and accept to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Information */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <IconBriefcase className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Your Role</h3>
              <p className="text-lg font-medium">
                {getRoleLabel(invitation.role)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {getRoleDescription(invitation.role)}
              </p>
            </div>
          </div>

          {/* Location Assignment (if applicable) */}
          {invitation.locationName && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <IconMapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Assigned Location
                </h3>
                <p className="text-lg font-medium">{invitation.locationName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You&apos;ll be able to scan and process connect cards from
                  this location.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* What's Included */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3">What&apos;s Included</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Access to Connect Card Management platform</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Scan and process visitor connect cards</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Review and edit extracted information</span>
            </li>
            {invitation.role === "church_admin" && (
              <>
                <li className="flex items-start gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Manage team members and send invitations</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>View analytics and reports for all locations</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Expiration Notice */}
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This invitation will expire on{" "}
            <strong>
              {new Date(invitation.expiresAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
            .
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full"
          size="lg"
        >
          {isAccepting ? "Accepting..." : "Accept Invitation"}
        </Button>
      </CardFooter>
    </Card>
  );
}
