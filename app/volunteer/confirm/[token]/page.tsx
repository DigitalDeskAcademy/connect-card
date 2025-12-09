/**
 * Background Check Confirmation Page
 *
 * Public page (no auth required) for volunteers to confirm
 * they have completed their background check.
 *
 * Flow:
 * 1. GHL sends follow-up SMS/email with this link
 * 2. Volunteer clicks link
 * 3. System validates token and updates status to PENDING_REVIEW
 * 4. Staff sees volunteer in review queue
 */

import { confirmBackgroundCheck } from "@/actions/volunteers/confirm-background-check";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
} from "@tabler/icons-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ConfirmBackgroundCheckPage({
  params,
}: PageProps) {
  const { token } = await params;

  // Validate token exists
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
            <CardDescription>
              The confirmation link is missing or invalid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Token</AlertTitle>
              <AlertDescription>
                Please use the complete link from your text message or email.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process the confirmation
  const result = await confirmBackgroundCheck(token);

  // Handle invalid token
  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">
              Confirmation Failed
            </CardTitle>
            <CardDescription>
              We couldn&apos;t process your confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-muted-foreground">
              If you continue to have issues, please contact your ministry
              leader.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle already confirmed
  if (result.alreadyConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <IconInfoCircle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-center">Already Confirmed</CardTitle>
            <CardDescription className="text-center">
              Hi {result.volunteerName}!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <IconInfoCircle className="h-4 w-4" />
              <AlertTitle>Previously Confirmed</AlertTitle>
              <AlertDescription>
                You&apos;ve already confirmed your background check completion.
                Our team at {result.churchName} will review it shortly.
              </AlertDescription>
            </Alert>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              You can close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success!
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <IconCheck className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-center">Thank You!</CardTitle>
          <CardDescription className="text-center">
            Hi {result.volunteerName}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <IconCheck className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              Confirmation Received
            </AlertTitle>
            <AlertDescription className="text-green-700">
              We&apos;ve recorded that you completed your background check. Our
              team at {result.churchName} will review and verify it shortly.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <h3 className="font-medium text-sm mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Our team will verify your background check</li>
              <li>You&apos;ll be notified once you&apos;re cleared to serve</li>
              <li>Your ministry leader will reach out with next steps</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground text-center pt-2">
            You can close this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
