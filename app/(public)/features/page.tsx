/**
 * Features Page - Product demonstration and value proposition
 *
 * Strategic marketing page that showcases platform capabilities and drives conversion
 * through detailed feature communication, benefit-focused messaging, and compelling
 * call-to-action placement. Designed to overcome objections and build purchase intent.
 *
 * Business Objectives:
 * - Demonstrate platform value through comprehensive feature showcase
 * - Address common pain points and objections in IV therapy business operations
 * - Build purchase intent through benefit-focused feature descriptions
 * - Drive trial signups and course browsing through strategic CTAs
 * - Establish platform authority and comprehensive solution positioning
 *
 * Marketing Psychology Strategy:
 * - Problem-Solution Fit: Each feature addresses specific business pain points
 * - Quantified Benefits: "increases your average patient value by 30%"
 * - Authority Positioning: "Complete Platform Solution" trust signal
 * - Social Proof: "hundreds of IV therapy clinics already using"
 * - Urgency/Scarcity: "Ready to transform your clinic?" compelling headline
 *
 * User Journey Integration:
 * 1. Discovery: Users arrive from homepage "See a Demo" CTA
 * 2. Evaluation: Detailed feature review and benefit assessment
 * 3. Consideration: Comprehensive platform understanding development
 * 4. Conversion: Trial signup or training exploration through CTAs
 *
 * Feature Communication Strategy:
 * - Outcome-Focused Headlines: "Revenue Optimization" vs "Pricing Tools"
 * - Specific Benefits: "reduces no-shows" vs "scheduling system"
 * - Quantified Results: "30% increase" provides concrete expectations
 * - Emotional Triggers: "Smart", "Intelligent", "Seamlessly" language
 * - Professional Icons: Visual appeal with quick feature recognition
 *
 * Conversion Optimization Elements:
 * - Trust Badge: "Complete Platform Solution" establishes authority
 * - Compelling Headline: Addresses core business desire (scaling)
 * - Social Proof: "hundreds of IV therapy clinics" builds confidence
 * - Dual CTAs: Primary (free trial) + Secondary (training) options
 * - Feature Grid: Easy scanning and comparison of capabilities
 *
 * SEO & Performance Strategy:
 * - Semantic HTML structure with proper heading hierarchy
 * - Feature-rich content for search engine crawlability
 * - Server-side rendering for fast initial load and SEO benefits
 * - Descriptive feature content for long-tail keyword targeting
 *
 * @page FeaturesPage
 * @route /features
 * @access Public (no authentication required)
 * @returns {JSX.Element} Complete features showcase with conversion elements
 *
 * @example
 * // User journey from homepage:
 * // 1. User clicks "See a Demo" from homepage
 * // 2. Lands on /features to explore platform capabilities
 * // 3. Reviews feature grid and benefit descriptions
 * // 4. Clicks "Start Free Trial" or "Browse Training" CTA
 * // 5. Proceeds to signup/login or course catalog
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/**
 * Platform Features Array
 *
 * Strategically curated feature set that addresses the top 6 pain points and
 * opportunities in IV therapy business operations. Each feature is positioned
 * to demonstrate clear business value and competitive advantage.
 *
 * Marketing Strategy:
 * - Pain Point Resolution: Each feature solves a specific operational challenge
 * - Benefit-Focused Messaging: Emphasizes outcomes over technical capabilities
 * - Quantified Value: Specific metrics ("30% increase") build credibility
 * - Emotional Language: "Smart", "Intelligent", "Seamlessly" creates appeal
 * - Professional Authority: Industry-specific terminology and understanding
 *
 * Feature Selection Rationale:
 * 1. Booking System: Addresses scheduling inefficiencies (top operational pain)
 * 2. Communications: Tackles patient retention and engagement challenges
 * 3. Revenue Optimization: Appeals to growth-minded business owners
 * 4. Compliance: Reduces legal/regulatory anxiety (major concern in healthcare)
 * 5. Analytics: Enables data-driven decision making (appeals to modern owners)
 * 6. Integration: Addresses existing system compatibility concerns
 *
 * Psychological Triggers:
 * - Efficiency: "maximizes your calendar efficiency"
 * - Growth: "increases your average patient value by 30%"
 * - Security: "keeps you protected"
 * - Intelligence: "intelligent scheduling", "smart communications"
 * - Simplicity: "Made Easy", "Seamlessly connects"
 *
 * Visual Design:
 * - Emoji icons for approachable, non-intimidating feel
 * - Card layout for easy scanning and comparison
 * - Consistent structure for cognitive ease
 * - Benefit-focused headlines for quick value assessment
 *
 * @constant {Array<{title: string, description: string, icon: string}>} features
 */
