"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VolunteerOverviewTab } from "./volunteer-overview-tab";
import {
  IconUser,
  IconCertificate,
  IconCalendarTime,
  IconHistory,
  IconNotes,
} from "@tabler/icons-react";
import type { Volunteer } from "@/lib/generated/prisma";

/**
 * Volunteer Detail Client Component
 *
 * Tabbed interface for viewing and managing individual volunteer profiles.
 *
 * Tabs:
 * 1. Overview - Profile info, background check, emergency contacts, edit button
 * 2. Skills & Certifications - Skills list with proficiency and verification status
 * 3. Availability & Schedule - Recurring schedules, blackout dates, one-time availability
 * 4. Shift History - Past/upcoming shifts with reliability metrics
 * 5. Notes - Internal notes and observations
 *
 * Follows controlled tabs pattern from team management.
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
    skills: Array<{
      id: string;
      skillName: string;
      proficiency: string | null;
      isVerified: boolean;
      verifiedDate: Date | null;
      expiryDate: Date | null;
    }>;
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
  slug: string;
}

export function VolunteerDetailClient({
  volunteer,
  slug,
}: VolunteerDetailClientProps) {
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <div className="flex flex-col gap-6">
      {/* Header with volunteer name */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {volunteer.churchMember.name || "Unknown Volunteer"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Status: {volunteer.status}
          </p>
        </div>
      </div>

      {/* Tabbed interface */}
      <Tabs
        defaultValue="overview"
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs">
          <TabsTrigger
            value="overview"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <IconUser className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>

          <TabsTrigger
            value="skills"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <IconCertificate className="mr-2 h-4 w-4" />
            Skills & Certifications ({volunteer.skills.length})
          </TabsTrigger>

          <TabsTrigger
            value="availability"
            className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
          >
            <IconCalendarTime className="mr-2 h-4 w-4" />
            Availability & Schedule
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

        {/* Tab content */}
        <TabsContent value="overview" className="mt-6">
          <VolunteerOverviewTab volunteer={volunteer} slug={slug} />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Skills & Certifications tab - Coming soon
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Availability & Schedule tab - Coming soon
          </div>
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
