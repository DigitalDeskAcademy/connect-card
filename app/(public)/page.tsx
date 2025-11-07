/**
 * Church Sync AI - Early Access Landing Page
 *
 * Beta/Early access landing page for founding churches program.
 * Positions as software developers partnering with NewLife Church
 * to build real-world tested connect card solution.
 *
 * Target Audience: Churches of all sizes (25 founding churches)
 * Core Problem: Manual connect card entry wastes 10-20 hours/week
 * Solution: AI reads handwriting, routes volunteers and prayers automatically
 * Offer: 50% off lifetime + free scanner for founding churches
 *
 * Key Value Props:
 * - Built in partnership with NewLife Church (5 campuses, 2000 members)
 * - Processing 500+ cards weekly in real church environment
 * - 50% off lifetime pricing locked in forever
 * - Free ScanSnap ix1600 scanner ($425 value) with annual plans
 *
 * @page Church Landing
 * @route /
 * @access Public (no authentication required)
 * @returns {JSX.Element} Early access landing page
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, X } from "lucide-react";

import Link from "next/link";

/**
 * Feature Interface for Church Sync AI
 * @interface FeatureProps
 * @property {string} title - Feature name
 * @property {string} description - Feature benefit description
 * @property {string} icon - Emoji icon
 */
interface FeatureProps {
  title: string;
  description: string;
  icon: string;
}

/**
 * Workflow Steps
 */
const workflowSteps: FeatureProps[] = [
  {
    title: "Capture",
    description:
      "Use a ScanSnap or phone camera to capture entire stacks of connect cards in minutes.",
    icon: "📸",
  },
  {
    title: "Extract",
    description:
      "AI reads handwriting with 95% accuracy (tested on real cards at NewLife Church).",
    icon: "🤖",
  },
  {
    title: "Review",
    description:
      "Fix any errors in seconds with keyboard shortcuts and zoomable images.",
    icon: "✅",
  },
  {
    title: "Connect",
    description:
      "Visitors, volunteers, and prayers automatically go to the right people.",
    icon: "🎯",
  },
];

/**
 * Church Sync AI Early Access Landing Page
 *
 * Founding churches program with limited spots and lifetime benefits
 */
