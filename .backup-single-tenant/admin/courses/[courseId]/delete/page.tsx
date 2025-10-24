"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { deleteCourse } from "./actions";
import { useConfetti } from "@/hooks/use-confetti";
import type { ApiResponse } from "@/lib/types";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteCourseRoute() {
  const [pending, startTransition] = useTransition();
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { triggerConfetti } = useConfetti();

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(deleteCourse(courseId));

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      const typedResult = result as ApiResponse;
      if (typedResult.status === "success") {
        toast.success(typedResult.message);
        triggerConfetti();
        router.push("/admin/courses");
      } else if (typedResult.status === "error") {
        toast.error(typedResult.message);
      }
    });
  }
  return (
    <div className="max-w-xl mx-auto w-full">
      <Card className="mt-32">
        <CardHeader>
          <CardTitle>Delete Course</CardTitle>
          <CardDescription>
            Are you sure you want to delete this course?
          </CardDescription>
        </CardHeader>
        <CardContent className=" flex items-center justify-between">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/courses"
          >
            Cancel
          </Link>
          <Button variant="destructive" onClick={onSubmit} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
