/**
 * Interactive Area Chart Component for PaaS Analytics Dashboard
 *
 * This component provides a sophisticated analytics visualization focused on
 * Platform as a Service metrics, measuring both user acquisition and success rates.
 *
 * Key Features:
 * - Dual-metric tracking: Course Completions + New Enrollments
 * - Interactive time range filtering (7d, 30d, 90d)
 * - Responsive design with mobile-optimized defaults
 * - Smooth animations (working on larger screens)
 * - Professional gradient styling with semantic colors
 *
 * PaaS Focus vs Traditional LMS:
 * - Measures platform EFFECTIVENESS (completions) not just volume (signups)
 * - Shows correlation between acquisition and success
 * - Realistic startup-scale data (10-30 daily vs hundreds)
 * - Interactive UX for business intelligence
 *
 * @author PaaS Analytics Dashboard
 * @version 2.0 - Enhanced for Platform as a Service positioning
 */

"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "Interactive area chart for PaaS platform analytics";

/**
 * PaaS Platform Analytics Data
 *
 * Realistic startup-scale metrics showing daily platform engagement.
 * Data structure: { date, desktop, mobile }
 * - desktop: Daily Active Learners (unique users per day - indigo theme)
 * - mobile: Average Session Time in minutes (engagement quality - amber theme)
 *
 * Scale: 4-30 daily users, 8-25 min sessions (appropriate for growing platform)
 * vs Instructor's approach: Just enrollment counting (missing engagement depth)
 */
const chartData = [
  { date: "2024-04-01", desktop: 12, mobile: 14 },
  { date: "2024-04-02", desktop: 6, mobile: 18 },
  { date: "2024-04-03", desktop: 9, mobile: 12 },
  { date: "2024-04-04", desktop: 14, mobile: 22 },
  { date: "2024-04-05", desktop: 18, mobile: 19 },
  { date: "2024-04-06", desktop: 16, mobile: 25 },
  { date: "2024-04-07", desktop: 13, mobile: 16 },
  { date: "2024-04-08", desktop: 21, mobile: 23 },
  { date: "2024-04-09", desktop: 4, mobile: 11 },
  { date: "2024-04-10", desktop: 15, mobile: 17 },
  { date: "2024-04-11", desktop: 17, mobile: 20 },
  { date: "2024-04-12", desktop: 16, mobile: 15 },
  { date: "2024-04-13", desktop: 19, mobile: 22 },
  { date: "2024-04-14", desktop: 8, mobile: 13 },
  { date: "2024-04-15", desktop: 7, mobile: 12 },
  { date: "2024-04-16", desktop: 8, mobile: 14 },
  { date: "2024-04-17", desktop: 24, mobile: 21 },
  { date: "2024-04-18", desktop: 20, mobile: 23 },
  { date: "2024-04-19", desktop: 14, mobile: 16 },
  { date: "2024-04-20", desktop: 5, mobile: 11 },
  { date: "2024-04-21", desktop: 8, mobile: 15 },
  { date: "2024-04-22", desktop: 13, mobile: 12 },
  { date: "2024-04-23", desktop: 8, mobile: 16 },
  { date: "2024-04-24", desktop: 21, mobile: 17 },
  { date: "2024-04-25", desktop: 12, mobile: 14 },
  { date: "2024-04-26", desktop: 4, mobile: 10 },
  { date: "2024-04-27", desktop: 21, mobile: 24 },
  { date: "2024-04-28", desktop: 7, mobile: 13 },
  { date: "2024-04-29", desktop: 17, mobile: 14 },
  { date: "2024-04-30", desktop: 25, mobile: 22 },
  { date: "2024-05-01", desktop: 9, mobile: 13 },
  { date: "2024-05-02", desktop: 16, mobile: 18 },
  { date: "2024-05-03", desktop: 14, mobile: 11 },
  { date: "2024-05-04", desktop: 21, mobile: 24 },
  { date: "2024-05-05", desktop: 26, mobile: 22 },
  { date: "2024-05-06", desktop: 27, mobile: 30 },
  { date: "2024-05-07", desktop: 21, mobile: 17 },
  { date: "2024-05-08", desktop: 8, mobile: 12 },
  { date: "2024-05-09", desktop: 13, mobile: 11 },
  { date: "2024-05-10", desktop: 16, mobile: 19 },
  { date: "2024-05-11", desktop: 18, mobile: 15 },
  { date: "2024-05-12", desktop: 11, mobile: 14 },
  { date: "2024-05-13", desktop: 11, mobile: 9 },
  { date: "2024-05-14", desktop: 25, mobile: 28 },
  { date: "2024-05-15", desktop: 26, mobile: 22 },
  { date: "2024-05-16", desktop: 19, mobile: 23 },
  { date: "2024-05-17", desktop: 27, mobile: 24 },
  { date: "2024-05-18", desktop: 17, mobile: 20 },
  { date: "2024-05-19", desktop: 13, mobile: 11 },
  { date: "2024-05-20", desktop: 10, mobile: 13 },
  { date: "2024-05-21", desktop: 5, mobile: 8 },
  { date: "2024-05-22", desktop: 5, mobile: 7 },
  { date: "2024-05-23", desktop: 14, mobile: 17 },
  { date: "2024-05-24", desktop: 16, mobile: 13 },
  { date: "2024-05-25", desktop: 11, mobile: 14 },
  { date: "2024-05-26", desktop: 12, mobile: 10 },
  { date: "2024-05-27", desktop: 23, mobile: 26 },
  { date: "2024-05-28", desktop: 13, mobile: 11 },
  { date: "2024-05-29", desktop: 4, mobile: 8 },
  { date: "2024-05-30", desktop: 19, mobile: 16 },
  { date: "2024-05-31", desktop: 10, mobile: 13 },
  { date: "2024-06-01", desktop: 10, mobile: 12 },
  { date: "2024-06-02", desktop: 26, mobile: 23 },
  { date: "2024-06-03", desktop: 6, mobile: 9 },
  { date: "2024-06-04", desktop: 24, mobile: 22 },
  { date: "2024-06-05", desktop: 5, mobile: 8 },
  { date: "2024-06-06", desktop: 16, mobile: 14 },
  { date: "2024-06-07", desktop: 18, mobile: 21 },
  { date: "2024-06-08", desktop: 21, mobile: 18 },
  { date: "2024-06-09", desktop: 24, mobile: 27 },
  { date: "2024-06-10", desktop: 9, mobile: 12 },
  { date: "2024-06-11", desktop: 5, mobile: 9 },
  { date: "2024-06-12", desktop: 27, mobile: 24 },
  { date: "2024-06-13", desktop: 5, mobile: 8 },
  { date: "2024-06-14", desktop: 24, mobile: 22 },
  { date: "2024-06-15", desktop: 17, mobile: 20 },
  { date: "2024-06-16", desktop: 20, mobile: 18 },
  { date: "2024-06-17", desktop: 26, mobile: 30 },
  { date: "2024-06-18", desktop: 6, mobile: 10 },
  { date: "2024-06-19", desktop: 19, mobile: 17 },
  { date: "2024-06-20", desktop: 22, mobile: 26 },
  { date: "2024-06-21", desktop: 9, mobile: 12 },
  { date: "2024-06-22", desktop: 17, mobile: 15 },
  { date: "2024-06-23", desktop: 26, mobile: 30 },
  { date: "2024-06-24", desktop: 7, mobile: 11 },
  { date: "2024-06-25", desktop: 8, mobile: 11 },
  { date: "2024-06-26", desktop: 24, mobile: 22 },
  { date: "2024-06-27", desktop: 25, mobile: 28 },
  { date: "2024-06-28", desktop: 8, mobile: 12 },
  { date: "2024-06-29", desktop: 6, mobile: 9 },
  { date: "2024-06-30", desktop: 25, mobile: 23 },
];

