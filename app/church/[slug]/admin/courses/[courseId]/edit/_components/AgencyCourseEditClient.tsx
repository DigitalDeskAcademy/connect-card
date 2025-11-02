"use client";

import { useEffect, useState } from "react";
import { usePageHeader } from "@/app/providers/page-header-context";
import { useSearchParams } from "next/navigation";
import { ChurchCourseSingularType } from "@/app/data/church/church-get-course";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseForm } from "@/components/courses/CourseForm";
import { CourseStructure } from "@/components/courses/CourseStructure";
import {
  reorderChapters,
  reorderLessons,
  createChapter,
  createLesson,
  deleteChapter,
  deleteLesson,
  editAgencyCourse,
} from "../actions";
import { updateLesson } from "../../[chapterId]/[lessonId]/actions";
import { NewChapterModal as NewChapterModalComponent } from "@/components/courses/NewChapterModal";
import { NewLessonModal as NewLessonModalComponent } from "@/components/courses/NewLessonModal";
import { DeleteChapter as DeleteChapterComponent } from "@/components/courses/DeleteChapter";
import { DeleteLesson as DeleteLessonComponent } from "@/components/courses/DeleteLesson";
import { LessonEditDialog as LessonEditDialogComponent } from "@/components/courses/LessonEditDialog";
import { useRouter } from "next/navigation";

interface AgencyCourseEditClientProps {
  course: ChurchCourseSingularType;
  courseId: string;
  slug: string;
}

export function AgencyCourseEditClient({
  course,
  courseId,
  slug,
}: AgencyCourseEditClientProps) {
  const { setConfig } = usePageHeader();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");

  // State for auto-opening lesson edit dialog after creation
  const [pendingLesson, setPendingLesson] = useState<{
    lessonId: string;
    title: string;
    description: string | null;
    videoKey: string | null;
    chapterId: string;
  } | null>(null);

  // Default to "basic-info", but switch to "course-structure" if tab=structure in URL
  const defaultTab = tab === "structure" ? "course-structure" : "basic-info";

  useEffect(() => {
    setConfig({
      title: "", // Empty title since we render custom content
      children: (
        <div>
          {/* Back button and Edit Course heading */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/church/${slug}/admin/courses`}
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold">Edit Course</h1>
          </div>

          {/* Course title */}
          <h2 className="text-3xl font-bold text-primary underline mb-8">
            {course.title}
          </h2>

          {/* Tabs with original styling */}
          <Tabs
            className="w-full"
            defaultValue={defaultTab}
            suppressHydrationWarning
          >
            <TabsList className="h-auto -space-x-px bg-background p-0 shadow-xs rtl:space-x-reverse mb-6">
              <TabsTrigger
                value="basic-info"
                className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
              >
                Basic Information
              </TabsTrigger>
              <TabsTrigger
                value="course-structure"
                className="relative overflow-hidden rounded-none border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
              >
                Course Structure
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Update your course details and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CourseForm
                    mode="edit"
                    course={course}
                    onSubmit={(values, id) =>
                      editAgencyCourse(slug, values, id!)
                    }
                    onCancel={() =>
                      router.push(`/church/${slug}/admin/courses`)
                    }
                    organizationSlug={slug}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="course-structure">
              <Card>
                <CardHeader>
                  <CardTitle>Course Structure</CardTitle>
                  <CardDescription>
                    Organize chapters and lessons for your course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CourseStructure
                    course={{
                      ...course,
                      title: course.title,
                      organizationSlug: slug, // Agency course - include organization slug
                    }}
                    context={{
                      basePath: `/church/${slug}/admin/courses`,
                      courseId,
                      onReorderChapters: data =>
                        reorderChapters(slug, courseId, data),
                      onReorderLessons: (chapterId, data) =>
                        reorderLessons(slug, chapterId, data, courseId),
                      NewChapterModal: props => (
                        <NewChapterModalComponent
                          {...props}
                          onSubmit={data => createChapter(slug, data)}
                        />
                      ),
                      NewLessonModal: props => (
                        <NewLessonModalComponent
                          {...props}
                          onSubmit={data => createLesson(slug, data)}
                          onSuccess={(lessonData, chapterId) => {
                            // Auto-open lesson edit dialog after creation
                            setPendingLesson({
                              lessonId: lessonData.lessonId,
                              title: lessonData.title,
                              description: lessonData.description,
                              videoKey: lessonData.videoKey,
                              chapterId,
                            });
                          }}
                        />
                      ),
                      DeleteChapter: props => (
                        <DeleteChapterComponent
                          {...props}
                          onDelete={data => deleteChapter({ slug, ...data })}
                        />
                      ),
                      DeleteLesson: props => (
                        <DeleteLessonComponent
                          {...props}
                          onDelete={data => deleteLesson({ slug, ...data })}
                        />
                      ),
                      LessonEditDialog: props => (
                        <LessonEditDialogComponent
                          {...props}
                          courseName={course.title}
                          organizationSlug={slug}
                          onSubmit={(values, lessonId) =>
                            updateLesson(values, lessonId)
                          }
                        />
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Danger Zone - Delete Course */}
          <Card className="mt-8 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4 p-4 border border-destructive/20 rounded-md bg-destructive/5">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Delete this course</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once you delete a course, there is no going back. This will
                    permanently delete the course, all chapters, lessons, and
                    uploaded videos.
                  </p>
                </div>
                <Link href={`/church/${slug}/admin/courses/${courseId}/delete`}>
                  <Button variant="destructive" size="sm" className="shrink-0">
                    Delete Course
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Auto-open lesson edit dialog for newly created lessons */}
          {pendingLesson && (
            <LessonEditDialogComponent
              key={pendingLesson.lessonId}
              lesson={{
                id: pendingLesson.lessonId,
                title: pendingLesson.title,
                description: pendingLesson.description,
                videoKey: pendingLesson.videoKey,
              }}
              courseId={courseId}
              chapterId={pendingLesson.chapterId}
              courseName={course.title}
              organizationSlug={slug}
              onSubmit={(values, lessonId) => updateLesson(values, lessonId)}
              defaultOpen={true}
              onClose={() => setPendingLesson(null)}
            />
          )}
        </div>
      ),
    });

    // Cleanup: Clear the PageHeader content when component unmounts
    return () => {
      setConfig({ title: "", children: null });
    };
  }, [setConfig, course, slug, defaultTab, courseId, pendingLesson, router]);

  return null; // Content rendered via PageHeader context
}
