/**
 * Agency Homepage Content - White-label version for IV Clinic Owners
 *
 * Complete homepage content tailored specifically for IV therapy clinic owners
 * using Digital Desk. Focuses on onboarding and getting started.
 */

"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

/**
 * Module Interface for IV Clinic Training System
 */
interface ModuleProps {
  title: string;
  items: string[];
}

/**
 * 8-Module IV Clinic Training System
 * Complete onboarding curriculum for IV therapy clinic owners
 * using Digital Desk platform.
 */
const modules: ModuleProps[] = [
  {
    title: "Book Your First IV Patient",
    items: [
      "Set up vitamin drip bookings in 20 minutes",
      "Configure NAD+, Myers, and custom IV packages",
      "Payment holds for no-shows (save $300/week)",
    ],
  },
  {
    title: "One Inbox for Everything",
    items: [
      "Stop checking 5 apps for patient messages",
      "Auto-reply while you're with patients",
      "Understanding HIPAA: Know what you actually need",
    ],
  },
  {
    title: "Get Paid Instantly",
    items: [
      "Accept cards, HSA, and memberships seamlessly",
      "IV therapy packages that sell themselves",
      "Monthly memberships on autopilot",
    ],
  },
  {
    title: "Fill Empty IV Chairs",
    items: [
      "'Hangover Sunday' campaigns that book out",
      "Pre-appointment hydration reminders",
      "Win-back campaigns for dormant patients",
    ],
  },
  {
    title: "Run Your Clinic From Bed",
    items: [
      "Check tomorrow's schedule at 10pm",
      "Update inventory between appointments",
      "Message your nurse about room 3",
    ],
  },
  {
    title: "5-Star Reviews on Autopilot",
    items: [
      "Happy patients get review requests",
      "Unhappy ones get a personal call first",
      "Watch your Google ranking climb",
    ],
  },
  {
    title: "Know Your Real Numbers",
    items: [
      "Which IV drips actually make money",
      "Your true cost per patient acquisition",
      "Staff productivity without micromanaging",
    ],
  },
  {
    title: "Go Live With Confidence",
    items: [
      "Test booking with your mom first",
      "Staff training that takes 30 minutes",
      "What to do when something breaks",
    ],
  },
];

/**
 * Agency Homepage Content Component
 *
 * IV clinic-focused onboarding page that gets users excited to start
 * their Digital Desk academy training.
 */
export function AgencyHomepageContent() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to Your Digital Desk Academy
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
            Get Your IV Clinic Running on Digital Desk in 7 Days
          </h2>

          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Follow our proven setup process and start accepting online bookings,
            automating follow-ups, and growing your clinic.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>Built by Digital Desk</span>
            <span>•</span>
            <span>Currently onboarding new clients</span>
            <span>•</span>
            <span>No fluff, just what works</span>
          </div>

          <div className="flex justify-center mt-8">
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href="#modules"
            >
              Get Started With Module 1
            </Link>
          </div>
        </div>
      </section>

      {/* 7-Day Setup Path Section */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Your 7-Day Setup Path</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete Digital Desk setup that transforms your clinic from chaotic
            to organized, without you learning everything the hard way.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 1-2:</strong> Get bookings flowing
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 3:</strong> Connect payments and messaging
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 4:</strong> Activate text marketing
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 5-6:</strong> Mobile app and reviews
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 7:</strong> Launch with confidence
            </span>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="mb-20" id="modules">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            8 Modules to Transform Your Clinic
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
            <strong>Ready to implement:</strong> Each module takes 30-45 minutes
            with step-by-step videos, copy-paste templates, and &ldquo;do it
            with me&rdquo; exercises. No theory, just action.
          </p>
        </div>
      </section>

      {/* Results Section */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            What Happens When You Complete This Academy
          </h2>
          <p className="text-muted-foreground text-xl mb-8">After This Week:</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 mb-12">
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              Online bookings working on autopilot
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              All messages in one inbox
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              Automated review requests after visits
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              SMS reminders reducing no-shows
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              Mobile app for managing anywhere
            </span>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-6 border-l-4 border-primary max-w-3xl mx-auto">
          <h3 className="font-semibold mb-4">The Math:</h3>
          <div className="space-y-2 text-sm">
            <div>
              10 hours saved per week = <strong>40 hours/month</strong>
            </div>
            <div>
              30% fewer no-shows = <strong>$3,000+/month recovered</strong>
            </div>
            <div>
              2x more online reviews = <strong>More new patients</strong>
            </div>
            <div className="text-lg font-semibold text-primary mt-4">
              ROI = Your time back to focus on patients
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mb-20" id="signup">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Clinic?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join the growing community of IV therapy clinics already using
            Digital Desk to run their business better.
          </p>

          <div className="flex justify-center mb-8">
            <Link
              className={buttonVariants({
                size: "lg",
              })}
              href="#modules"
            >
              Start Module 1 Now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
