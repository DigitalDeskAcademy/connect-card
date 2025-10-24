/**
 * Pricing Page - Simplified Single-Tier Pricing for GHL Agencies
 *
 * Updated copy implementing the latest messaging and structure
 * with 14-day free trial and comprehensive FAQ section.
 *
 * @page GHL Agency Pricing
 * @route /pricing
 * @access Public (no authentication required)
 * @returns {JSX.Element} Single-tier pricing with clear value proposition
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

/**
 * GHL Agency Pricing Page Component
 *
 * Implements the final approved copy with proper structure and messaging.
 */
export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        {/* Primary Headline */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Stop Losing Clients During Onboarding
        </h1>

        {/* Subheadline */}
        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
          The average agency loses 30% of new clients in the first 60 days. Not
          anymore.
        </p>
      </div>

      {/* Single Pricing Card - Centered */}
      <div className="max-w-lg mx-auto mb-16">
        <Card className="border-2 border-primary shadow-xl">
          <CardHeader className="text-center pb-6">
            <Badge className="w-fit mx-auto mb-4">Agency Growth Plan</Badge>
            <CardTitle className="text-3xl">$297</CardTitle>
            <div className="text-muted-foreground">/month</div>
            <p className="text-sm text-muted-foreground mt-4">
              For agencies that actually onboard clients
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <h3 className="font-semibold text-center">What&apos;s Included:</h3>

            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  Unlimited onboarding workflows
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  Up to 5 active users included
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  Your branding, your domain
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  Custom content builder (add your own modules)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  Progress tracking that actually works
                </span>
              </li>
            </ul>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Additional active users:</strong> $15/month each
                <br />
                <span className="text-xs">
                  (Active = logged in within last 30 days)
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/signup" className="block">
                <Button className="w-full cursor-pointer" size="lg">
                  Start 14-Day Free Trial
                </Button>
              </Link>

              <Link
                href="mailto:hello@sidecarplatform.com?subject=Demo Request"
                className="block"
              >
                <Button
                  className="w-full cursor-pointer"
                  variant="outline"
                  size="lg"
                >
                  Book Demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="text-center space-y-6 bg-muted/50 rounded-lg p-12 mb-16">
        <h2 className="text-3xl font-bold">Quick Answers</h2>
        <div className="text-left max-w-4xl mx-auto space-y-8">
          <div>
            <h3 className="font-semibold mb-2">
              Is this another course about GHL?
            </h3>
            <p className="text-muted-foreground text-sm">
              No. This trains YOUR clients to use the GHL account you provide
              them.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              Do my clients need separate logins?
            </h3>
            <p className="text-muted-foreground text-sm">
              Yes, a simple 30-second signup for your branded academy. Their GHL
              login stays the same.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I white-label this?</h3>
            <p className="text-muted-foreground text-sm">
              100%. Your clients see your brand. We&apos;re invisible.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I add custom content?</h3>
            <p className="text-muted-foreground text-sm">
              Yes, immediately. Add your own videos and modules. You&apos;re not
              locked into templates.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              What if I only have 2 clients?
            </h3>
            <p className="text-muted-foreground text-sm">
              Perfect. Start with 2. The price is the same whether you have 2 or
              5 active users.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center">
        <p className="text-lg text-muted-foreground mb-6">
          Built by an agency owner who was drowning in onboarding support
          tickets.
        </p>
        <Link href="/signup" className="inline-block">
          <Button size="lg" className="cursor-pointer">
            Start 14-Day Free Trial - No Card Required
          </Button>
        </Link>
      </div>
    </div>
  );
}
