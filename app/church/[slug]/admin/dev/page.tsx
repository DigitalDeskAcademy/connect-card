import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PageContainer } from "@/components/layout/page-container";
import {
  IconUserPlus,
  IconPray,
  IconHeart,
  IconBug,
  IconPlugConnected,
  IconDashboard,
  IconRocket,
  IconPalette,
  IconQrcode,
  IconTestPipe,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Task {
  label: string;
  completed: boolean;
}

interface ChecklistSection {
  title: string;
  items: Task[];
}

interface TestSuite {
  name: string;
  file: string;
  testCount: number;
  status: "passing" | "failing" | "pending";
  description: string;
}

function E2ETestStatus() {
  const testSuites: TestSuite[] = [
    {
      name: "Auth Setup",
      file: "00-auth.setup.ts",
      testCount: 1,
      status: "passing",
      description:
        "Ensures staff can log in securely using email verification. This is the foundation for all other tests—if login breaks, nothing else works. It protects against unauthorized access to church data.",
    },
    {
      name: "Smoke Tests",
      file: "00-smoke-tests.spec.ts",
      testCount: 38,
      status: "passing",
      description:
        "Quickly checks that every admin page loads without crashing. Think of it as a daily health check—if any page has a critical error, this catches it immediately before staff encounter problems.",
    },
    {
      name: "Connect Card Workflow",
      file: "01-connect-card-workflow.spec.ts",
      testCount: 8,
      status: "passing",
      description:
        "Verifies the complete journey of processing a connect card: uploading, AI extraction, staff review, and saving contact info. This ensures Sunday visitors get properly followed up.",
    },
    {
      name: "Batch Operations",
      file: "02-batch-operations.spec.ts",
      testCount: 8,
      status: "passing",
      description:
        "Tests the ability to process multiple connect cards at once. Churches often scan 20-50 cards after service—this ensures bulk processing works reliably under real-world conditions.",
    },
    {
      name: "Review Queue",
      file: "03-review-queue.spec.ts",
      testCount: 5,
      status: "passing",
      description:
        "Confirms staff can efficiently review and correct AI-extracted data. Even with 85% accuracy, some cards need human review—this ensures that workflow is smooth and intuitive.",
    },
    {
      name: "Export Functionality",
      file: "14-export-functionality.spec.ts",
      testCount: 16,
      status: "passing",
      description:
        "Validates that contact data exports correctly to Planning Center, Breeze, and CSV formats. Churches rely on this to sync visitor data with their existing member management systems.",
    },
    {
      name: "Contacts Module",
      file: "15-contacts-module.spec.ts",
      testCount: 14,
      status: "passing",
      description:
        "Tests the central contacts directory—searching, filtering, and viewing member details. This is where staff find and manage their congregation's contact information daily.",
    },
    {
      name: "Settings Pages",
      file: "16-settings-pages.spec.ts",
      testCount: 18,
      status: "passing",
      description:
        "Ensures church admins can configure volunteer onboarding documents, ministry requirements, and system preferences. Also verifies that non-admin staff cannot access sensitive settings.",
    },
    {
      name: "Analytics/Insights",
      file: "17-analytics-insights.spec.ts",
      testCount: 0,
      status: "pending",
      description:
        "Will test dashboard statistics and reporting features. Churches need accurate visitor trends, volunteer engagement, and prayer request metrics to make informed ministry decisions.",
    },
    {
      name: "QR Scan Flow",
      file: "18-qr-scan-flow.spec.ts",
      testCount: 0,
      status: "pending",
      description:
        "Will verify the digital connect card experience—visitors scanning a QR code and submitting their info on their phone. This modern alternative to paper cards needs to work flawlessly.",
    },
  ];

  const passingTests = testSuites
    .filter(s => s.status === "passing")
    .reduce((acc, s) => acc + s.testCount, 0);

  return (
    <Card className="mb-6 border-2 border-dashed border-blue-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <IconTestPipe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">E2E Test Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                Playwright test suite coverage
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {passingTests}
            </div>
            <div className="text-xs text-muted-foreground">tests passing</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {testSuites.map(suite => (
            <div
              key={suite.file}
              className={`p-4 rounded-lg border ${
                suite.status === "passing"
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : suite.status === "failing"
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    : "bg-muted/50 border-muted"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {suite.status === "passing" ? (
                    <IconCheck className="h-5 w-5 text-green-600" />
                  ) : suite.status === "failing" ? (
                    <IconX className="h-5 w-5 text-red-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className="font-medium">{suite.name}</span>
                </div>
                <div className="text-sm">
                  {suite.testCount > 0 ? (
                    <span
                      className={
                        suite.status === "passing"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {suite.testCount} checks
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Planned
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {suite.description}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">How to Run Tests</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">Run all tests:</p>
              <code className="text-xs bg-background px-2 py-1 rounded block">
                pnpm test:e2e
              </code>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">View HTML report:</p>
              <code className="text-xs bg-background px-2 py-1 rounded block">
                pnpm exec playwright show-report
              </code>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">
                Run with UI (interactive):
              </p>
              <code className="text-xs bg-background px-2 py-1 rounded block">
                pnpm exec playwright test --ui
              </code>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">Run specific file:</p>
              <code className="text-xs bg-background px-2 py-1 rounded block">
                pnpm exec playwright test 15-contacts
              </code>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>Note:</strong> The HTML report opens at{" "}
            <code className="bg-muted px-1 rounded">localhost:9323</code> after
            running show-report. Tests are located in{" "}
            <code className="bg-muted px-1 rounded">/tests/e2e/</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DemoReadyChecklist() {
  const sections: ChecklistSection[] = [
    {
      title: "Connect Cards",
      items: [
        { label: "Mobile Camera Wizard (live viewfinder)", completed: true },
        { label: "Background queue processing", completed: true },
        { label: "Two-sided card support (front/back)", completed: true },
        { label: "Auto-crop to card bounds", completed: true },
        { label: "Upload flow polished", completed: true },
        { label: "AI extraction reliable", completed: true },
        { label: "Review queue complete", completed: true },
        { label: "Batch save/complete flow", completed: true },
        { label: "Fuzzy duplicate detection (PR #50)", completed: true },
        { label: "S3 org-scoped paths (PR #50)", completed: true },
        { label: "Review Mode (see & type simultaneously)", completed: true },
      ],
    },
    {
      title: "Prayer Management",
      items: [
        { label: "All 6 server actions (PR #49)", completed: true },
        { label: "Create/Edit/Detail dialogs (PR #49)", completed: true },
        { label: "N+1 query optimization (PR #51)", completed: true },
        { label: "Privacy redaction (PR #56)", completed: true },
        { label: "My Prayer Sheet (PR #57)", completed: true },
      ],
    },
    {
      title: "Volunteer Onboarding",
      items: [
        { label: "Leader auto-notification (PR #47)", completed: true },
        { label: "Document auto-send (PR #47)", completed: true },
        { label: "Export tracking (PR #52)", completed: true },
        { label: "Check All toggle fix (PR #53)", completed: true },
        { label: "Volunteer Assignment UX polish", completed: true },
        { label: "Onboarding pipeline UI", completed: false },
      ],
    },
    {
      title: "Export/Integrations",
      items: [
        { label: "CSV export functional (PR #48)", completed: true },
        { label: "Planning Center format", completed: true },
        { label: "Breeze format", completed: true },
        { label: "Email deduplication", completed: true },
        { label: "Export history", completed: true },
        { label: "Field selection (PR #58)", completed: true },
        { label: "Unified DataTable (PR #58)", completed: true },
      ],
    },
    {
      title: "Demo Polish",
      items: [
        { label: "Theme switching (PR #54)", completed: true },
        { label: "Theme persistence (PR #55)", completed: true },
        { label: "Component library page", completed: true },
        { label: "E2E workflow tests (PR #60)", completed: true },
        { label: "Sample data seeded", completed: false },
        { label: "Demo video recorded", completed: false },
      ],
    },
    {
      title: "QR Code Connect Cards",
      items: [
        { label: "ConnectCardToken Prisma model (PR #73)", completed: true },
        { label: "Public /connect/[token] route (PR #73)", completed: true },
        { label: "Digital connect card form (PR #73)", completed: true },
        { label: "QR code generator (admin)", completed: false },
        { label: "QR management UI", completed: false },
        { label: "Scan analytics tracking", completed: false },
      ],
    },
  ];

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const completedItems = sections.reduce(
    (acc, s) => acc + s.items.filter(i => i.completed).length,
    0
  );
  const percentage = Math.round((completedItems / totalItems) * 100);

  return (
    <Card className="mb-6 border-2 border-dashed border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconRocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Demo Ready Checklist</CardTitle>
              <p className="text-sm text-muted-foreground">
                MVP features needed for church demo
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{percentage}%</div>
            <div className="text-xs text-muted-foreground">
              {completedItems}/{totalItems} complete
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {sections.map(section => (
            <div key={section.title}>
              <h4 className="font-medium text-sm mb-2">{section.title}</h4>
              <div className="space-y-1.5">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Checkbox
                      checked={item.completed}
                      disabled
                      className="h-4 w-4 mt-0.5"
                    />
                    <span
                      className={`text-xs ${item.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Post-MVP:</strong> Scanner setup wizard for non-tech users •
            Video walkthrough • Guided onboarding
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface WorktreeCardProps {
  name: string;
  branch: string;
  status: "ready" | "blocking" | "in-progress" | "critical" | "planning";
  statusLabel: string;
  icon: React.ReactNode;
  tasks: Task[];
  wishlist?: Task[];
}

function WorktreeCard({
  name,
  branch,
  status,
  statusLabel,
  icon,
  tasks,
  wishlist,
}: WorktreeCardProps) {
  const statusColors = {
    ready: "bg-green-500",
    blocking: "bg-orange-500",
    "in-progress": "bg-yellow-500",
    critical: "bg-red-500",
    planning: "bg-blue-500",
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">{icon}</div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {branch}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusColors[status]}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {completedCount}/{totalCount} tasks
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox checked={task.completed} disabled className="h-4 w-4" />
              <span
                className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {task.label}
              </span>
            </div>
          ))}
        </div>

        {wishlist && wishlist.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Wishlist
            </p>
            <div className="space-y-2">
              {wishlist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.completed}
                    disabled
                    className="h-4 w-4"
                  />
                  <span
                    className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DevDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const worktrees: WorktreeCardProps[] = [
    {
      name: "Connect Cards",
      branch: "feature/connect-card",
      status: "ready",
      statusLabel: "✅ Ready",
      icon: <IconUserPlus className="h-5 w-5" />,
      tasks: [
        { label: "Mobile Camera Wizard", completed: true },
        { label: "Background queue processing", completed: true },
        { label: "Two-sided card support", completed: true },
        { label: "Auto-crop to card bounds", completed: true },
        { label: "Fuzzy duplicate detection (PR #50)", completed: true },
        { label: "S3 org-scoped paths (PR #50)", completed: true },
        { label: "E2E workflow tests (PR #60)", completed: true },
        { label: "Volunteer Assignment UX polish", completed: true },
        { label: "Review Mode (see & type)", completed: true },
      ],
      wishlist: [
        { label: "Card format onboarding", completed: false },
        { label: "Planning Center direct sync", completed: false },
      ],
    },
    {
      name: "Prayer",
      branch: "feature/prayer-enhancements",
      status: "ready",
      statusLabel: "✅ Complete",
      icon: <IconPray className="h-5 w-5" />,
      tasks: [
        { label: "All 6 server actions (PR #49)", completed: true },
        { label: "Create/Edit/Detail dialogs (PR #49)", completed: true },
        { label: "N+1 query optimization (PR #51)", completed: true },
        { label: "Privacy redaction (PR #56)", completed: true },
        { label: "My Prayer Sheet (PR #57)", completed: true },
      ],
      wishlist: [
        { label: "Connect card → auto-create prayer", completed: false },
        { label: "Dedicated assignment dialog", completed: false },
      ],
    },
    {
      name: "Volunteer",
      branch: "feature/volunteer-management",
      status: "ready",
      statusLabel: "Phase 2 Done",
      icon: <IconHeart className="h-5 w-5" />,
      tasks: [
        { label: "Leader auto-notification (PR #47)", completed: true },
        { label: "Document auto-send (PR #47)", completed: true },
        { label: "Export tracking (PR #52)", completed: true },
        { label: "Check All toggle fix (PR #53)", completed: true },
        { label: "Onboarding automation (PR #61)", completed: true },
        { label: "BG check self-report page (PR #61)", completed: true },
        { label: "Staff review queue (PR #61)", completed: true },
        { label: "Vitest test suite (37 tests)", completed: true },
      ],
      wishlist: [
        { label: "Bulk messaging UI", completed: false },
        { label: "GHL SMS/Email integration", completed: false },
      ],
    },
    {
      name: "GHL Integration",
      branch: "feature/ghl-integration",
      status: "ready",
      statusLabel: "Phase 1 Done",
      icon: <IconPlugConnected className="h-5 w-5" />,
      tasks: [
        { label: "GHL MCP connected", completed: true },
        { label: "Service layer (lib/ghl/) (PR #72)", completed: true },
        { label: "Contact sync on save (PR #72)", completed: true },
        { label: "Welcome SMS on onboarding (PR #72)", completed: true },
        { label: "End-to-end demo flow (PR #72)", completed: true },
      ],
      wishlist: [
        { label: "Ministry management UI (Phase 2)", completed: false },
        { label: "Bulk messaging UI", completed: false },
        { label: "BG check SMS sequence", completed: false },
        { label: "Church GHL connection UI", completed: false },
      ],
    },
    {
      name: "Tech Debt",
      branch: "feature/tech-debt",
      status: "ready",
      statusLabel: "Phase 1 Done",
      icon: <IconBug className="h-5 w-5" />,
      tasks: [
        { label: "Subscription bypass fixed", completed: true },
        { label: "PII removed from logs", completed: true },
        { label: "Database indexes added", completed: true },
        { label: "Pagination added", completed: true },
        { label: "Type safety improvements", completed: true },
        { label: "S3 multi-tenant safety (PR #62)", completed: true },
      ],
      wishlist: [
        { label: "Add caching layer", completed: false },
        { label: "Data abstraction / repository pattern", completed: false },
        { label: "S3 lifecycle policies", completed: false },
      ],
    },
    {
      name: "Integrations",
      branch: "feature/integrations",
      status: "ready",
      statusLabel: "Phase 1 Done",
      icon: <IconPlugConnected className="h-5 w-5" />,
      tasks: [
        { label: "Export page UI (PR #48)", completed: true },
        { label: "Planning Center CSV format", completed: true },
        { label: "Breeze CSV format", completed: true },
        { label: "Email deduplication", completed: true },
        { label: "Export history", completed: true },
        { label: "Field selection (PR #58)", completed: true },
        { label: "Unified DataTable (PR #58)", completed: true },
      ],
      wishlist: [
        { label: "Volunteer export tab", completed: false },
        { label: "Planning Center OAuth", completed: false },
        { label: "Breeze OAuth", completed: false },
      ],
    },
    {
      name: "Dashboard",
      branch: "main",
      status: "ready",
      statusLabel: "Active",
      icon: <IconDashboard className="h-5 w-5" />,
      tasks: [
        { label: "Theme switching (PR #54)", completed: true },
        { label: "Theme persistence (PR #55)", completed: true },
        { label: "Quick action cards", completed: true },
        { label: "Starry Night Main theme (PR #59)", completed: true },
        { label: "Component library page", completed: true },
        { label: "Navigation cleanup", completed: true },
      ],
      wishlist: [
        { label: "Analytics dashboard", completed: false },
        { label: "Mobile responsive polish", completed: false },
      ],
    },
    {
      name: "QR Code Cards",
      branch: "feature/connect-card",
      status: "ready",
      statusLabel: "Phase 1 Done",
      icon: <IconQrcode className="h-5 w-5" />,
      tasks: [
        { label: "ConnectCardToken Prisma model (PR #73)", completed: true },
        { label: "Public /connect/[token] route (PR #73)", completed: true },
        { label: "Digital connect card form (PR #73)", completed: true },
        { label: "Form submission server action (PR #73)", completed: true },
        { label: "QR code generator component", completed: false },
        { label: "Admin QR management UI", completed: false },
      ],
      wishlist: [
        { label: "Scan analytics dashboard", completed: false },
        { label: "QR code expiration", completed: false },
        { label: "Branded QR codes with logo", completed: false },
      ],
    },
    {
      name: "Platform Admin",
      branch: "feature/platform-admin",
      status: "planning",
      statusLabel: "Planning",
      icon: <IconDashboard className="h-5 w-5" />,
      tasks: [
        { label: "Platform auth helper", completed: false },
        { label: "PlatformRole schema", completed: false },
        { label: "Data access layer", completed: false },
        { label: "Dashboard real stats", completed: false },
        { label: "Organizations page", completed: false },
        { label: "Cross-org contacts", completed: false },
      ],
      wishlist: [
        { label: "Revenue dashboard", completed: false },
        { label: "Feature flags per-org", completed: false },
        { label: "Audit log viewer", completed: false },
      ],
    },
  ];

  return (
    <PageContainer as="main">
      {/* Quick Links */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/church/${slug}/admin/dev/components`}>
            <IconPalette className="mr-2 h-4 w-4" />
            Component Library
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/church/${slug}/admin/dev/extraction-test`}>
            <IconTestPipe className="mr-2 h-4 w-4" />
            Extraction Test
          </Link>
        </Button>
      </div>

      <E2ETestStatus />

      <DemoReadyChecklist />

      <h2 className="text-lg font-semibold mb-4">Worktree Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {worktrees.map(worktree => (
          <WorktreeCard key={worktree.name} {...worktree} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Data sourced from /docs/features/*/vision.md • Update during PRs
      </p>
    </PageContainer>
  );
}
