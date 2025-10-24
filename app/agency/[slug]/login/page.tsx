/**
 * Agency Login Page - White-label Authentication Entry Point
 *
 * Provides agency-branded login experience that looks identical to /login
 * but shows the agency name instead of "SideCar" branding.
 */

import { headers } from "next/headers";
import { auth } from "../../../../lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { LoginForm } from "@/app/(auth)/login/_components/LoginForm";

interface AgencyLoginPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AgencyLoginPage({
  params,
}: AgencyLoginPageProps) {
  // Await params in Next.js 15
  const { slug } = await params;

  // Get agency from database by slug
  const agency = await getOrganizationBySlug(slug);

  if (!agency) {
    notFound(); // Return 404 if agency doesn't exist
  }

  // Check if user is already authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    // Redirect based on user role using multi-tenant architecture
    if (session.user.role === "platform_admin") {
      redirect("/platform/admin");
    } else if (
      session.user.role === "agency_owner" ||
      session.user.role === "agency_admin"
    ) {
      redirect(`/agency/${slug}/admin`);
    } else {
      redirect(`/agency/${slug}/learning`);
    }
  }

  // Use same layout as /login but with agency branding
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Agency name instead of "SideCar." */}
        <div className="flex items-center gap-2 self-center font-medium text-3xl">
          {agency.name}
        </div>

        {/* Same login form as /login */}
        <LoginForm />

        <div className="text-balance text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <span className="hover:text-primary hover:underline">
            Terms of service
          </span>{" "}
          and{" "}
          <span className="hover:text-primary hover:underline">
            Privacy Policy
          </span>
          .
        </div>
      </div>
    </div>
  );
}
