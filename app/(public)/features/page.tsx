/**
 * Features Page - Church Sync AI Early Access Capabilities
 *
 * Showcase of platform features being built in partnership with NewLife Church.
 * Positions features as battle-tested solutions with real-world proof points.
 *
 * Target Audience: Churches interested in founding church program
 * Focus: Feature benefits with NewLife Church validation
 * CTA: Drive early access applications
 *
 * @page FeaturesPage
 * @route /features
 * @access Public (no authentication required)
 * @returns {JSX.Element} Early access features showcase
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/**
 * Platform Features
 * Core capabilities tested and validated at NewLife Church
 */
const features = [
  {
    title: "AI Vision Extraction",
    description:
      "Claude AI reads handwriting from connect cards with 95% accuracy. Automatically extracts names, emails, phone numbers, prayer requests, interests, and volunteer preferences. NewLife processes 500+ cards weekly with this technology.",
    icon: "🤖",
  },
  {
    title: "Batch Scanning Workflow",
    description:
      "Use a ScanSnap scanner or phone camera to capture entire stacks of connect cards. Drag-and-drop interface handles multiple files at once. NewLife reduced processing time from 20 hours to under 2 hours weekly.",
    icon: "📱",
  },
  {
    title: "Smart Review Queue",
    description:
      "AI-extracted data appears alongside original card images. Fix any errors in seconds with keyboard shortcuts. Average 2 minutes per card at NewLife—down from 6-8 minutes manual entry.",
    icon: "✅",
  },
  {
    title: "Multi-Campus Management",
    description:
      "Manage multiple church locations in one unified system. Location-based permissions ensure staff only see their campus data. NewLife runs 5 campuses through the platform.",
    icon: "⛪",
  },
  {
    title: "Automated Visitor Follow-Up",
    description:
      "SMS and email campaigns reach first-time visitors within 24 hours. Personalized messages based on their interests and prayer requests. Track engagement and response rates across all campuses.",
    icon: "💬",
  },
  {
    title: "Prayer Request Pipeline",
    description:
      "Prayer requests extracted from connect cards route directly to your prayer team. Categorize by urgency, assign follow-up, mark as answered. Ensure no prayer request gets forgotten in the stack.",
    icon: "🙏",
  },
  {
    title: "Volunteer Coordination",
    description:
      "Automatically match volunteer interests from connect cards to upcoming events. Send group SMS with calendar signup links. Store volunteer preferences for future event staffing.",
    icon: "🙋",
  },
  {
    title: "Team Permissions",
    description:
      "Invite staff with role-based access control. Campus admins see only their location. Account owners manage the entire organization. Control who can upload, review, and export data.",
    icon: "👨‍💼",
  },
  {
    title: "Analytics Dashboard",
    description:
      "Track first-time visitor trends, prayer request categories, and volunteer interest patterns. Weekly comparisons help you identify what's working and where to improve follow-up.",
    icon: "📊",
  },
  {
    title: "Member Journey Tracking",
    description:
      "Follow each visitor's path from first connect card to regular attendance. N2N (Newcomer to Next-Step) pipeline ensures you never lose track of someone needing follow-up.",
    icon: "👥",
  },
  {
    title: "Staff Training System",
    description:
      "Built-in learning management for onboarding church staff and volunteers. Create courses with video lessons, track completion, issue certificates. Keep your team trained on the platform.",
    icon: "🎓",
  },
  {
    title: "Enterprise Security",
    description:
      "Bank-level encryption with complete data isolation. Your church data never mingles with other organizations. Role-based access control, audit logs, and regular backups ensure your data stays safe.",
    icon: "🔒",
  },
];

/**
 * Features Page Component
 */
export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <Badge className="mb-4 text-sm bg-orange-100 text-orange-800 border-orange-200">
          Early Access • Built with NewLife Church
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Features Battle-Tested on 500+ Connect Cards Weekly
        </h1>

        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
          NewLife Church runs 5 campuses through this platform. Every feature
          below has been tested in real Sunday services, refined based on staff
          feedback, and proven to save 18+ hours weekly.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call-to-Action Section */}
      <div className="text-center space-y-6 bg-muted/50 rounded-lg p-12">
        <h2 className="text-3xl font-bold">Join the 25 Founding Churches</h2>

        <p className="text-muted-foreground max-w-[600px] mx-auto">
          NewLife Church went from 20 hours of manual data entry to under 2
          hours weekly. Now we&apos;re opening this solution to 25 churches who
          want the same results—plus lifetime discounts and direct input on
          features.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-left mb-6">
          <div>
            <p className="font-semibold text-primary mb-1">50% Off Forever</p>
            <p className="text-muted-foreground text-xs">
              Locked-in lifetime pricing for founding churches
            </p>
          </div>
          <div>
            <p className="font-semibold text-primary mb-1">FREE $425 Scanner</p>
            <p className="text-muted-foreground text-xs">
              ScanSnap ix1600 included with annual plan
            </p>
          </div>
          <div>
            <p className="font-semibold text-primary mb-1">Shape the Product</p>
            <p className="text-muted-foreground text-xs">
              Monthly calls to influence feature roadmap
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg">Request Early Access</Button>
          </Link>

          <Link href="/demo">
            <Button size="lg" variant="outline">
              Schedule a Demo
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Limited to 25 founding churches • 30-day guarantee, no questions asked
        </p>
      </div>
    </div>
  );
}
