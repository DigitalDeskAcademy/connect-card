"use client";

import { useEffect } from "react";
import { usePageHeader } from "@/app/providers/page-header-context";
import { CourseForm } from "@/components/courses/CourseForm";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createAgencyCourse } from "../actions";

interface AgencyCourseCreateClientProps {
  slug: string;
}

/**
 * Agency Course Create Client Component
 *
 * Client wrapper that uses PageHeader context for consistent UI.
 * Eliminates double header issue by managing header via context.
 */
export function AgencyCourseCreateClient({
  slug,
}: AgencyCourseCreateClientProps) {
  const { setConfig } = usePageHeader();

  useEffect(() => {
    setConfig({
      title: "",
      children: (
        <div>
          {/* Back button and page title */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/church/${slug}/admin/courses`}
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold">Create Custom Course</h1>
          </div>

          {/* Course form without its own header */}
          <CourseForm
            mode="create"
            onSubmit={data => createAgencyCourse(slug, data)}
            redirectPath={`/church/${slug}/admin/courses`}
            cardTitle="Course Information"
            cardDescription="Create a custom course for your organization's clients"
            priceFieldDisabled={true}
            priceTooltipContent={{
              line1: "Agency courses are included in your subscription.",
              line2:
                "Your clients can access all your custom courses at no additional cost.",
            }}
            organizationSlug={slug}
          />
        </div>
      ),
    });
  }, [setConfig, slug]);

  return null;
}
