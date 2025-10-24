/**
 * Sidecar Platform - GHL Agency Landing Page
 *
 * Targeted landing page for GoHighLevel agencies struggling with client onboarding.
 * Addresses specific pain points of GHL's complex interface and provides
 * a proven 8-module solution that transforms confused clients into power users.
 *
 * Target Audience: GoHighLevel agencies
 * Core Problem: Clients ghost agencies due to GHL's overwhelming interface
 * Solution: Pre-built onboarding system with completion tracking
 * Pricing: $97/month beta program (50% off forever)
 *
 * Key Value Props:
 * - Built by GHL agency owners for GHL agencies
 * - 8 pre-built modules covering all GHL functionality
 * - White-label branding for agency credibility
 * - Reduces support time from 10+ hours to 3 hours per client
 * - Based on real client behavior and testing
 *
 * @page GHL Agency Landing
 * @route /
 * @access Public (no authentication required)
 * @returns {JSX.Element} GHL agency-focused landing page
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, X } from "lucide-react";

import Link from "next/link";

/**
 * Module Interface for GHL Training System
 * @interface ModuleProps
 * @property {string} title - Module name
 * @property {string[]} items - List of topics covered in module
 */
interface ModuleProps {
  title: string;
  items: string[];
}

/**
 * 8-Module GHL Training System
 * Complete onboarding curriculum that addresses every aspect of GHL
 * that typically confuses clients and causes support tickets.
 */
const modules: ModuleProps[] = [
  {
    title: "Digital Foundation",
    items: [
      "First login without overwhelm",
      "Understanding the dashboard (without panic)",
      "Basic settings that actually matter",
    ],
  },
  {
    title: "Contacts & Smart Lists",
    items: [
      "Adding contacts the right way",
      "Tags vs. custom fields (finally explained)",
      "Smart lists that actually work",
    ],
  },
  {
    title: "Calendar Mastery",
    items: [
      "Setting up availability correctly",
      "Calendar types and when to use each",
      "Booking pages that convert",
    ],
  },
  {
    title: "Forms & Surveys",
    items: [
      "When to use forms vs. surveys",
      "The hidden settings that break everything",
      "Mobile optimization tricks",
    ],
  },
  {
    title: "Funnels & Websites",
    items: [
      "Funnel vs. website (the eternal confusion)",
      "Templates that actually work",
      "Publishing without breaking things",
    ],
  },
  {
    title: "Automation & Workflows",
    items: [
      "Starting simple (not with 47-step workflows)",
      "The 3 automations every business needs",
      "Fixing 'why didn't it send?' problems",
    ],
  },
  {
    title: "Reputation Management",
    items: [
      "Setting up review campaigns correctly",
      "The Google integration that always confuses",
      "Automated vs. manual requests",
    ],
  },
  {
    title: "Reporting & Analytics",
    items: [
      "Which numbers actually matter",
      "Setting up the dashboard they'll use",
      "Proving ROI to keep them paying",
    ],
  },
];

/**
 * GHL Agency Landing Page Component
 *
 * Complete landing page targeting GoHighLevel agencies with specific
 * pain points and solutions. Uses aggressive, problem-focused copy
 * that resonates with agency owners tired of being tech support.
 */
