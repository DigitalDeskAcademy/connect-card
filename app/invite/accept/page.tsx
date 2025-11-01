/**
 * Invitation Acceptance Page
 *
 * Public page for accepting staff invitations via email link.
 * Handles both authenticated and unauthenticated users.
 *
 * Flow:
 * 1. User clicks link in invitation email
 * 2. If not signed in → Redirect to sign-in page with return URL
 * 3. If signed in → Show invitation details and accept button
 * 4. On accept → Create membership and redirect to organization
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { PageContainer } from "@/components/layout/page-container";
import InviteAcceptClient from "./client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InviteAcceptPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  // Validate token exists
  if (!token) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Invitation</CardTitle>
              <CardDescription>
                The invitation link is missing or invalid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Missing Token</AlertTitle>
                <AlertDescription>
                  Please use the complete invitation link from your email.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Get current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If not signed in, redirect to sign-in with return URL
  if (!session) {
    const returnUrl = `/invite/accept?token=${token}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(returnUrl)}`);
  }

  // Fetch invitation details
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Handle invalid/expired invitation
  if (!invitation) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Not Found</CardTitle>
              <CardDescription>
                This invitation link is invalid or has been revoked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Invitation</AlertTitle>
                <AlertDescription>
                  The invitation may have been revoked or you may have already
                  accepted it. Please contact your organization administrator
                  for assistance.
                </AlertDescription>
              </Alert>
              <div className="mt-6">
                <Link href="/sign-in">
                  <Button>Return to Sign In</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Check if already accepted
  if (invitation.status === "ACCEPTED") {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Already Accepted</CardTitle>
              <CardDescription>
                This invitation has already been accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Invitation Accepted</AlertTitle>
                <AlertDescription>
                  You are already a member of {invitation.organization.name}.
                </AlertDescription>
              </Alert>
              <div className="mt-6">
                <Link href={`/church/${invitation.organization.slug}/admin`}>
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Check if expired
  if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Expired</CardTitle>
              <CardDescription>
                This invitation link has expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Expired</AlertTitle>
                <AlertDescription>
                  This invitation expired on{" "}
                  {invitation.expiresAt.toLocaleDateString()}. Please contact
                  your organization administrator to request a new invitation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Check if email matches
  if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Email Mismatch</CardTitle>
              <CardDescription>
                This invitation was sent to a different email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Wrong Email Address</AlertTitle>
                <AlertDescription>
                  This invitation was sent to{" "}
                  <strong>{invitation.email}</strong>, but you are currently
                  signed in as <strong>{session.user.email}</strong>. Please
                  sign out and sign in with the correct email address.
                </AlertDescription>
              </Alert>
              <div className="mt-6 flex gap-4">
                <Link href="/sign-out">
                  <Button variant="outline">Sign Out</Button>
                </Link>
                <Link href="/sign-in">
                  <Button>Sign In with Different Email</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Fetch location name if assigned
  let locationName: string | null = null;
  if (invitation.locationId) {
    const location = await prisma.location.findUnique({
      where: { id: invitation.locationId },
      select: { name: true },
    });
    locationName = location?.name || null;
  }

  // Show invitation acceptance UI
  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto mt-12">
        <InviteAcceptClient
          invitation={{
            organizationName: invitation.organization.name,
            role: invitation.role,
            locationName,
            expiresAt: invitation.expiresAt.toISOString(),
          }}
          token={token}
        />
      </div>
    </PageContainer>
  );
}
