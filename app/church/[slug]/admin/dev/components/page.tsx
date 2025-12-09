/**
 * Dev Components Page - Visual Design System Reference
 *
 * Shows all UI component variants in one place for visual consistency checking.
 * Only accessible in development mode via /church/[slug]/admin/dev/components
 */

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  IconUpload,
  IconCamera,
  IconTrash,
  IconArrowLeft,
  IconCheck,
  IconPlus,
  IconDownload,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleCheck,
} from "@tabler/icons-react";

export default async function DevComponentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PageContainer as="main" backButton={{ href: `/church/${slug}/admin/dev` }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Component Library</h1>
        <p className="text-muted-foreground">
          Visual reference for UI components and their variants. Use this to
          ensure consistent visual hierarchy across the app.
        </p>
      </div>

      {/* Button Hierarchy Documentation */}
      <Card className="mb-8 border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle>Button Hierarchy Guide</CardTitle>
          <CardDescription>
            Rules for when to use each button variant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="font-semibold text-primary mb-1">
                Primary (default)
              </p>
              <p className="text-muted-foreground text-xs">
                Main CTA, 1-2 per view max. Actions that drive the user forward.
              </p>
              <p className="text-xs mt-2 font-mono">
                &quot;Process&quot;, &quot;Save&quot;, &quot;Submit&quot;
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 border border-secondary">
              <p className="font-semibold mb-1">Secondary</p>
              <p className="text-muted-foreground text-xs">
                Supporting actions. Less visual weight than primary.
              </p>
              <p className="text-xs mt-2 font-mono">
                &quot;Add More&quot;, &quot;Upload&quot;, &quot;Select&quot;
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-semibold mb-1">Outline</p>
              <p className="text-muted-foreground text-xs">
                Alternative secondary. Use sparingly - borders add visual noise.
              </p>
              <p className="text-xs mt-2 font-mono">
                &quot;Back&quot;, &quot;View Details&quot;
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="font-semibold mb-1">Ghost</p>
              <p className="text-muted-foreground text-xs">
                Minimal weight. Navigation, cancel, tertiary actions.
              </p>
              <p className="text-xs mt-2 font-mono">
                &quot;Cancel&quot;, &quot;Skip&quot;, &quot;Close&quot;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Variants */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>
            All available button variants with icons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Default / Primary */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Badge variant="default">default</Badge>
                <span className="text-muted-foreground">
                  Primary CTA - Brand color
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Process All Cards
                </Button>
                <Button>
                  <IconUpload className="mr-2 h-4 w-4" />
                  Save to Database
                </Button>
                <Button>
                  <IconCamera className="mr-2 h-4 w-4" />
                  Launch Scanner
                </Button>
                <Button size="sm">Small Primary</Button>
                <Button size="lg">Large Primary</Button>
              </div>
            </div>

            {/* Secondary */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Badge variant="secondary">secondary</Badge>
                <span className="text-muted-foreground">
                  Supporting actions - Neutral
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add More Images
                </Button>
                <Button variant="secondary">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="secondary">Select Images</Button>
                <Button variant="secondary" size="sm">
                  Small Secondary
                </Button>
                <Button variant="secondary" size="lg">
                  Large Secondary
                </Button>
              </div>
            </div>

            {/* Outline */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Badge variant="outline">outline</Badge>
                <span className="text-muted-foreground">
                  Border emphasis - Use sparingly
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button variant="outline">View Details</Button>
                <Button variant="outline" size="sm">
                  Small Outline
                </Button>
                <Button variant="outline" size="lg">
                  Large Outline
                </Button>
              </div>
            </div>

            {/* Ghost */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Badge variant="outline" className="border-dashed">
                  ghost
                </Badge>
                <span className="text-muted-foreground">
                  Minimal - Cancel, tertiary
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost">Cancel</Button>
                <Button variant="ghost">Skip</Button>
                <Button variant="ghost">
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
                <Button variant="ghost" size="sm">
                  Small Ghost
                </Button>
                <Button variant="ghost" size="lg">
                  Large Ghost
                </Button>
              </div>
            </div>

            {/* Destructive */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Badge variant="destructive">destructive</Badge>
                <span className="text-muted-foreground">
                  Delete, remove actions
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="destructive">
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button variant="destructive">Remove All</Button>
                <Button variant="destructive" size="icon">
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Link */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Badge variant="outline">link</Badge>
                <span className="text-muted-foreground">
                  Inline links styled as buttons
                </span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="link">Learn more</Button>
                <Button variant="link">View documentation</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Sizes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Button Sizes</CardTitle>
          <CardDescription>Size comparison across variants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="text-center">
              <Button size="sm">Small</Button>
              <p className="text-xs text-muted-foreground mt-2">size=sm</p>
            </div>
            <div className="text-center">
              <Button>Default</Button>
              <p className="text-xs text-muted-foreground mt-2">default</p>
            </div>
            <div className="text-center">
              <Button size="lg">Large</Button>
              <p className="text-xs text-muted-foreground mt-2">size=lg</p>
            </div>
            <div className="text-center">
              <Button size="icon">
                <IconPlus className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-2">size=icon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Patterns */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Common UI Patterns</CardTitle>
          <CardDescription>
            Typical button combinations in context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Bar Pattern */}
          <div>
            <p className="text-sm font-medium mb-3">
              Action Bar (Primary + Secondary + Cancel)
            </p>
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Button variant="secondary">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add More
                  </Button>
                  <Button>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Process All
                  </Button>
                </div>
                <Button variant="ghost">Cancel</Button>
              </div>
            </div>
          </div>

          {/* Card Footer Pattern */}
          <div>
            <p className="text-sm font-medium mb-3">
              Card Footer (Save + Cancel)
            </p>
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex justify-end gap-3">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </div>
          </div>

          {/* Dropzone CTA Pattern */}
          <div>
            <p className="text-sm font-medium mb-3">Dropzone CTA</p>
            <div className="p-8 border-2 border-dashed rounded-lg text-center bg-muted/10">
              <IconUpload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                Drag & drop files here
              </p>
              <Button>Select Images</Button>
            </div>
          </div>

          {/* Destructive Confirmation */}
          <div>
            <p className="text-sm font-medium mb-3">Destructive Confirmation</p>
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex justify-end gap-3">
                <Button variant="outline">Keep</Button>
                <Button variant="destructive">
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Feedback and notification patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <IconInfoCircle className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              Informational message with neutral styling.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Alert</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again.
            </AlertDescription>
          </Alert>

          <Alert className="border-green-500/50 text-green-600 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400">
            <IconCircleCheck className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Operation completed successfully.
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Please review before proceeding.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Status indicators and labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
            <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>
            <Badge className="bg-blue-500 hover:bg-blue-600">Info</Badge>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-8">
        This page is only visible in development mode •{" "}
        <code className="text-xs">/church/[slug]/admin/dev/components</code>
      </p>
    </PageContainer>
  );
}
