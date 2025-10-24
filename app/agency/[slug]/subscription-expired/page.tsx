/**
 * Subscription Expired Page
 *
 * Displayed when an agency's subscription has expired or been suspended.
 * Provides options to renew or contact support.
 */

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconCreditCard } from "@tabler/icons-react";
import Link from "next/link";
import { getOrganizationBySlug } from "@/app/data/organization/get-organization-by-slug";
import { notFound } from "next/navigation";

interface SubscriptionExpiredPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SubscriptionExpiredPage({
  params,
}: SubscriptionExpiredPageProps) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IconCreditCard className="size-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Subscription Required</CardTitle>
          <CardDescription className="mt-2">
            {organization.subscriptionStatus === "CANCELLED"
              ? "Your subscription has been cancelled."
              : organization.subscriptionStatus === "SUSPENDED"
                ? "Your subscription has been suspended."
                : organization.subscriptionStatus === "PAST_DUE"
                  ? "Your subscription payment is past due."
                  : "Your trial period has ended."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">{organization.name}</p>
            <p className="text-sm text-muted-foreground">
              Status: {organization.subscriptionStatus}
            </p>
            {organization.trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                Trial ended:{" "}
                {new Date(organization.trialEndsAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            To continue accessing your admin portal and courses, please renew
            your subscription.
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Link href={`/agency/${slug}/billing`}>
              <Button className="w-full">Renew Subscription</Button>
            </Link>
            <Link href={`/agency/${slug}`}>
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Need help? Contact your administrator for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
