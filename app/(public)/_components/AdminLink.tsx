/**
 * Admin Dashboard Link (Client Component)
 *
 * Displays admin dashboard link for platform_admin users only.
 * Isolated client component to keep homepage as Server Component.
 *
 * @component AdminLink
 * @param {AdminLinkProps} props - Component props
 * @returns {JSX.Element | null} Admin dashboard link or null
 */

"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface AdminLinkProps {
  session: {
    user: {
      role?: string | null;
      [key: string]: unknown;
    };
  } | null;
}

export default function AdminLink({ session }: AdminLinkProps) {
  if (!session || session.user.role !== "platform_admin") {
    return null;
  }

  return (
    <Link
      href="/platform/admin"
      className={buttonVariants({
        size: "lg",
        variant: "outline",
      })}
    >
      Go to Dashboard
    </Link>
  );
}
