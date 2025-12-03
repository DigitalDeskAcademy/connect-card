"use client";

/**
 * Volunteer Onboarding Settings Client
 *
 * Tabbed interface for managing volunteer onboarding configuration:
 * - Documents: Upload and manage volunteer documents (policies, forms, training materials)
 * - Ministry Requirements: Configure what each ministry category requires (background checks, training)
 * - Background Checks: Configure background check provider and payment settings
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsTab } from "./documents-tab";
import { MinistryRequirementsTab } from "./ministry-requirements-tab";
import { BackgroundCheckTab } from "./background-check-tab";
import {
  IconFileText,
  IconSettings,
  IconShieldCheck,
} from "@tabler/icons-react";
import type {
  DocumentScope,
  VolunteerCategoryType,
  BGCheckProvider,
  BGCheckPayment,
} from "@/lib/generated/prisma";

// Types matching the API response
interface DocumentData {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  scope: DocumentScope;
  category: VolunteerCategoryType | null;
  description: string | null;
  uploadedAt: Date;
  deliveryCount: number;
}

interface MinistryRequirementsData {
  id: string;
  category: VolunteerCategoryType;
  backgroundCheckRequired: boolean;
  backgroundCheckValidMonths: number | null;
  trainingRequired: boolean;
  trainingDescription: string | null;
  trainingUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface BackgroundCheckConfigData {
  id: string;
  provider: BGCheckProvider;
  providerAccountId: string | null;
  applicationUrl: string | null;
  validityMonths: number;
  paymentModel: BGCheckPayment;
  reminderDays: number[];
  instructions: string | null;
  isEnabled: boolean;
}

interface VolunteerOnboardingClientProps {
  slug: string;
  organizationId: string;
  documents: DocumentData[];
  ministryRequirements: MinistryRequirementsData[];
  backgroundCheckConfig: BackgroundCheckConfigData | null;
}

export function VolunteerOnboardingClient({
  slug,
  organizationId,
  documents,
  ministryRequirements,
  backgroundCheckConfig,
}: VolunteerOnboardingClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Volunteer Onboarding
        </h1>
        <p className="text-muted-foreground">
          Configure documents, requirements, and background check settings for
          volunteer onboarding.
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <IconFileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <IconSettings className="h-4 w-4" />
            Ministry Requirements
          </TabsTrigger>
          <TabsTrigger
            value="background-check"
            className="flex items-center gap-2"
          >
            <IconShieldCheck className="h-4 w-4" />
            Background Checks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentsTab
            slug={slug}
            organizationId={organizationId}
            documents={documents}
          />
        </TabsContent>

        <TabsContent value="requirements">
          <MinistryRequirementsTab
            slug={slug}
            organizationId={organizationId}
            ministryRequirements={ministryRequirements}
          />
        </TabsContent>

        <TabsContent value="background-check">
          <BackgroundCheckTab
            slug={slug}
            organizationId={organizationId}
            config={backgroundCheckConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
