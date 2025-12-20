/**
 * Church Sync - Demo Landing Page
 *
 * Modern, polished landing page for demos.
 *
 * @page Demo Landing
 * @route /
 * @access Public (no authentication required)
 */

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  Camera,
  Sparkles,
  CheckCircle,
  Users,
  FileText,
  Heart,
  MapPin,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";

import Link from "next/link";
import AdminLink from "./_components/AdminLink";
import { IntegrationFAQ } from "./_components/integration-faq";

export const metadata: Metadata = {
  title: "Church Sync - Connect Card Management",
  description:
    "AI-powered connect card processing for churches. Transform hours of manual entry into minutes.",
};

const workflowSteps = [
  {
    title: "Capture",
    description: "Scan stacks of cards with a scanner or phone camera",
    icon: Camera,
  },
  {
    title: "Extract",
    description: "AI reads handwriting and understands context",
    icon: Sparkles,
  },
  {
    title: "Review",
    description: "Quick corrections with keyboard shortcuts",
    icon: CheckCircle,
  },
  {
    title: "Connect",
    description: "Auto-route to the right people and teams",
    icon: Users,
  },
];

const features = [
  {
    title: "Connect Cards",
    description:
      "Upload scanned cards or use your phone. AI extracts names, contact info, and interests.",
    icon: FileText,
    color: "from-blue-500/20 to-blue-600/5",
  },
  {
    title: "Prayer Requests",
    description:
      "Automatically categorized and routed to your prayer team with privacy controls.",
    icon: Heart,
    color: "from-rose-500/20 to-rose-600/5",
  },
  {
    title: "Volunteer Pipeline",
    description:
      "Track interests, assign to ministries, automate onboarding with welcome messages.",
    icon: Users,
    color: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    title: "Multi-Campus",
    description:
      "Location-specific permissions and unified reporting across all your campuses.",
    icon: MapPin,
    color: "from-amber-500/20 to-amber-600/5",
  },
  {
    title: "SMS & Email",
    description:
      "Automated welcome messages and follow-ups via integrated SMS and email.",
    icon: MessageSquare,
    color: "from-violet-500/20 to-violet-600/5",
  },
  {
    title: "Export & Sync",
    description:
      "Export to Planning Center, Breeze, or custom CSV for your church management system.",
    icon: ArrowUpRight,
    color: "from-cyan-500/20 to-cyan-600/5",
  },
];

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <article className="relative">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden px-4">
        {/* Background gradient - with rounded corners and inset */}
        <div className="absolute inset-4 md:inset-8 -z-10 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/15 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto px-4">
          <Badge variant="secondary" className="px-4 py-1.5 text-sm">
            AI-Powered Church Management
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text">
            Connect Card Management
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>

          <p className="max-w-2xl text-muted-foreground text-lg md:text-xl leading-relaxed">
            Stop spending hours on manual data entry. Church Sync uses AI to
            read connect cards and automatically route visitors, volunteers, and
            prayer requests to the right people.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {session ? (
              <AdminLink session={session} />
            ) : (
              <Link
                className={buttonVariants({
                  size: "lg",
                  className: "text-base px-8",
                })}
                href="/login"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              From paper to people in four simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connector line - goes through center of numbered circles, hidden on mobile */}
            <div className="hidden lg:block absolute top-6 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {workflowSteps.map((step, index) => (
                <div
                  key={index}
                  className="relative flex flex-col items-center"
                >
                  {/* Step number badge */}
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-6 shadow-lg shadow-primary/25">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm text-center max-w-[200px]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg">
              Powerful features designed for church staff
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border bg-card p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>

                  <h3 className="font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data & Security FAQ Section */}
      <IntegrationFAQ />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

            <div className="relative p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Sign in to access your dashboard and start processing connect
                cards today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  <AdminLink session={session} />
                ) : (
                  <Link
                    className={buttonVariants({
                      size: "lg",
                      className: "text-base px-8",
                    })}
                    href="/login"
                  >
                    Sign In to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
