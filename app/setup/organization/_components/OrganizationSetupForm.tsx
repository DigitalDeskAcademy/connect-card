/**
 * Organization Setup Form Component
 *
 * Form interface for creating a new organization after authentication.
 * Collects agency details and creates organization with proper trial setup.
 * Follows the same UI patterns as LoginForm for consistency.
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input";
import {
  organizationSetupSchema,
  OrganizationSetupSchemaType,
  organizationIndustries,
} from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Globe, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createOrganization } from "../actions";

interface OrganizationSetupFormProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export function OrganizationSetupForm({
  userId,
  userName,
  userEmail,
}: OrganizationSetupFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<OrganizationSetupSchemaType>({
    resolver: zodResolver(organizationSetupSchema),
    defaultValues: {
      name: "",
      agencyName: "",
      website: "",
      industry: "SaaS",
    },
  });

  // Handle form submission
  function onSubmit(values: OrganizationSetupSchemaType) {
    startTransition(async () => {
      const result = await createOrganization({
        ...values,
        userId,
      });

      if (result.status === "success" && result.organizationSlug) {
        toast.success(result.message);
        // Force router refresh to get updated session with activeOrganizationId
        router.refresh();
        // Redirect to agency admin dashboard
        router.push(`/agency/${result.organizationSlug}/admin`);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Setup Your Agency</CardTitle>
        <CardDescription>
          Tell us about your agency to complete your account setup
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Info Display */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm text-muted-foreground">Setting up for:</p>
              <p className="font-medium">{userName}</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agency Name Field */}
            <FormField
              control={form.control}
              name="agencyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Digital Marketing Pro"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website Field */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        placeholder="www.example.com"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Industry Field */}
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationIndustries.map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trial Information */}
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                🎉 14-Day Free Trial Included
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Full access to all features. No credit card required.
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  <span>Creating your agency...</span>
                </>
              ) : (
                <span>Complete Setup</span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
