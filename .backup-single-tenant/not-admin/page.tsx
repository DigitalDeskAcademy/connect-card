/**
 * Access Denied Page - Role-Based Access Control Security Boundary
 *
 * This page serves as a security boundary for role-based access control violations.
 * It displays when authenticated users without admin privileges attempt to access
 * admin-only functionality, providing clear feedback while maintaining security.
 *
 * Security Architecture:
 * - Clear communication prevents user confusion about access restrictions
 * - Safe landing page prevents error states that could expose system information
 * - Professional presentation maintains trust during access denial
 * - Provides clear path forward (return to authorized areas)
 * - No information leakage about admin functionality or system structure
 *
 * RBAC Security Features:
 * - Prevents privilege escalation attempts by clearly defining boundaries
 * - Maintains user session while denying specific resource access
 * - Reduces attack surface by not exposing admin interface elements
 * - Professional error handling prevents system information disclosure
 *
 * User Experience Security:
 * - Clear messaging prevents repeated unauthorized access attempts
 * - Branded presentation maintains trust during access restriction
 * - Easy navigation back to authorized areas reduces user frustration
 * - Prevents accidental exposure to admin functionality
 *
 * Threat Model Protection:
 * - Information Disclosure: No details about admin functionality exposed
 * - Privilege Escalation: Clear boundary enforcement with user-friendly messaging
 * - System Reconnaissance: Generic error page reveals minimal system details
 * - User Confusion: Clear guidance prevents unintended security bypass attempts
 *
 * Integration Points:
 * - Used by requireAdmin() guard for consistent access control
 * - Maintains session state for seamless return to authorized areas
 * - Integrated with application navigation patterns
 *
 * @page /not-admin - Access denied page for insufficient privileges
 * @security Implements secure RBAC boundary with user-friendly access denial
 */

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

export default function NotAdminRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="bg-destructive/10 rounded-full w-fit  p-4 mx-auto">
            <ShieldX className="size-16 text-destructive" />
          </div>

          <div className="text-center">
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription className="max-w-xs mx-auto">
              You must be an admin to create a course.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Link
            href="/"
            className={buttonVariants({
              className: "w-full",
            })}
          >
            <ArrowLeft className="mr-1 size-4" />
            Back to Home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
