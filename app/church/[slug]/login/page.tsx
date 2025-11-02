/**
 * Church Login Page - White-label Authentication Entry Point
 *
 * Provides church-branded login experience that looks identical to /login
 * but shows the church name instead of platform branding.
 */

import { headers } from "next/headers";
import { auth } from "../../../../lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { LoginForm } from "@/app/(auth)/login/_components/LoginForm";

interface ChurchLoginPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ChurchLoginPage({
  params,
}: ChurchLoginPageProps) {
  // Await params in Next.js 15
  const { slug } = await params;

  // Get church from database by slug
  const church = await getOrganizationBySlug(slug);

  if (!church) {
    notFound(); // Return 404 if church doesn't exist
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
      session.user.role === "church_owner" ||
      session.user.role === "church_admin"
    ) {
      redirect(`/church/${slug}/admin`);
    } else {
      redirect(`/church/${slug}/learning`);
    }
  }

  // Use same layout as /login but with church branding
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Church name instead of platform branding */}
        <div className="flex items-center gap-2 self-center font-medium text-3xl">
          {church.name}
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
