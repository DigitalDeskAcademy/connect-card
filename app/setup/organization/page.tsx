/**
 * Organization Setup Page - Post-authentication organization creation
 *
 * This page handles the organization setup flow for new users after they've
 * authenticated via OAuth or Email OTP. It collects agency information and
 * creates the organization with proper role assignment.
 *
 * Flow:
 * 1. User authenticates (GitHub OAuth or Email OTP)
 * 2. Auth callback detects missing organizationId
 * 3. Redirects here for organization setup
 * 4. Collects agency details
 * 5. Creates organization and updates user
 * 6. Redirects to agency dashboard
 *
 * Security:
 * - Protected route (must be authenticated)
 * - One-time setup (redirects if org exists)
 * - Server-side validation
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrganizationSetupForm } from "./_components/OrganizationSetupForm";

export default async function OrganizationSetupPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // Not authenticated, redirect to login
    redirect("/login");
  }

  // Check if user already has an organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      organizationId: true,
      organization: {
        select: { slug: true },
      },
    },
  });

  if (user?.organizationId && user.organization?.slug) {
    // User already has an organization, redirect to appropriate dashboard
    redirect(`/church/${user.organization.slug}/admin`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to Sidecar Platform!
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your agency to get started
          </p>
        </div>
        <OrganizationSetupForm
          userId={user?.id || ""}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
        />
      </div>
    </div>
  );
}