const features = [
  {
    title: "Client Onboarding Automation",
    description:
      "Stop spending 10 hours teaching GHL basics. Pre-built onboarding that gets clients actually using the platform.",
    icon: "🚀",
  },
  {
    title: "8-Module GHL Training",
    description:
      "Complete curriculum that transforms confused clients into power users who launch campaigns and stick around.",
    icon: "📚",
  },
  {
    title: "Progress Tracking Dashboard",
    description:
      "See which clients are stuck before they cancel. Know exactly who needs help and who's crushing it.",
    icon: "📊",
  },
  {
    title: "White-Label Ready",
    description:
      "Your brand, not ours. Clients never know it's Sidecar. Full customization with your logo and colors.",
    icon: "🏷️",
  },
  {
    title: "Support Ticket Reduction",
    description:
      "Clients self-serve instead of texting you at 9pm. Cut support time by 70% with guided walkthroughs.",
    icon: "💬",
  },
  {
    title: "Agency Analytics",
    description:
      "Know which clients are about to churn before they do. Track engagement, usage, and success metrics.",
    icon: "📈",
  },
];

/**
 * Features Page Component
 *
 * Complete features showcase page that communicates platform value through
 * strategic feature presentation, benefit-focused messaging, and compelling
 * conversion elements. Designed to build purchase intent and drive action.
 *
 * Page Structure:
 * 1. Hero Section: Authority positioning + value proposition
 * 2. Features Grid: Comprehensive capability demonstration
 * 3. CTA Section: Social proof + dual conversion paths
 *
 * Conversion Psychology:
 * - Authority: "Complete Platform Solution" establishes expertise
 * - Aspiration: "scale your IV therapy business" appeals to growth desire
 * - Comprehensiveness: "every aspect" reduces concern about gaps
 * - Social Proof: "hundreds of clinics" builds confidence through popularity
 * - Action Urgency: "Ready to transform" creates decision pressure
 *
 * @component FeaturesPage
 * @returns {JSX.Element} Complete features showcase with conversion elements
 */
export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section - Authority positioning and value proposition */}
      <div className="text-center space-y-6 mb-16">
        {/* Trust Badge - Establishes platform authority and completeness */}
        <Badge className="mb-4">Complete Platform Solution</Badge>

        {/* Primary Headline - Appeals to core business desire (scaling) */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Everything you need to stop being GHL tech support
        </h1>

        {/* Supporting Copy - Comprehensive value promise with benefit focus */}
        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
          From client onboarding to retention, our platform transforms confused
          GHL users into successful agencies that actually launch campaigns and
          stick around.
        </p>
      </div>

      {/* Features Grid - Comprehensive capability demonstration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {features.map((feature, index) => (
          /* Feature Card - Benefit-focused presentation with visual appeal */
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {/* Feature Icon - Visual recognition and approachable design */}
              <div className="text-4xl mb-4">{feature.icon}</div>

              {/* Feature Title - Outcome-focused headlines */}
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>

            <CardContent>
              {/* Feature Description - Specific benefits and quantified results */}
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call-to-Action Section - Social proof and conversion drivers */}
      <div className="text-center space-y-6 bg-muted/50 rounded-lg p-12">
        {/* CTA Headline - Creates decision urgency and transformation appeal */}
        <h2 className="text-3xl font-bold">
          Ready to stop losing clients to GHL confusion?
        </h2>

        {/* Social Proof Copy - Builds confidence through peer validation */}
        <p className="text-muted-foreground max-w-[600px] mx-auto">
          Join forward-thinking agencies using Sidecar to transform confused GHL
          clients into power users who actually launch campaigns.
        </p>

        {/* Dual CTA Strategy - Primary and secondary conversion paths */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Primary CTA - Free trial for immediate value and low barrier */}
          <Link href="/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>

          {/* Secondary CTA - Direct to signup for new users */}
          <Link href="/signup">
            <Button size="lg" variant="outline">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
