/**
 * Pricing Page - Church Sync Early Access Pricing
 *
 * Founding church pricing with lifetime 50% discount for first 25 churches.
 * Three-tier model: Single Campus, Multi-Campus, Large Network.
 *
 * @page PricingPage
 * @route /pricing
 * @access Public (no authentication required)
 * @returns {JSX.Element} Early access pricing with founding benefits
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <Badge className="mb-4 text-sm bg-orange-100 text-orange-800 border-orange-200">
          Early Access • Limited to 25 Founding Churches
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Founding Church Pricing: 50% Off Forever
        </h1>

        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
          The first 25 churches get lifetime pricing locked in at half the
          regular rate, plus a FREE connect card scanner ($425 value) with
          annual plans.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
        {/* Single Campus Plan */}
        <Card className="flex flex-col">
          <CardHeader className="text-center">
            <Badge className="w-fit mx-auto mb-4">Single Campus</Badge>
            <div className="space-y-2">
              <div className="text-muted-foreground line-through text-lg">
                $158/month
              </div>
              <CardTitle className="text-6xl">$79</CardTitle>
              <div className="text-muted-foreground">/month</div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Perfect for single-location churches
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col space-y-6">
            <h3 className="font-semibold text-center">What&apos;s Included:</h3>

            <ul className="space-y-4 flex-1">
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">200 cards/month</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  AI Vision extraction (high accuracy)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  Batch scanning workflow
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Smart review queue</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Single location</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Email support</span>
              </li>
            </ul>

            <div className="space-y-3">
              <Link href="/signup" className="block">
                <Button className="w-full cursor-pointer" size="lg">
                  Start Today
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Campus Plan - Featured */}
        <Card className="border-2 border-primary shadow-xl relative flex flex-col">
          <Badge className="absolute -top-3 right-4 bg-green-600 text-white border-none hover:bg-green-600">
            FREE $425 Scanner
          </Badge>
          <CardHeader className="text-center pb-6">
            <Badge className="w-fit mx-auto mb-4">Most Popular</Badge>
            <div className="space-y-2">
              <div className="text-muted-foreground line-through text-lg">
                $298/month
              </div>
              <CardTitle className="text-6xl">$149</CardTitle>
              <div className="text-muted-foreground">/month</div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              For multi-campus churches
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col space-y-6">
            <h3 className="font-semibold text-center">What&apos;s Included:</h3>

            <ul className="space-y-4 flex-1">
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">500 cards/month</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  All Single Campus features
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  FREE Scanner with annual plan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  Multi-campus support
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Team permissions</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Priority support</span>
              </li>
            </ul>

            <div className="space-y-3">
              <Link href="/signup" className="block">
                <Button className="w-full cursor-pointer" size="lg">
                  Start Today
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Large Network Plan */}
        <Card className="relative flex flex-col">
          <Badge className="absolute -top-3 right-4 bg-green-600 text-white border-none hover:bg-green-600">
            FREE $425 Scanner
          </Badge>
          <CardHeader className="text-center">
            <Badge className="w-fit mx-auto mb-4">Large Network</Badge>
            <div className="space-y-2">
              <div className="text-muted-foreground line-through text-lg">
                $598/month
              </div>
              <CardTitle className="text-6xl">$299</CardTitle>
              <div className="text-muted-foreground">/month</div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              For large church networks
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col space-y-6">
            <h3 className="font-semibold text-center">What&apos;s Included:</h3>

            <ul className="space-y-4 flex-1">
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Unlimited cards</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  All Multi-Campus features
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  FREE Scanner with annual plan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Multiple locations</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  White-glove onboarding
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                  <CheckIcon className="size-4" />
                </div>
                <span className="text-sm font-medium">Phone support</span>
              </li>
            </ul>

            <div className="space-y-3">
              <Link href="/signup" className="block">
                <Button className="w-full cursor-pointer" size="lg">
                  Start Today
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="text-center space-y-6 bg-muted/50 rounded-lg p-12 mb-16">
        <h2 className="text-3xl font-bold">Early Access Questions</h2>
        <Accordion
          type="single"
          collapsible
          className="max-w-4xl mx-auto text-left"
          defaultValue="item-1"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Who built this?</AccordionTrigger>
            <AccordionContent>
              Church Sync was developed in partnership with NewLife
              Church&apos;s operations team. We build the technology, they
              ensure it works for real church workflows across their 5 campuses
              and 2,000 members.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>When can we start?</AccordionTrigger>
            <AccordionContent>
              NewLife Church has been live since October 2024. Founding churches
              begin onboarding in January 2025. We&apos;re accepting
              applications now for the first 25 spots.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              What if it doesn&apos;t work for us?
            </AccordionTrigger>
            <AccordionContent>
              30-day money back guarantee, no questions asked. We&apos;ll even
              pay return shipping on the scanner if you decide it&apos;s not the
              right fit.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Can we influence features?</AccordionTrigger>
            <AccordionContent>
              Absolutely. Founding churches get monthly feedback calls and
              direct input on our feature roadmap. Your real-world needs will
              shape what we build next.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Is our data secure?</AccordionTrigger>
            <AccordionContent>
              Bank-level encryption with complete data isolation. Your church
              data never mingles with other organizations. We use role-based
              access control, audit logs, and regular backups.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>What makes you different?</AccordionTrigger>
            <AccordionContent>
              We&apos;re partnered with church operators, not just selling
              software. Every feature has been tested in real Sunday services at
              NewLife Church. We understand the Monday morning data entry
              problem because we&apos;ve solved it.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Final CTA */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">
          Join the 25 Founding Churches
        </h2>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          NewLife Church went from 20 hours weekly to under 2 hours. Get the
          same results plus 50% off forever, a FREE scanner, and direct input on
          features.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-block">
            <Button size="lg" className="cursor-pointer">
              Request Early Access
            </Button>
          </Link>
          <Link href="/demo" className="inline-block">
            <Button size="lg" variant="outline" className="cursor-pointer">
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