export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge className="text-sm">For GoHighLevel Agencies</Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
            Your GoHighLevel Onboarding Is Why Clients Ghost You
          </h1>

          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Stop losing clients to GoHighLevel&apos;s overwhelming interface. We
            built the onboarding that actually gets them using the platform –
            tested, proven, and ready for your agency today.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>Built by GoHighLevel agency owners</span>
            <span>•</span>
            <span>Currently onboarding real clients</span>
            <span>•</span>
            <span>No fluff, just what works</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href="/signup"
            >
              Start Free 14-Day Trial →
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
                    : "#modules"
                }
              >
                {session.user.role === "platform_admin"
                  ? "Go to Dashboard"
                  : "See Our 8-Module System"}
              </Link>
            ) : (
              <Link
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                })}
                href="#modules"
              >
                See Our 8-Module System
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">
            Every GoHighLevel Agency Knows This Pain
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/30 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-semibold mb-6 text-center">
              The Monday-to-Cancelled Pipeline:
            </h3>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <strong>Monday:</strong> Client excited, signs up for your
                $297/month plan
              </div>
              <div>
                <strong>Tuesday:</strong> They log into GoHighLevel, see 47 menu
                items, panic
              </div>
              <div>
                <strong>Wednesday:</strong> &quot;Can you show me how
                to...?&quot; texts start
              </div>
              <div>
                <strong>Thursday:</strong> You spend 2 hours on Zoom explaining
                basics
              </div>
              <div>
                <strong>Friday:</strong> They stop responding to your messages
              </div>
              <div>
                <strong>Next Month:</strong> &quot;I want to cancel, this is too
                complicated&quot;
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-6 mb-8 border-l-4 border-primary">
            <p className="italic text-lg mb-2">
              &quot;I spent my entire weekend teaching a dentist how to build a
              basic funnel. That&apos;s when I knew something had to
              change.&quot;
            </p>
            <p className="text-sm text-muted-foreground">
              — Every GoHighLevel agency owner, ever
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">The Hidden Cost:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <X className="size-4 text-destructive" />
                  <span className="text-sm">
                    10+ hours onboarding each client
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="size-4 text-destructive" />
                  <span className="text-sm">
                    Endless &quot;quick questions&quot; that aren&apos;t quick
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="size-4 text-destructive" />
                  <span className="text-sm">
                    Clients using 5% of what they pay for
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="size-4 text-destructive" />
                  <span className="text-sm">
                    Your agency becomes tech support, not strategy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-lg font-semibold mb-4">
            Stop losing weekends to GoHighLevel support
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Fix Your Onboarding Today →
          </Link>
        </div>
      </section>

      {/* Solution Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            We Built What HighLevel Should Have
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete GoHighLevel onboarding that transforms confused clients
            into power users, without you teaching the same things over and
            over.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">📚</div>
              <CardTitle className="text-lg">8 Pre-Built Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Everything from first login to advanced automations. Already
                created, already organized, already proven to work.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">✅</div>
              <CardTitle className="text-lg">
                Completion Tracking That Actually Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Know exactly where clients get stuck. See who needs help before
                they ask (or quit).
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">🏷️</div>
              <CardTitle className="text-lg">Your Branding, Not Ours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Clients see &quot;YourAgency Academy.&quot; Build authority
                while reducing support.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">🎯</div>
              <CardTitle className="text-lg">
                Based on Real Client Behavior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Tested with real GoHighLevel agencies. We know exactly what
                confuses people and fixed it.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Badge className="bg-green-100 text-green-800 text-sm">
            🟢 Ready to Deploy - This isn&apos;t vaporware. Already onboarding
            real agency clients.
          </Badge>
        </div>

        <div className="text-center mt-12">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Get Your White-Label System Now
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            Complete system ready in 60 seconds
          </p>
        </div>
      </section>

      {/* Modules Section */}
      <section className="mb-40" id="modules">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Exactly What Your Clients Get
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {modules.map((module, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">
                  Module {index + 1}: {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {module.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-primary">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/30 rounded-lg p-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Note:</strong> Each module includes videos, checklists, and
            &quot;actually do it&quot; exercises that ensure real
            implementation.
          </p>
        </div>

        <div className="text-center mt-10">
          <p className="text-lg mb-4">All 8 modules. Pre-built. Ready today.</p>
          <Link href="#pricing" className={buttonVariants({ size: "lg" })}>
            See Pricing & Start Trial
          </Link>
        </div>
      </section>

      {/* Results Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            What Happens When Onboarding Actually Works
          </h2>
          <p className="text-muted-foreground">
            Real Results from Our First Client (Digital Desk Media):
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">
                Before Sidecar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">😫</span>
                <span className="text-sm">10+ hours per client onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">😫</span>
                <span className="text-sm">
                  Daily &quot;how do I?&quot; messages
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">😫</span>
                <span className="text-sm">50% clients never fully launch</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">😫</span>
                <span className="text-sm">Constantly teaching basics</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-lg text-green-600">
                After Sidecar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-sm">
                  3 hours per client (mostly strategic)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-sm">
                  Questions about strategy, not buttons
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-sm">85% reach first campaign launch</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-sm">Weekends are yours again</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-primary/5 rounded-lg p-6 border-l-4 border-primary">
          <h3 className="font-semibold mb-4">The Math:</h3>
          <div className="space-y-2 text-sm">
            <div>
              10 clients × 7 hours saved = <strong>70 hours/month</strong>
            </div>
            <div>
              70 hours × $150/hour value = <strong>$10,500/month</strong>
            </div>
            <div>
              Cost of Sidecar = <strong>$297/month</strong>
            </div>
            <div className="text-lg font-semibold text-primary">
              ROI = Obvious
            </div>
          </div>
        </div>
      </section>

      {/* How Agencies Use This Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-6">How Agencies Use This</h2>
          <h3 className="text-2xl font-semibold mb-4">
            Your GHL Onboarding Is Already Built
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            No setup. No configuration. No work.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="text-2xl font-bold text-primary flex-shrink-0">
              •
            </div>
            <div>
              <p className="text-lg">
                <strong>You sign up</strong> (60 seconds)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-2xl font-bold text-primary flex-shrink-0">
              •
            </div>
            <div>
              <p className="text-lg">
                <strong>Send clients the link</strong> (we give it to you)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-2xl font-bold text-primary flex-shrink-0">
              •
            </div>
            <div>
              <p className="text-lg">
                <strong>They stop bothering you</strong> (immediately)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-8 mb-8">
          <p className="text-center text-lg mb-6">
            The entire 8-module GoHighLevel training already exists. Already
            tested. Already working. Already saving agencies 10+ hours per
            client.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p>
                <strong>What your clients see:</strong>
              </p>
              <p className="text-muted-foreground">
                Professional GoHighLevel training
              </p>
            </div>
            <div>
              <p>
                <strong>What you see:</strong>
              </p>
              <p className="text-muted-foreground">
                Their progress in real-time
              </p>
            </div>
            <div>
              <p>
                <strong>What you do:</strong>
              </p>
              <p className="text-muted-foreground">Nothing</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 mb-8">
          <p className="text-lg font-semibold mb-4">
            Ready? It really is this simple.
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Get Started in 60 Seconds
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mb-40" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Early Access for Forward-Thinking Agencies
          </h2>
          <p className="text-muted-foreground">
            Be one of the first 20 GoHighLevel agencies to transform your
            onboarding
          </p>
        </div>

        <Card className="max-w-2xl mx-auto border-2 border-primary">
          <CardHeader className="text-center">
            <Badge className="w-fit mx-auto mb-4">Beta Partner Program</Badge>
            <CardTitle className="text-2xl">$297/month</CardTitle>
            <p className="text-muted-foreground">
              Complete system for your agency
            </p>
            <p className="text-sm text-green-600">
              Early access pricing for founding members
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600" />
                <span className="text-sm">
                  Complete 8-module GoHighLevel onboarding system
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600" />
                <span className="text-sm">Your branding and custom domain</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600" />
                <span className="text-sm">Weekly updates as we improve</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600" />
                <span className="text-sm">
                  Direct access to founders (also GoHighLevel agency owners)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600" />
                <span className="text-sm">
                  Input on new features and modules
                </span>
              </div>
            </div>

            <div className="text-center space-y-4">
              <Link
                className={buttonVariants({
                  size: "lg",
                  className: "w-full",
                })}
                href="/login"
              >
                Claim Your Beta Spot
              </Link>
              <p className="text-xs text-muted-foreground">
                Only accepting 20 agencies to ensure quality support
              </p>
              <p className="text-xs text-muted-foreground">
                No setup fees during beta
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Straight Answers to Real Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Q: How is this different from GoHighLevel&apos;s own training?
                </h3>
                <p className="text-sm text-muted-foreground">
                  A: GoHighLevel&apos;s training is for agencies. This is for
                  your clients. Big difference.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Q: Is this another course about GoHighLevel?
                </h3>
                <p className="text-sm text-muted-foreground">
                  A: No. This is the onboarding you give YOUR clients. It
                  teaches them to use the GoHighLevel account you provide.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Q: How does it work?</h3>
                  <p className="text-sm text-muted-foreground">
                    A: You give us money. We onboard your clients. They stop
                    bothering you.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Q: How much?</h3>
                  <p className="text-sm text-muted-foreground">
                    A: $297/month.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Q: Can I try it?</h3>
                  <p className="text-sm text-muted-foreground">
                    A: Yes. 14 days free.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA after all FAQ cards */}
        <div className="mt-12 text-center">
          <p className="text-lg font-semibold mb-4">
            Got more questions? Let&apos;s talk.
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Start Free Trial →
          </Link>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="mb-40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why We Built This</h2>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">A Note from the Founders:</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We&apos;re Sidecar - the company that transforms complex
                software onboarding into guided, trackable workflows. Our first
                client was Digital Desk Media, a GoHighLevel agency where we got
                tired of:
              </p>
              <ul className="space-y-1 ml-4">
                <li>- Spending weekends on Zoom teaching basics</li>
                <li>
                  - Clients canceling because &quot;it&apos;s too
                  complicated&quot;
                </li>
                <li>- Being tech support instead of strategists</li>
              </ul>
              <p>So we built the onboarding system we wished existed.</p>
              <p>
                Their clients now actually USE what they pay for. Support time
                dropped by 70%. Retention improved dramatically.
              </p>
              <p>Now you can have the same system.</p>
              <p>
                We&apos;re not some VC-funded startup. We&apos;re software
                company founders who solved the onboarding problem and are
                sharing the solution with you.
              </p>
              <p className="text-right font-medium">— The Sidecar Team</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-lg mb-4">
            Built by agency owners. For agency owners.
          </p>
          <Link href="#pricing" className={buttonVariants({ size: "lg" })}>
            Join the Beta Program
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mb-40" id="signup">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop Being GoHighLevel Support. Start Being Strategic.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Your clients hired you for growth, not button-clicking tutorials.
            Give them onboarding that actually works, and get back to what you
            do best – strategy and results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href="/signup"
            >
              Get Beta Access - $297/month
            </Link>
            <Link
              className={buttonVariants({
                size: "lg",
                variant: "outline",
              })}
              href="/demo"
            >
              Book 15-Min Demo
            </Link>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200 max-w-md mx-auto">
            <p className="text-sm font-medium text-green-800 mb-2">
              30-day money back guarantee
            </p>
            <p className="text-xs text-green-600">
              If it doesn&apos;t reduce your support time, full refund. No
              questions.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