export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge className="text-sm bg-orange-100 text-orange-800 border-orange-200">
            Early Access • Limited to 25 Founding Churches
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
            We&apos;re Building the Connect Card Solution Churches Actually Need
          </h1>

          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            NewLife Church processes 500+ connect cards across 5 campuses. We
            partnered with their team to build Church Sync AI—the solution that
            actually works. Now opening to 25 founding churches.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href="/signup"
            >
              Request Early Access
            </Link>

            {session ? (
              <Link
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                })}
                href={
                  session.user.role === "platform_admin"
                    ? "/platform/admin"
                    : "#features"
                }
              >
                {session.user.role === "platform_admin"
                  ? "Go to Dashboard"
                  : "Learn More"}
              </Link>
            ) : (
              <Link
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                })}
                href="#story"
              >
                See Our Story
              </Link>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Limited to 25 founding churches
          </p>
        </div>
      </section>

      {/* Problem Validation Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">
            Does This Sound Like Your Monday?
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/30 rounded-lg p-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Stack of connect cards from Sunday still unprocessed
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Volunteers texting asking where to serve this week
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Prayer requests that haven&apos;t reached pastoral staff yet
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Last week&apos;s visitors still waiting for follow-up
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Multiple campuses with no unified system
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-primary">
              If you checked 3 or more, you need what we&apos;re building.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="mb-40" id="story">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Built With Real Churches, For Real Churches
          </h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-muted/30 rounded-lg p-8">
            <p className="text-lg mb-6">
              NewLife Church has 5 campuses, 2,000 members, and was drowning in
              connect cards every Monday.
            </p>

            <p className="text-muted-foreground mb-4">
              Their team tried everything:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <X className="size-4 text-destructive flex-shrink-0" />
                <span className="text-sm">
                  Expensive church management systems (didn&apos;t handle cards)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <X className="size-4 text-destructive flex-shrink-0" />
                <span className="text-sm">
                  Manual data entry teams (burned out volunteers)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <X className="size-4 text-destructive flex-shrink-0" />
                <span className="text-sm">
                  Partial digital solutions (created more work)
                </span>
              </div>
            </div>

            <p className="text-lg font-semibold text-primary">
              Nothing worked. So we partnered with them to build something
              better.
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-8 border-l-4 border-primary">
            <h3 className="font-semibold mb-4">The Partnership:</h3>
            <p className="text-muted-foreground mb-6">
              We bring the technical expertise. NewLife&apos;s team brings 20
              years of church operations experience. Together, we built what
              actually works.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold mb-2">Now at NewLife:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-green-600" />
                    <span className="text-sm">
                      500+ cards weekly in under 2 hours
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-green-600" />
                    <span className="text-sm">
                      Visitors contacted within 24 hours
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">&nbsp;</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-green-600" />
                    <span className="text-sm">
                      Volunteers know where to serve
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-green-600" />
                    <span className="text-sm">
                      Prayers reach the right people
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold">
              Time to expand to 25 founding churches.
            </p>
          </div>
        </div>
      </section>

      {/* What We've Built Section */}
      <section className="mb-40" id="solution">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            A Complete Connect Card Workflow (That Actually Works)
          </h2>
          <p className="text-muted-foreground">
            Capture → Extract → Review → Connect
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {workflowSteps.map((step, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">{step.icon}</div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Statistics */}
        <div className="bg-muted/30 rounded-lg p-8">
          <h3 className="font-semibold text-center mb-8">
            Live Statistics from NewLife Church:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-6xl font-bold text-primary mb-2">500+</p>
              <p className="text-sm text-muted-foreground">
                Cards processed weekly
              </p>
            </div>
            <div>
              <p className="text-6xl font-bold text-primary mb-2">2 min</p>
              <p className="text-sm text-muted-foreground">
                Average per card (was 6-8 min)
              </p>
            </div>
            <div>
              <p className="text-6xl font-bold text-primary mb-2">95%</p>
              <p className="text-sm text-muted-foreground">
                First-scan accuracy
              </p>
            </div>
            <div>
              <p className="text-6xl font-bold text-primary mb-2">100%</p>
              <p className="text-sm text-muted-foreground">
                Follow-up within 24hrs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founding Church Benefits */}
      <section className="mb-40" id="benefits">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Become a Founding Church</h2>
          <p className="text-muted-foreground">
            Exclusive Benefits for Our First 25 Churches
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-semibold text-lg mb-2">50% Off Forever</h3>
                <p className="text-sm text-muted-foreground">
                  Locked in lifetime pricing for founding churches. Regular
                  pricing begins March 2025.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="font-semibold text-lg mb-2">FREE Scanner</h3>
                <p className="text-sm text-muted-foreground">
                  $425 ScanSnap ix1600 with annual Growth or Enterprise plan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-semibold text-lg mb-2">
                  Direct Feature Input
                </h3>
                <p className="text-sm text-muted-foreground">
                  Monthly calls with our team. Your feedback shapes the product.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">🤝</div>
                <h3 className="font-semibold text-lg mb-2">
                  White-Glove Onboarding
                </h3>
                <p className="text-sm text-muted-foreground">
                  We help you set everything up and train your team personally.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="font-semibold text-lg mb-2">
                  Pioneer Recognition
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your church helped shape this solution from day one.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-semibold text-lg mb-2">30-Day Guarantee</h3>
                <p className="text-sm text-muted-foreground">
                  No questions asked. We&apos;ll even pay return shipping on the
                  scanner.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mb-40" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Founding Church Pricing (50% Off Forever)
          </h2>
          <p className="text-muted-foreground">
            Only 25 founding spots available
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Small Church */}
          <Card>
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-4">Small Church</Badge>
              <div className="space-y-2">
                <div className="text-muted-foreground line-through text-lg">
                  $158/month
                </div>
                <CardTitle className="text-6xl">$79</CardTitle>
                <div className="text-muted-foreground">/month</div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {"<"}200 members
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">200 cards/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">All core features</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Email support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">50% off forever</span>
                </div>
              </div>
              <Link
                href="/signup"
                className={buttonVariants({ className: "w-full" })}
              >
                Request Early Access
              </Link>
            </CardContent>
          </Card>

          {/* Growing Church */}
          <Card className="border-2 border-primary relative">
            <Badge className="absolute -top-3 right-4 bg-green-600 text-white border-none hover:bg-green-600">
              FREE $425 Scanner
            </Badge>
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-4">Most Popular</Badge>
              <div className="space-y-2">
                <div className="text-muted-foreground line-through text-lg">
                  $298/month
                </div>
                <CardTitle className="text-6xl">$149</CardTitle>
                <div className="text-muted-foreground">/month</div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                200-500 members
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">500 cards/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold">
                    FREE Scanner with annual
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">All core features</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">50% off forever</span>
                </div>
              </div>
              <Link
                href="/signup"
                className={buttonVariants({ className: "w-full" })}
              >
                Request Early Access
              </Link>
            </CardContent>
          </Card>

          {/* Multi-Campus */}
          <Card className="relative">
            <Badge className="absolute -top-3 right-4 bg-green-600 text-white border-none hover:bg-green-600">
              FREE $425 Scanner
            </Badge>
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-4">Multi-Campus</Badge>
              <div className="space-y-2">
                <div className="text-muted-foreground line-through text-lg">
                  $598/month
                </div>
                <CardTitle className="text-6xl">$299</CardTitle>
                <div className="text-muted-foreground">/month</div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">500+ members</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Unlimited cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold">
                    FREE Scanner with annual
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Multiple locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Phone support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">50% off forever</span>
                </div>
              </div>
              <Link
                href="/signup"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                Request Early Access
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Only 25 founding spots available. Regular pricing begins March 2025.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Early Access Questions</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Who built this?</h3>
                <p className="text-sm text-muted-foreground">
                  Church Sync AI was developed in partnership with NewLife
                  Church&apos;s operations team. We build the technology, they
                  ensure it works for real church workflows.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">When can we start?</h3>
                <p className="text-sm text-muted-foreground">
                  NewLife has been live since October 2024. Founding churches
                  begin onboarding January 2025.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">
                  What if it doesn&apos;t work for us?
                </h3>
                <p className="text-sm text-muted-foreground">
                  30-day money back guarantee, no questions asked. We&apos;ll
                  even pay return shipping on the scanner.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Can we influence features?</h3>
                <p className="text-sm text-muted-foreground">
                  Absolutely. Founding churches have monthly feedback calls and
                  direct input on our roadmap.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Is our data secure?</h3>
                <p className="text-sm text-muted-foreground">
                  Bank-level encryption. Complete church isolation. Your data
                  never mingles with other churches.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mb-40" id="signup">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Join Us in Solving Monday Morning Data Entry
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Tested at NewLife. Ready for your church.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href="/signup"
            >
              Request Early Access
            </Link>
            <Link
              className={buttonVariants({
                size: "lg",
                variant: "outline",
              })}
              href="/demo"
            >
              Schedule a Demo
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Developed with NewLife Church • Processing 500+ weekly cards • 5
            campuses running live
          </p>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="mb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center text-sm text-muted-foreground">
            <div>
              <p className="font-semibold mb-1">In partnership with</p>
              <p>NewLife Church</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Field-tested since</p>
              <p>October 2024</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Your data stays</p>
              <p>Completely private</p>
            </div>
            <div>
              <p className="font-semibold mb-1">No questions asked</p>
              <p>30-day guarantee</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
