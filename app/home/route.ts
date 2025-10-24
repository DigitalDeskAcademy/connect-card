/**
 * Smart Home Route - Intelligent redirect based on user role and organization
 *
 * Handles navigation for authenticated users when they click "Home" in the navbar.
 * Redirects users to their appropriate dashboard based on role and organization status.
 *
 * Redirect Logic:
 * - Platform admins → /platform/admin
 * - Church owners/admins with organization → /church/{slug}/admin
 * - Regular users with organization → /church/{slug}/learning
 * - Users without organization → /setup/organization (to complete setup)
 * - Unauthenticated users → / (public homepage)
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  // Get current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, redirect to public homepage
  if (!session?.user) {
    redirect("/");
  }

  // Get user details with organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: true,
    },
  });

  // If user not found, redirect to public homepage
  if (!user) {
    redirect("/");
  }

  // Determine redirect based on user role and organization status
  let redirectTo = "/";

  if (user.role === "platform_admin") {
    // Platform admins always go to platform admin dashboard
    redirectTo = "/platform/admin";
  } else if (user.organizationId && user.organization?.slug) {
    // User has an organization - route based on role
    const churchSlug = user.organization.slug;

    if (user.role === "church_owner" || user.role === "church_admin") {
      redirectTo = `/church/${churchSlug}/admin`;
    } else if (user.role === "user") {
      redirectTo = `/church/${churchSlug}/learning`;
    }
  } else if (user.role === "church_owner") {
    // Church owner without organization - needs to complete setup
    redirectTo = "/setup/organization";
  } else {
    // Regular user without organization - send to welcome page
    // This handles users who signed up but haven't chosen their path yet
    redirectTo = "/setup/welcome";
  }

  redirect(redirectTo);
}
