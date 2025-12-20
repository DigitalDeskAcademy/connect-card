"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VolunteerOverviewTab } from "./volunteer-overview-tab";
import { IconUser, IconNotes } from "@tabler/icons-react";
import type {
  Volunteer,
  VolunteerSkill,
  VolunteerCategory,
} from "@/lib/generated/prisma";

/**
 * Volunteer Detail Client Component
 *
 * Tabbed interface for viewing and managing individual volunteer profiles.
 *
 * Tabs:
 * 1. Overview - Profile info, background check status, emergency contacts
 * 2. Notes - Internal notes and observations
 *
 * Note: Shift scheduling, availability, and service history are managed in Planning Center.
 * Background checks are handled in the Overview tab.
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
    categories: Array<{
      id: string;
      category: VolunteerCategory["category"];
    }>;
    // REMOVED: availability, shifts (Dec 2025) - Shift scheduling moved to Planning Center
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

            {/* REMOVED: Shift History tab (Dec 2025) - Shift scheduling moved to Planning Center */}

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

        {/* REMOVED: Shift History TabsContent (Dec 2025) - Shift scheduling moved to Planning Center */}

        <TabsContent value="notes" className="mt-6">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Notes tab - Coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
