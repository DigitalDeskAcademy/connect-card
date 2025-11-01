/**
 * Church Homepage Content - Welcome page for church administrators
 *
 * Complete homepage content tailored specifically for church administrators
 * using ChurchSyncAI. Focuses on onboarding and getting started.
 */

"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

/**
 * Module Interface for Church Training System
 */
interface ModuleProps {
  title: string;
  items: string[];
}

/**
 * 8-Module Church Training System
 * Complete onboarding curriculum for church administrators
 * using ChurchSyncAI platform.
 */
const modules: ModuleProps[] = [
  {
    title: "Process Your First Connect Cards",
    items: [
      "Upload connect cards in minutes using AI Vision",
      "Automatic data extraction from handwritten cards",
      "Review and correct flagged entries",
    ],
  },
  {
    title: "Manage Your Members",
    items: [
      "Track first-time visitors through membership",
      "View complete engagement history",
      "Add notes and follow-up reminders",
    ],
  },
  {
    title: "Organize Your Team",
    items: [
      "Invite staff and volunteers",
      "Assign location-based permissions",
      "Track who's processing connect cards",
    ],
  },
  {
    title: "Automate Follow-Up",
    items: [
      "Welcome messages for first-time visitors",
      "Prayer request follow-up reminders",
      "Re-engagement campaigns for inactive members",
    ],
  },
  {
    title: "Manage Multiple Locations",
    items: [
      "View data across all campuses",
      "Location-specific staff access",
      "Compare engagement by location",
    ],
  },
  {
    title: "Train Your Volunteers",
    items: [
      "Access built-in training courses",
      "Volunteer scheduling and management",
      "Track volunteer engagement",
    ],
  },
  {
    title: "Know Your Numbers",
    items: [
      "First-time visitor conversion rates",
      "Engagement trends over time",
      "Location performance insights",
    ],
  },
  {
    title: "Go Live With Confidence",
    items: [
      "Test with your team first",
      "Staff training resources",
      "Support when you need it",
    ],
  },
];

/**
 * Church Homepage Content Component
 *
 * Church-focused onboarding page that gets administrators excited to start
 * their ChurchSyncAI academy training.
 */
export function AgencyHomepageContent() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to Your ChurchSyncAI Dashboard
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
            Get Your Church Running on ChurchSyncAI in 7 Days
          </h2>

          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Follow our proven setup process and start digitizing connect cards,
            automating follow-ups, and growing your church.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>Built for Churches</span>
            <span>•</span>
            <span>Currently onboarding new churches</span>
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
            Complete ChurchSyncAI setup that transforms your church operations
            from chaotic to organized, without you learning everything the hard
            way.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 1-2:</strong> Start processing connect cards
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 3:</strong> Invite your team and set permissions
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 4:</strong> Set up member management
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <CheckCircle className="size-6 text-green-600 flex-shrink-0" />
            <span className="text-lg">
              <strong>Day 5-6:</strong> Configure follow-up workflows
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
            8 Modules to Transform Your Church Operations
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
              Connect card processing on autopilot
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              All member data in one place
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              Automated follow-up for first-time visitors
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              SMS and email engagement working
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 bg-primary rounded-lg">
            <CheckCircle className="size-6 text-white flex-shrink-0" />
            <span className="text-lg text-white">
              Team trained and ready to use the system
            </span>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-6 border-l-4 border-primary max-w-3xl mx-auto">
          <h3 className="font-semibold mb-4">The Impact:</h3>
          <div className="space-y-2 text-sm">
            <div>
              10 hours saved per week = <strong>40 hours/month</strong>
            </div>
            <div>
              Better visitor follow-up = <strong>Higher retention rates</strong>
            </div>
            <div>
              Digital connect cards = <strong>Zero data entry errors</strong>
            </div>
            <div className="text-lg font-semibold text-primary mt-4">
              ROI = Your time back to focus on ministry
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mb-20" id="signup">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Church Operations?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join the growing community of churches already using ChurchSyncAI to
            streamline their member engagement.
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
