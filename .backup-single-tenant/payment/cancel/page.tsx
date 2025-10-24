/**
 * Payment Cancel Page - Checkout abandonment recovery and user retention
 *
 * Strategic page that handles payment cancellations gracefully while working to
 * retain user interest and provide pathways back to conversion. Designed to
 * reduce abandonment impact and maintain positive user experience.
 *
 * Business Objectives:
 * - Reassure users that no charges occurred to maintain trust
 * - Keep users engaged rather than losing them to abandonment
 * - Provide clear pathways back to conversion opportunities
 * - Maintain positive brand association despite cancelled transaction
 * - Reduce potential negative reviews or support inquiries
 *
 * Recovery Strategy:
 * - Reassurance: Clear "no charge" messaging reduces anxiety
 * - Non-pressure: "when you're ready" respects user decision
 * - Multiple Options: Course browsing + homepage provides choice
 * - Professional Handling: Maintains quality brand experience
 * - Re-engagement: Keeps user in conversion funnel
 *
 * @page PaymentCancelPage
 * @route /payment/cancel
 * @access Public (redirected from Stripe checkout)
 * @returns {JSX.Element} Cancellation acknowledgment with recovery CTAs
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="size-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your payment was cancelled and you have not been charged.
          </p>
          <p className="text-sm text-muted-foreground">
            You can return to the course page to try again when you&apos;re
            ready.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/courses">
              <Button className="w-full">Browse Courses</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
