"use client";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface DashboardVisibility {
  showKpiCards: boolean;
  showChart: boolean;
  showPrayerCategories: boolean;
  showQuickActions: boolean;
}

interface DashboardSettingsProps {
  visibility: DashboardVisibility;
  onVisibilityChange: (visibility: DashboardVisibility) => void;
}

export function DashboardSettings({
  visibility,
  onVisibilityChange,
}: DashboardSettingsProps) {
  const toggleSetting = (key: keyof DashboardVisibility) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Dashboard settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Show on Dashboard</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="kpi-cards" className="text-sm font-normal">
                KPI Cards
              </Label>
              <Switch
                id="kpi-cards"
                checked={visibility.showKpiCards}
                onCheckedChange={() => toggleSetting("showKpiCards")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="chart" className="text-sm font-normal">
                Activity Chart
              </Label>
              <Switch
                id="chart"
                checked={visibility.showChart}
                onCheckedChange={() => toggleSetting("showChart")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="prayer-categories"
                className="text-sm font-normal"
              >
                Prayer Categories
              </Label>
              <Switch
                id="prayer-categories"
                checked={visibility.showPrayerCategories}
                onCheckedChange={() => toggleSetting("showPrayerCategories")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="quick-actions" className="text-sm font-normal">
                Quick Actions
              </Label>
              <Switch
                id="quick-actions"
                checked={visibility.showQuickActions}
                onCheckedChange={() => toggleSetting("showQuickActions")}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
