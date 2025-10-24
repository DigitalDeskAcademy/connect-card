/**
 * Course Editing Page - Comprehensive course management interface
 *
 * Central hub for all course editing operations with tabbed interface for organized workflow.
 * Provides content creators with efficient access to both basic course information and
 * advanced course structure management in a single, coherent interface.
 *
 * Admin Workflow:
 * - Tabbed interface separating basic course info from structure management
 * - Context-aware page title displaying current course name for clarity
 * - Seamless switching between course metadata editing and content organization
 * - Consistent card-based layout maintaining visual hierarchy
 * - Server-side data loading with proper course ownership validation
 *
 * Feature Organization:
 * - Basic Info Tab: Course metadata, pricing, description, thumbnail management
 * - Course Structure Tab: Drag-and-drop chapter/lesson organization and creation
 * - Responsive tab layout adapting to various screen sizes
 * - Clear visual separation between different editing contexts
 *
 * Content Management:
 * - Real-time course data integration from database
 * - Proper course ownership validation and authorization
 * - Seamless data flow between basic information and structure management
 * - Consistent error handling and user feedback patterns
 *
 * Technical Implementation:
 * - Server component with async data fetching for optimal performance
 * - Type-safe parameter handling with Promise-based routing
 * - Modular component architecture with clear separation of concerns
 * - Responsive design with tab-based navigation for optimal UX
 */

import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditCourseForm } from "./_components/EditCourseForm";
import { CourseStructure } from "./_components/CourseStructure";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Params = Promise<{ courseId: string }>;

/**
 * Course Editing Page Component
 *
 * Provides comprehensive course editing interface with tabbed organization.
 * Handles both course metadata and structure management in unified interface.
 *
 * @param params - Route parameters containing courseId for data fetching
 */
export default async function EditRoute({ params }: { params: Params }) {
  const { courseId } = await params;
  const data = await adminGetCourse(courseId);
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/courses"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Course</h1>
      </div>

      <h2 className="text-3xl font-bold text-primary underline mb-8">
        {data.title}
      </h2>

      <Tabs className="w-full" defaultValue="basic-info">
        <TabsList className="grid grid-cols-2 w-full h-12 bg-muted/20 border mb-6">
          <TabsTrigger
            value="basic-info"
            className="bg-muted border border-border data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary h-full font-medium text-sm transition-all hover:bg-muted/70"
          >
            Basic Info
          </TabsTrigger>
          <TabsTrigger
            value="course-structure"
            className="bg-muted border border-border data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary h-full font-medium text-sm transition-all hover:bg-muted/70"
          >
            Course Structure
          </TabsTrigger>
        </TabsList>
        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
              <CardDescription>
                Edit the basic info of the course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditCourseForm data={data} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="course-structure">
          <Card>
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
              <CardDescription>
                Organize your course content with chapters and lessons. Drag and
                drop to reorder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseStructure data={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
