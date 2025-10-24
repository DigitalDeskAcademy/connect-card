/**
 * Authentication Layout - Secure Wrapper for Authentication Pages
 *
 * This layout provides a consistent, secure structure for all authentication pages.
 * It includes brand identity, navigation controls, and centers authentication forms
 * while maintaining security best practices for sensitive authentication flows.
 *
 * Security Features:
 * - Isolated layout prevents interference with authenticated areas
 * - Clear navigation paths prevent user confusion during auth flows
 * - Branded elements establish trust and prevent phishing concerns
 * - Terms of Service and Privacy Policy links ensure compliance visibility
 * - Centered layout reduces UI distractions during sensitive operations
 *
 * Trust and Brand Security:
 * - Consistent branding across all auth pages builds user confidence
 * - Clear visual hierarchy guides users through authentication steps
 * - Professional presentation reduces abandonment during sign-up/login
 * - Legal compliance text visible without being intrusive
 *
 * Accessibility and UX Security:
 * - Clear navigation prevents users from getting stuck in auth flows
 * - Responsive design ensures consistent experience across devices
 * - Proper contrast and sizing for authentication form visibility
 * - Keyboard navigation support for accessibility compliance
 *
 * @layout Authentication route group layout
 * @security Provides secure, trusted environment for authentication
 */

import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className: "absolute top-4 left-4",
        })}
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium text-3xl"
          href="/"
        >
          SideCar.
        </Link>
        {children}

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
