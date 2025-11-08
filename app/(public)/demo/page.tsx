/**
 * Demo Booking Page - Schedule Early Access Demo
 *
 * Early access demo scheduling for founding churches. Shows NewLife Church
 * validation and provides email-based booking during beta phase.
 *
 * @page DemoPage
 * @route /demo
 * @access Public (no authentication required)
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Video, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <article className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Back to Home Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="size-4" />
        Back to Home
      </Link>

      {/* Hero Section */}
      <section aria-labelledby="hero-title">
        <div className="text-center space-y-4 mb-12">
          <Badge className="mb-4 text-sm bg-orange-100 text-orange-800 border-orange-200">
            Early Access Demo • See NewLife Church&apos;s Live System
          </Badge>
          <h1
            id="hero-title"
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            See the System Processing 500+ Cards Weekly at NewLife Church
          </h1>
          <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
            15-minute live demo showing real connect card extraction from a
            working 5-campus church system
          </p>
        </div>
      </section>

      {/* Main Demo Card */}
      <section aria-label="Demo Details" className="mb-12">
        <Card>
        <CardHeader>
          <CardTitle className="text-xl">What We&apos;ll Show You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What to Expect */}
          <div className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Video className="size-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    NewLife Church&apos;s Real Results
                  </p>
                  <p className="text-sm text-muted-foreground">
                    See how NewLife went from 20 hours weekly to under 2 hours
                    processing 500+ connect cards across 5 campuses
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="size-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Live AI Extraction Demo</p>
                  <p className="text-sm text-muted-foreground">
                    Watch Claude Vision AI read real handwritten cards with high
                    accuracy—extracting names, emails, phone numbers, and prayer
                    requests in seconds
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="size-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Smart Review Queue</p>
                  <p className="text-sm text-muted-foreground">
                    See keyboard shortcuts and workflow optimizations that
                    reduce review time from 6-8 minutes per card to under 2
                    minutes
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Video className="size-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Founding Church Benefits</p>
                  <p className="text-sm text-muted-foreground">
                    Learn about 50% lifetime discount, FREE ScanSnap scanner,
                    and direct input on feature roadmap for first 25 churches
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Demo Booking */}
          <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
            <h3 className="font-semibold text-lg">Schedule Your Demo</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Email us to schedule a 15-minute live demo. We&apos;ll show you
              NewLife Church&apos;s working system and answer your questions
              about the founding church program.
            </p>
            <a
              href="mailto:hello@churchsyncai.com?subject=Early Access Demo Request&body=Church Name:%0D%0AYour Name:%0D%0AEmail:%0D%0APhone:%0D%0AHow many connect cards weekly:%0D%0AHow many campuses:"
              className="inline-block"
            >
              <Button size="lg" className="w-full sm:w-auto">
                Request Demo via Email
              </Button>
            </a>
            <p className="text-xs text-muted-foreground">
              We&apos;ll reply within 24 hours with available times
            </p>
          </div>
        </CardContent>
        </Card>
      </section>

      {/* Additional Info */}
      <section aria-label="Demo Information">
        <div className="grid md:grid-cols-3 gap-6 text-center">
        <div>
          <Clock className="size-8 mx-auto mb-2 text-primary" />
          <h3 className="font-semibold mb-1">15 Minutes</h3>
          <p className="text-sm text-muted-foreground">
            Quick demo focused on NewLife Church&apos;s results
          </p>
        </div>
        <div>
          <Video className="size-8 mx-auto mb-2 text-primary" />
          <h3 className="font-semibold mb-1">Live System Access</h3>
          <p className="text-sm text-muted-foreground">
            See the actual platform processing 500+ cards weekly
          </p>
        </div>
        <div>
          <Calendar className="size-8 mx-auto mb-2 text-primary" />
          <h3 className="font-semibold mb-1">Limited Availability</h3>
          <p className="text-sm text-muted-foreground">
            Only 25 founding church spots available
          </p>
        </div>
        </div>
      </section>
    </article>
  );
}
