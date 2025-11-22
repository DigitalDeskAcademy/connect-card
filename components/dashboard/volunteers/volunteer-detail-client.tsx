"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VolunteerOverviewTab } from "./volunteer-overview-tab";
import {
  IconUser,
  IconHistory,
  IconNotes,
} from "@tabler/icons-react";
import type { Volunteer, VolunteerSkill } from "@/lib/generated/prisma";

/**
 * Volunteer Detail Client Component
 *
 * Tabbed interface for viewing and managing individual volunteer profiles.
 *
 * Tabs:
 * 1. Overview - Profile info, background check status, emergency contacts
 * 2. Shift History - Past/upcoming shifts with reliability metrics
 * 3. Notes - Internal notes and observations
 *
 * Note: Skills, certifications, and availability are managed in external church software
 * (e.g., Planning Center). Background checks are handled in the Overview tab.
 */

interface VolunteerDetailClientProps {
  volunteer: Volunteer & {
    churchMember: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
    };
    skills: VolunteerSkill[];
    availability: Array<{
      id: string;
      availabilityType: string;
      dayOfWeek: number | null;
      startTime: string | null;
      endTime: string | null;
      startDate: Date | null;
      endDate: Date | null;
      reason: string | null;
      recurrencePattern: string | null;
    }>;
    shifts: Array<{
      id: string;
      shiftDate: Date;
      startTime: string;
      endTime: string;
      status: string;
      checkInTime: Date | null;
      checkOutTime: Date | null;
      servingOpportunity: {
        id: string;
        name: string;
        category: string | null;
      };
    }>;
  };
}

export function VolunteerDetailClient({
  volunteer,
}: VolunteerDetailClientProps) {
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <div className="flex flex-col gap-6">
      {/* Tabbed interface */}
      <Tabs
        defaultValue="overview"
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        {/* Scrollable tab list for overflow handling */}
        <div className="w-full overflow-x-auto">
          <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs inline-flex">
            <TabsTrigger
              value="overview"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <IconUser className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>

            <TabsTrigger
              value="shifts"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <IconHistory className="mr-2 h-4 w-4" />
              Shift History ({volunteer.shifts.length})
            </TabsTrigger>

            <TabsTrigger
              value="notes"
              className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              <IconNotes className="mr-2 h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content */}
        <TabsContent value="overview" className="mt-6">
          <VolunteerOverviewTab volunteer={volunteer} />
        </TabsContent>

        <TabsContent value="shifts" className="mt-6">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Shift History tab - Coming soon
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Notes tab - Coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
