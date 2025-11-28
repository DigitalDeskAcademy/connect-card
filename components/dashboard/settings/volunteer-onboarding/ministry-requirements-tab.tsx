"use client";

/**
 * Ministry Requirements Tab - Volunteer Onboarding Settings
 *
 * Configure what each ministry category requires for volunteers:
 * - Background check (required/not required, validity period)
 * - Training requirements (description, URL)
 * - Custom requirements
 */

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { IconLoader2, IconShieldCheck, IconSchool } from "@tabler/icons-react";
import { toast } from "sonner";
import { upsertMinistryRequirements } from "@/actions/volunteers/onboarding";
import type { VolunteerCategoryType } from "@/lib/generated/prisma";
import { volunteerCategoryTypes } from "@/lib/zodSchemas";

// Ministry requirements data type matching API response
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

interface MinistryRequirementsTabProps {
  slug: string;
  organizationId: string;
  ministryRequirements: MinistryRequirementsData[];
}

// Format category name for display
function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Ministry descriptions for context
const ministryDescriptions: Record<string, string> = {
  KIDS_MINISTRY: "Nursery, children's church, VBS",
  WORSHIP_TEAM: "Singers, musicians, media team",
  HOSPITALITY: "Greeters, ushers, coffee",
  PARKING: "Parking lot attendants",
  PRAYER_TEAM: "Prayer ministry volunteers",
  AV_TECH: "Sound, lights, streaming",
  GREETER: "Welcome team members",
  USHER: "Service coordination and seating",
  GENERAL: "General volunteer roles",
  OTHER: "Other ministry areas",
};

interface MinistryFormData {
  backgroundCheckRequired: boolean;
  backgroundCheckValidMonths: number;
  trainingRequired: boolean;
  trainingDescription: string;
  trainingUrl: string;
}

export function MinistryRequirementsTab({
  slug,
  ministryRequirements,
}: MinistryRequirementsTabProps) {
  const [isPending, startTransition] = useTransition();
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  // Build requirements map for quick lookup
  const requirementsMap = new Map(
    ministryRequirements.map(req => [req.category, req])
  );

  // Get form data for a category (use existing or defaults)
  const getFormData = (category: string): MinistryFormData => {
    const existing = requirementsMap.get(category as VolunteerCategoryType);
    return {
      backgroundCheckRequired: existing?.backgroundCheckRequired ?? false,
      backgroundCheckValidMonths: existing?.backgroundCheckValidMonths ?? 24,
      trainingRequired: existing?.trainingRequired ?? false,
      trainingDescription: existing?.trainingDescription ?? "",
      trainingUrl: existing?.trainingUrl ?? "",
    };
  };

  // Handle form submission for a ministry
  const handleSave = (
    category: (typeof volunteerCategoryTypes)[number],
    formData: MinistryFormData
  ) => {
    setSavingCategory(category);
    startTransition(async () => {
      const result = await upsertMinistryRequirements(slug, {
        category,
        backgroundCheckRequired: formData.backgroundCheckRequired,
        backgroundCheckValidMonths: formData.backgroundCheckValidMonths,
        trainingRequired: formData.trainingRequired,
        trainingDescription: formData.trainingDescription || undefined,
        trainingUrl: formData.trainingUrl || undefined,
        isActive: true,
        sortOrder: 0,
      });

      if (result.status === "success") {
        toast.success(`${formatCategoryLabel(category)} requirements saved`);
      } else {
        toast.error(result.message || "Failed to save requirements");
      }
      setSavingCategory(null);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ministry Requirements</CardTitle>
          <CardDescription>
            Configure what each ministry category requires for volunteers. These
            settings determine the onboarding checklist for new volunteers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {volunteerCategoryTypes.map(category => {
              const existing = requirementsMap.get(category);
              const hasRequirements =
                existing?.backgroundCheckRequired || existing?.trainingRequired;

              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium">
                        {formatCategoryLabel(category)}
                      </span>
                      {hasRequirements && (
                        <div className="flex gap-1">
                          {existing?.backgroundCheckRequired && (
                            <Badge variant="secondary" className="text-xs">
                              <IconShieldCheck className="h-3 w-3 mr-1" />
                              BG Check
                            </Badge>
                          )}
                          {existing?.trainingRequired && (
                            <Badge variant="secondary" className="text-xs">
                              <IconSchool className="h-3 w-3 mr-1" />
                              Training
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <MinistryForm
                      category={category}
                      description={ministryDescriptions[category] || ""}
                      initialData={getFormData(category)}
                      onSave={data => handleSave(category, data)}
                      isSaving={savingCategory === category}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual ministry form component
function MinistryForm({
  category,
  description,
  initialData,
  onSave,
  isSaving,
}: {
  category: string;
  description: string;
  initialData: MinistryFormData;
  onSave: (data: MinistryFormData) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Background Check Section */}
      <div className="space-y-4 border-b pb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={`${category}-bg-check`} className="text-base">
              Background Check Required
            </Label>
            <p className="text-sm text-muted-foreground">
              Volunteers must pass a background check before serving
            </p>
          </div>
          <Switch
            id={`${category}-bg-check`}
            checked={formData.backgroundCheckRequired}
            onCheckedChange={(checked: boolean) =>
              setFormData(prev => ({
                ...prev,
                backgroundCheckRequired: checked,
              }))
            }
          />
        </div>

        {formData.backgroundCheckRequired && (
          <div className="ml-0 space-y-2">
            <Label htmlFor={`${category}-bg-months`}>Valid for (months)</Label>
            <Input
              id={`${category}-bg-months`}
              type="number"
              min={6}
              max={60}
              value={formData.backgroundCheckValidMonths}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  backgroundCheckValidMonths: parseInt(e.target.value) || 24,
                }))
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Standard: 24 months. Some denominations require 12 months.
            </p>
          </div>
        )}
      </div>

      {/* Training Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={`${category}-training`} className="text-base">
              Training Required
            </Label>
            <p className="text-sm text-muted-foreground">
              Volunteers must complete training before serving
            </p>
          </div>
          <Switch
            id={`${category}-training`}
            checked={formData.trainingRequired}
            onCheckedChange={(checked: boolean) =>
              setFormData(prev => ({
                ...prev,
                trainingRequired: checked,
              }))
            }
          />
        </div>

        {formData.trainingRequired && (
          <div className="space-y-4 ml-0">
            <div className="space-y-2">
              <Label htmlFor={`${category}-training-desc`}>
                Training Description
              </Label>
              <Textarea
                id={`${category}-training-desc`}
                placeholder="Describe the training requirements..."
                value={formData.trainingDescription}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    trainingDescription: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${category}-training-url`}>
                Training URL (optional)
              </Label>
              <Input
                id={`${category}-training-url`}
                type="url"
                placeholder="https://training.example.com"
                value={formData.trainingUrl}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    trainingUrl: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Link to online training course or video
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save Requirements"}
        </Button>
      </div>
    </form>
  );
}
