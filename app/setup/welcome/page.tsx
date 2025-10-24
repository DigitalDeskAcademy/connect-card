/**
 * Welcome Page - New User Account Creation
 *
 * This page serves as a checkpoint for new users after authentication but before
 * organization creation. It ensures users understand what they're signing up for
 * and prevents accidental organization/trial creation.
 *
 * Flow:
 * 1. User authenticates (email OTP or GitHub OAuth)
 * 2. Auth callback detects no organization
 * 3. Redirects here for acknowledgment
 * 4. User agrees to terms and continues
 * 5. Proceeds to organization setup
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { WelcomeForm } from "./_components/WelcomeForm";
import { SwitchAccountLink } from "./_components/SwitchAccountLink";

export default async function WelcomePage() {
  // Get the current session to display the verified email
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // No session, redirect to login
    redirect("/login");
  }

  // Check if user already has an organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  // If user already has an organization, skip this page
  if (user?.organizationId) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Logo/Brand at top */}
      <div className="pt-12 text-center">
        <h1 className="text-3xl font-semibold text-foreground">SideCar.</h1>
      </div>

      {/* Main content centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          {/* Main heading */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-normal text-foreground">
              Let&apos;s create your account
            </h2>
            <p className="text-base text-muted-foreground">
              A few things for you to review
            </p>
          </div>

          {/* Terms agreement form */}
          <div className="mt-8">
            <WelcomeForm />
          </div>
        </div>
      </div>

      {/* Email verification info at bottom */}
      <div className="pb-12 text-center">
        <p className="text-sm text-muted-foreground">
          Email verified as{" "}
          <span className="font-medium text-foreground">
            {session.user.email}
          </span>
        </p>
        <SwitchAccountLink />
      </div>
    </div>
  );
}
