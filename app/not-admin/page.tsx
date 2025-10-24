/**
 * Access Denied Page - Platform Admin Only
 *
 * This page displays when authenticated users without platform admin privileges
 * attempt to access platform admin-only functionality.
 *
 * Security: Provides clear feedback while maintaining security boundaries
 * for role-based access control.
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="bg-destructive/10 rounded-full w-fit p-4 mx-auto">
            <ShieldX className="size-16 text-destructive" />
          </div>

          <div className="text-center">
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription className="max-w-xs mx-auto">
              This area requires platform administrator privileges.
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