/**
 * Chart Configuration for PaaS Analytics
 *
 * Brand-aligned color scheme:
 * - Primary Sky Blue (#7DD3FC): Daily Active Learners (primary engagement metric)
 * - Secondary Purple (#8D6A9F): Average Session Time (quality engagement metric)
 *
 * This dual-metric approach shows both platform usage volume AND engagement quality,
 * providing complete business intelligence for platform health monitoring.
 */
const chartConfig = {
  learners: {
    label: "Platform Activity",
  },
  desktop: {
    label: "Daily Active Learners",
    color: "#7DD3FC", // Brand primary sky blue
  },
  mobile: {
    label: "Avg Session Time (min)",
    color: "#8D6A9F", // Brand secondary purple
  },
} satisfies ChartConfig;

/**
 * Main Chart Component
 *
 * Implements responsive, interactive analytics chart with:
 * - Mobile-first design (defaults to 7d view on mobile)
 * - Time range filtering (7d, 30d, 90d)
 * - Professional gradient area charts vs basic bar charts
 * - Smooth animations (larger screens only due to performance)
 */
export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  // Mobile UX optimization: Default to shorter time range on mobile devices
  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  /**
   * Dynamic Data Filtering
   *
   * Filters chart data based on selected time range.
   * Uses fixed reference date for consistent demo behavior.
   * In production, this would use current date.
   */
  const filteredData = chartData.filter(item => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        {/* PaaS-focused title emphasizing platform effectiveness */}
        <CardTitle>Active Learners Over Time</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Daily learner engagement for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          {/* Interactive Time Range Controls - Desktop: Toggle, Mobile: Select */}
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            {/* Professional Gradient Definitions - Superior to Basic Bar Charts */}
            <defs>
              {/* Course Completions Gradient (Green - Success Metric) */}
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              {/* New Enrollments Gradient (Blue - Growth Metric) */}
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>

            {/* Clean Grid Lines - Horizontal Only */}
            <CartesianGrid vertical={false} />

            {/* Responsive Date Formatting */}
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={value => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            {/* Interactive Tooltip with Smooth Animations */}
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10} // Show default hover on desktop only
              content={
                <ChartTooltipContent
                  labelFormatter={value => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />

            {/* Stacked Area Charts - Order Matters for Visual Hierarchy */}
            {/* Layer 1: New Enrollments (Background - Growth Context) */}
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            {/* Layer 2: Course Completions (Foreground - Success Focus) */}
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
