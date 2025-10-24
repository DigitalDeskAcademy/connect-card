/**
 * Payment Success Page - Post-purchase confirmation and user onboarding
 *
 * Critical post-conversion page that confirms successful purchase, sets positive
 * expectations, and guides users toward their next actions. Designed to reduce
 * buyer's remorse and increase user engagement immediately after purchase.
 *
 * Business Objectives:
 * - Confirm successful purchase and reduce post-payment anxiety
 * - Set clear expectations about access delivery and next steps
 * - Drive immediate engagement with purchased course content
 * - Encourage additional course discovery and cross-selling
 * - Build positive brand association immediately after transaction
 *
 * User Experience Strategy:
 * - Visual Confirmation: Large success icon provides immediate positive feedback
 * - Clear Messaging: "Payment Successful!" removes any transaction uncertainty
 * - Expectation Setting: Email confirmation promise reduces support inquiries
 * - Dual CTAs: Dashboard access + course browsing for continued engagement
 * - Professional Design: Reinforces quality purchase decision
 *
 * @page PaymentSuccessPage
 * @route /payment/success
 * @access Public (redirected from Stripe checkout)
 * @returns {JSX.Element} Success confirmation with engagement CTAs
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="size-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for your purchase! Your enrollment is being processed.
          </p>
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation shortly with access details.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/my-learning">
              <Button className="w-full">Go to My Learning</Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" className="w-full">
                Browse More Courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
