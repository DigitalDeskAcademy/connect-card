/**
 * Login Page - Secure Authentication Entry Point
 *
 * This page serves as the primary authentication gateway using Better-Auth.
 * It implements secure multi-method authentication while preventing common
 * authentication vulnerabilities and ensuring optimal user experience.
 *
 * Security Architecture:
 * - Server-side session validation prevents unauthorized access
 * - Redirect protection prevents open redirect vulnerabilities
 * - Multiple auth methods reduce single-point-of-failure risks
 * - Better Auth integration provides enterprise-grade security
 * - CSRF protection through Better Auth's built-in mechanisms
 *
 * Authentication Security Features:
 * - Session hijacking protection via secure cookie configuration
 * - Automatic redirect for authenticated users prevents session confusion
 * - Rate limiting protection via Arcjet (handled at API level)
 * - Secure OAuth flows with PKCE implementation
 * - Passwordless authentication option reduces password-related risks
 *
 * Threat Model Protection:
 * - Session Fixation: Better Auth handles secure session creation
 * - Credential Stuffing: Rate limiting + multi-method auth options
 * - Phishing: Consistent branding + OAuth reduces password exposure
 * - Account Enumeration: Generic error messages from auth components
 * - Open Redirects: Controlled redirect behavior to safe destinations
 *
 * Compliance and Trust:
 * - Privacy Policy and Terms of Service visibility (via layout)
 * - Secure transmission of authentication credentials
 * - GDPR-compliant data handling through Better Auth
 *
 * @page /login - Primary authentication endpoint
 * @security Implements secure multi-method authentication with threat protection
 */

import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { LoginForm } from "./_components/LoginForm";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    // Get user with organization details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        organizationId: true,
        organization: {
          select: { slug: true },
        },
      },
    });

    // Smart redirect based on user role and organization
    let redirectTo = "/"; // Default fallback to homepage

    if (user?.role === "platform_admin") {
      redirectTo = "/platform/admin";
    } else if (user?.organizationId && user.organization?.slug) {
      // Agency users go to their agency learning portal
      const agencySlug = user.organization.slug;

      if (user.role === "agency_owner" || user.role === "agency_admin") {
        // Agency admins can choose to go to admin or learning
        redirectTo = `/agency/${agencySlug}/admin`;
      } else {
        // End users go to learning portal
        redirectTo = `/agency/${agencySlug}/learning`;
      }
    }

    redirect(redirectTo);
  }
  return <LoginForm />;
}
