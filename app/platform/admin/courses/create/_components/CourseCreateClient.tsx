"use client";

import { useEffect } from "react";
import { usePageHeader } from "@/app/providers/page-header-context";
import { CourseForm } from "@/components/courses/CourseForm";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateCourse } from "../actions";

/**
 * Platform Course Create Client Component
 *
 * Client wrapper that uses PageHeader context for consistent UI.
 * Eliminates double header issue by managing header via context.
 */
export function CourseCreateClient() {
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
              href="/platform/admin/courses"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold">Create Course</h1>
          </div>

          {/* Course form without its own header */}
          <CourseForm
            mode="create"
            onSubmit={CreateCourse}
            redirectPath="/platform/admin/courses"
            cardTitle="Basic Information"
            cardDescription="Provide basic information about the course"
            priceFieldDisabled={false}
            priceTooltipContent={{
              line1: "Enter 0 for free courses.",
              line2:
                "Free courses won't require payment or Stripe integration.",
            }}
          />
        </div>
      ),
    });
  }, [setConfig]);

  return null;
}
