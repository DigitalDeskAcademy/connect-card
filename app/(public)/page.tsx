/**
 * Church Sync - Demo Landing Page
 *
 * Simplified landing page for demos. No marketing language or
 * partner church references.
 *
 * @page Demo Landing
 * @route /
 * @access Public (no authentication required)
 */

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";

import Link from "next/link";
import AdminLink from "./_components/AdminLink";

export const metadata: Metadata = {
  title: "Church Sync - Connect Card Management",
  description:
    "AI-powered connect card processing for churches. Transform hours of manual entry into minutes.",
};

/**
 * Workflow Steps
 */
const workflowSteps = [
  {
    title: "Capture",
    description:
      "Use a scanner or phone camera to capture stacks of connect cards in minutes.",
    icon: "📸",
  },
  {
    title: "Extract",
    description:
      "AI reads handwritten cards and understands what people mean, just like a person would.",
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
 * Demo Landing Page
 */
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <article>
      {/* Hero Section */}
      <section aria-labelledby="hero-title" className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1
            id="hero-title"
            className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl"
          >
            Connect Card Management Made Simple
          </h1>

          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Stop spending hours on manual data entry. Church Sync uses AI to
            read connect cards and automatically route visitors, volunteers, and
            prayer requests to the right people.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <AdminLink session={session} />

            {!session && (
              <Link
                className={buttonVariants({
                  size: "lg",
                })}
                href="/login"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section aria-labelledby="workflow-title" className="mb-40" id="solution">
        <div className="text-center mb-12">
          <h2 id="workflow-title" className="text-3xl font-bold mb-4">
            How It Works
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
      </section>

      {/* Features Section */}
      <section aria-labelledby="features-title" className="mb-40">
        <div className="text-center mb-12">
          <h2 id="features-title" className="text-3xl font-bold mb-4">
            What You Can Do
          </h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-lg mb-2">Connect Cards</h3>
              <p className="text-sm text-muted-foreground">
                Upload scanned cards or use your phone camera. AI extracts
                names, contact info, and interests automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">🙏</div>
              <h3 className="font-semibold text-lg mb-2">Prayer Requests</h3>
              <p className="text-sm text-muted-foreground">
                Prayer requests are automatically categorized and routed to your
                prayer team with privacy controls.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">🙋</div>
              <h3 className="font-semibold text-lg mb-2">Volunteer Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                Track volunteer interests, assign to ministries, and automate
                onboarding with welcome messages.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-semibold text-lg mb-2">Multi-Campus</h3>
              <p className="text-sm text-muted-foreground">
                Manage multiple locations with location-specific permissions and
                unified reporting.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-lg mb-2">SMS & Email</h3>
              <p className="text-sm text-muted-foreground">
                Automated welcome messages to volunteers. Send follow-ups via
                SMS and email integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-lg mb-2">Export & Sync</h3>
              <p className="text-sm text-muted-foreground">
                Export contacts to Planning Center, Breeze, or custom CSV
                formats for your church management system.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section aria-labelledby="cta-title" className="mb-40">
        <div className="text-center">
          <h2 id="cta-title" className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Sign in to access your dashboard and start processing connect cards.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AdminLink session={session} />

            {!session && (
              <Link
                className={buttonVariants({
                  size: "lg",
                })}
                href="/login"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
