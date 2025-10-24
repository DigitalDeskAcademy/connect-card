/**
 * Demo Booking Page - Schedule a 15-minute demo
 *
 * Placeholder page for demo scheduling that can be replaced with
 * Calendly embed, Cal.com, or other booking solution.
 *
 * @page DemoPage
 * @route /demo
 * @access Public (no authentication required)
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Video, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Back to Home Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="size-4" />
        Back to Home
      </Link>

      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Book Your 15-Minute Demo
        </h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
          See how Sidecar can transform your GHL client onboarding in just 15
          minutes
        </p>
      </div>

      {/* Main Demo Card */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-xl">Quick Demo Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What to Expect */}
          <div className="space-y-4">
            <h3 className="font-semibold">What we&apos;ll cover:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Video className="size-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    Your Current Onboarding Pain Points
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quick discussion about your specific GHL client challenges
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="size-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Live Platform Walkthrough</p>
                  <p className="text-sm text-muted-foreground">
                    See the 8-module system and how clients actually use it
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="size-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">ROI Calculator</p>
                  <p className="text-sm text-muted-foreground">
                    Calculate your time savings and support reduction
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Temporary Booking Instructions */}
          <div className="bg-muted/50 rounded-lg p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              📅 Demo booking calendar coming soon!
            </p>
            <p className="text-sm">
              In the meantime, email us to schedule your demo:
            </p>
            <a
              href="mailto:hello@sidecarplatform.com?subject=15-Min Demo Request"
              className="inline-block"
            >
              <Button size="lg" className="w-full sm:w-auto">
                Email to Schedule Demo
              </Button>
            </a>
            <p className="text-xs text-muted-foreground">
              We&apos;ll reply within 24 hours with available times
            </p>
          </div>

          {/* Future Calendly Embed Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              [Calendly embed will go here]
            </p>
            <p className="text-xs text-muted-foreground">
              Integration with Calendly, Cal.com, or similar booking tool
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid md:grid-cols-3 gap-6 text-center">
        <div>
          <Clock className="size-8 mx-auto mb-2 text-primary" />
          <h3 className="font-semibold mb-1">15 Minutes</h3>
          <p className="text-sm text-muted-foreground">
            Quick and focused on your needs
          </p>
        </div>
        <div>
          <Video className="size-8 mx-auto mb-2 text-primary" />
          <h3 className="font-semibold mb-1">Screen Share</h3>
          <p className="text-sm text-muted-foreground">
            See the actual platform in action
          </p>
        </div>
        <div>
          <Calendar className="size-8 mx-auto mb-2 text-primary" />
          <h3 className="font-semibold mb-1">No Pressure</h3>
          <p className="text-sm text-muted-foreground">
            Just a helpful conversation
          </p>
        </div>
      </div>
    </div>
  );
}
