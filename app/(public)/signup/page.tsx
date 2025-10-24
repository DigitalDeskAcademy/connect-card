/**
 * Signup Page - Honest trial activation page
 *
 * Simple, truthful conversion page for GHL agencies to start their free trial.
 * No fake testimonials, no unverified claims, just the real value proposition.
 *
 * Business Objectives:
 * - Convert interested agencies into trial users
 * - Communicate real platform value without exaggeration
 * - Reduce signup friction with "no credit card required" messaging
 * - Build trust through honesty and transparency
 *
 * @page SignupPage
 * @route /signup
 * @access Public (no authentication required)
 * @returns {JSX.Element} Signup page with 14-day trial offer
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

const benefits = [
  "Complete 8-module GHL onboarding system",
  "Ready to use immediately (no setup)",
  "Client progress tracking dashboard",
  "14 days to test with real clients",
  "Cancel anytime, no BS",
];

export default function SignupPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Ready to stop being GHL support?
        </h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
          Join forward-thinking agencies using Sidecar to transform confused GHL
          clients into power users who actually launch campaigns and stick
          around.
        </p>
      </div>

      {/* Single centered Sign Up Card */}
      <Card className="border-primary shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Start Your 14-Day Free Trial
          </CardTitle>
          <p className="text-muted-foreground">
            No credit card required. Full access to all features.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">
              What&apos;s included in your trial:
            </h3>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                    <CheckIcon className="size-3" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/login" className="block">
            <Button size="lg" className="w-full">
              Start Free Trial
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground text-center mt-2 mb-4">
            Sign in with GitHub or email to continue. New users automatically
            get a 14-day trial.
          </p>

          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
            Cancel anytime during your trial with no charges.
          </p>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-primary">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
