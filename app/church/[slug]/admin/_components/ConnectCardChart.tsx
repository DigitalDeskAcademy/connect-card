"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
import { Card, CardContent } from "@/components/ui/card";
import type { ConnectCardChartDataPoint } from "@/lib/data/connect-card-analytics";

const chartConfig = {
  totalCards: {
    label: "Total Cards",
    color: "hsl(240, 75%, 55%)", // Bright blue
  },
  firstTimeVisitors: {
    label: "First-Time Visitors",
    color: "hsl(145, 65%, 60%)", // Vibrant green
  },
  prayerRequests: {
    label: "Prayer Requests",
    color: "hsl(310, 65%, 55%)", // Purple/magenta
  },
} satisfies ChartConfig;

interface ConnectCardChartProps {
  data: ConnectCardChartDataPoint[];
}

export function ConnectCardChart({ data }: ConnectCardChartProps) {
  const [timeRange, setTimeRange] = React.useState("4w"); // Default to 4 weeks

  const filteredData = React.useMemo(() => {
    let weeksToShow = 4; // Default 4 weeks

    if (timeRange === "12w") {
      weeksToShow = 12; // 3 months
    } else if (timeRange === "26w") {
      weeksToShow = 26; // 6 months
    } else if (timeRange === "52w") {
      weeksToShow = 52; // 1 year
    }

    // Show last N weeks of data
    return data.slice(-weeksToShow);
  }, [data, timeRange]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 border-b pb-4 mb-4">
          <div className="grid flex-1 gap-1">
            <h3 className="text-lg font-semibold">Connect Card Growth</h3>
            <p className="text-sm text-muted-foreground">
              Showing visitor trends over time
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 4 weeks" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="4w" className="rounded-lg">
                Last 4 weeks
              </SelectItem>
              <SelectItem value="12w" className="rounded-lg">
                Last 12 weeks
              </SelectItem>
              <SelectItem value="26w" className="rounded-lg">
                Last 6 months
              </SelectItem>
              <SelectItem value="52w" className="rounded-lg">
                Last year
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTotalCards" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-totalCards)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-totalCards)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="fillFirstTimeVisitors"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-firstTimeVisitors)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-firstTimeVisitors)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="fillPrayerRequests"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-prayerRequests)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-prayerRequests)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={value => {
                // Value is already formatted as "Jan 5 - Jan 11"
                // Show abbreviated version for space
                const parts = value.split(" - ");
                if (parts.length === 2) {
                  return parts[0]; // Just show start date
                }
                return value;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={value => value.toString()}
              domain={[0, "dataMax + 20"]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={value => {
                    // Value is weekLabel: "Jan 5 - Jan 11"
                    return `Week of ${value}`;
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="totalCards"
              type="monotone"
              fill="url(#fillTotalCards)"
              stroke="var(--color-totalCards)"
              fillOpacity={0.3}
            />
            <Area
              dataKey="firstTimeVisitors"
              type="monotone"
              fill="url(#fillFirstTimeVisitors)"
              stroke="var(--color-firstTimeVisitors)"
              fillOpacity={0.3}
            />
            <Area
              dataKey="prayerRequests"
              type="monotone"
              fill="url(#fillPrayerRequests)"
              stroke="var(--color-prayerRequests)"
              fillOpacity={0.3}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
