/**
 * Unauthorized Access Page
 *
 * Displayed when a user attempts to access resources belonging
 * to another organization or lacks proper permissions.
 *
 * Security: This page indicates a potential cross-tenant access attempt
 * which is logged for security monitoring.
 */

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconAlertTriangle } from "@tabler/icons-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IconAlertTriangle className="size-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
          <CardDescription className="mt-2">
            You don&apos;t have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This could happen if:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              You&apos;re trying to access another organization&apos;s data
            </li>
            <li>Your role doesn&apos;t have the required permissions</li>
            <li>The resource has been restricted</li>
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Sign In with Different Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
