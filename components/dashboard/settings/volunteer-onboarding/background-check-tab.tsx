"use client";

/**
 * Background Check Tab - Volunteer Onboarding Settings
 *
 * Configure background check provider and payment settings:
 * - Provider selection (Protect My Ministry, Sterling, Ministry Safe, Checkr, Custom)
 * - Application URL
 * - Payment model (church-paid, volunteer-paid, subsidized)
 * - Instructions and notes
 *
 * Note: We use URL-only integration (not API) for liability reasons.
 * Churches handle their own background check relationship with the provider.
 */

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  IconLoader2,
  IconInfoCircle,
  IconExternalLink,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { upsertBackgroundCheckConfig } from "@/actions/volunteers/onboarding";
import type { BGCheckProvider, BGCheckPayment } from "@/lib/generated/prisma";

// Background check config data type matching API response
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

interface BackgroundCheckTabProps {
  slug: string;
  organizationId: string;
  config: BackgroundCheckConfigData | null;
}

// Form schema
const formSchema = z.object({
  provider: z.enum([
    "PROTECT_MY_MINISTRY",
    "STERLING_VOLUNTEERS",
    "MINISTRY_SAFE",
    "CHECKR",
    "CUSTOM",
  ]),
  applicationUrl: z.string().url("Please enter a valid URL").or(z.literal("")),
  providerAccountId: z.string().optional(),
  paymentModel: z.enum(["CHURCH_PAID", "VOLUNTEER_PAID", "SUBSIDIZED"]),
  validityMonths: z.number().min(6).max(60),
  instructions: z.string().optional(),
  isEnabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

// Provider info for display
const providerInfo: Record<
  string,
  { name: string; website: string; description: string }
> = {
  PROTECT_MY_MINISTRY: {
    name: "Protect My Ministry",
    website: "https://www.protectmyministry.com",
    description:
      "Popular choice for churches with competitive pricing and ministry-focused service.",
  },
  STERLING_VOLUNTEERS: {
    name: "Sterling Volunteers",
    website: "https://www.sterlingvolunteers.com",
    description:
      "Enterprise-grade screening with comprehensive reports and fast turnaround.",
  },
  MINISTRY_SAFE: {
    name: "MinistrySafe",
    website: "https://ministrysafe.com",
    description:
      "Background screening plus abuse prevention training and policies.",
  },
  CHECKR: {
    name: "Checkr",
    website: "https://checkr.com",
    description:
      "Modern, tech-forward background checks with API integrations.",
  },
  CUSTOM: {
    name: "Custom Provider",
    website: "",
    description: "Use your own background check provider or process.",
  },
};

// Payment model descriptions
const paymentModelInfo: Record<string, { label: string; description: string }> =
  {
    CHURCH_PAID: {
      label: "Church Paid",
      description: "The church covers the full cost of background checks.",
    },
    VOLUNTEER_PAID: {
      label: "Volunteer Paid",
      description: "Volunteers pay for their own background check.",
    },
    SUBSIDIZED: {
      label: "Subsidized",
      description: "Church pays part, volunteer pays the rest.",
    },
  };

export function BackgroundCheckTab({ slug, config }: BackgroundCheckTabProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: config?.provider ?? "PROTECT_MY_MINISTRY",
      applicationUrl: config?.applicationUrl ?? "",
      providerAccountId: config?.providerAccountId ?? "",
      paymentModel: config?.paymentModel ?? "CHURCH_PAID",
      validityMonths: config?.validityMonths ?? 24,
      instructions: config?.instructions ?? "",
      isEnabled: config?.isEnabled ?? false,
    },
  });

  const selectedProvider = form.watch("provider");

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = await upsertBackgroundCheckConfig(slug, {
        provider: data.provider,
        applicationUrl: data.applicationUrl || undefined,
        providerAccountId: data.providerAccountId || undefined,
        paymentModel: data.paymentModel,
        validityMonths: data.validityMonths,
        reminderDays: [30, 7], // Default reminder days (30 days and 7 days before expiry)
        instructions: data.instructions || undefined,
        isEnabled: data.isEnabled,
      });

      if (result.status === "success") {
        toast.success("Background check settings saved");
      } else {
        toast.error(result.message || "Failed to save settings");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <IconInfoCircle className="h-4 w-4" />
        <AlertTitle>How This Works</AlertTitle>
        <AlertDescription>
          We link volunteers to your background check provider&apos;s
          application page. You manage the provider relationship directly - we
          just streamline the referral process. This protects your church from
          liability while automating the workflow.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Background Check Provider</CardTitle>
          <CardDescription>
            Configure your background check provider and how volunteers will
            access the application process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Provider Selection */}
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(providerInfo).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            {info.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {providerInfo[field.value]?.description}
                      {providerInfo[field.value]?.website && (
                        <a
                          href={providerInfo[field.value].website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center text-primary hover:underline"
                        >
                          Visit website
                          <IconExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Provider Account ID (for custom providers) */}
              {selectedProvider === "CUSTOM" && (
                <FormField
                  control={form.control}
                  name="providerAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name / Account ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your provider's name or account ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Application URL */}
              <FormField
                control={form.control}
                name="applicationUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://apply.provider.com/your-church"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The direct link where volunteers apply for their
                      background check. This is usually a church-specific URL
                      from your provider.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Model */}
              <FormField
                control={form.control}
                name="paymentModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Who pays for background checks?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(paymentModelInfo).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            {info.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {paymentModelInfo[field.value]?.description}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Validity Months */}
              <FormField
                control={form.control}
                name="validityMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity Period (months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={6}
                        max={60}
                        {...field}
                        onChange={e =>
                          field.onChange(parseInt(e.target.value) || 24)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      How long a background check is valid before renewal is
                      required. Standard is 24 months.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instructions */}
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions for Volunteers</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any special instructions for volunteers completing their background check..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These instructions will be shown to volunteers when
                      they&apos;re directed to complete their background check.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
