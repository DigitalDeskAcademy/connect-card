/**
 * Signup Page - Request Early Access
 *
 * Early access application page for founding churches. Explains the
 * founding church program and directs to account creation.
 *
 * @page SignupPage
 * @route /signup
 * @access Public (no authentication required)
 * @returns {JSX.Element} Early access signup page with founding benefits
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

const benefits = [
  "50% off lifetime pricing (locked in forever)",
  "FREE ScanSnap ix1600 scanner ($425 value)",
  "Direct input on feature roadmap",
  "Monthly feedback calls with our team",
  "White-glove onboarding and setup",
  "Priority access to new features",
  "30-day money back guarantee, no questions asked",
  "Limited to first 25 founding churches only",
];

export default function SignupPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-12">
        <Badge className="mb-4 text-sm bg-orange-100 text-orange-800 border-orange-200">
          Early Access • Limited to 25 Founding Churches
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Join the 25 Founding Churches
        </h1>
        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
          NewLife Church reduced data entry from 20 hours to under 2 hours
          weekly. Get the same results plus lifetime benefits as a founding
          church.
        </p>
      </div>

      {/* Single centered Sign Up Card */}
      <Card className="border-primary shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Request Early Access</CardTitle>
          <p className="text-muted-foreground">
            Create your account to apply for founding church program
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Founding Church Benefits:</h3>
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
              Request Early Access
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground text-center mt-2 mb-4">
            Sign in with GitHub or email to create your account. We&apos;ll
            review your application and reach out within 24 hours.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium mb-2">Tested at NewLife Church</p>
            <p className="text-xs text-muted-foreground">
              Processing 500+ cards weekly across 5 campuses since October 2024.
              Founding churches begin onboarding January 2025.
            </p>
          </div>

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
