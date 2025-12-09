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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
      statusLabel: "Phase 4 + E2E",
      icon: <IconUserPlus className="h-5 w-5" />,
      tasks: [
        { label: "Mobile Camera Wizard", completed: true },
        { label: "Background queue processing", completed: true },
        { label: "Two-sided card support", completed: true },
        { label: "Auto-crop to card bounds", completed: true },
        { label: "Fuzzy duplicate detection (PR #50)", completed: true },
        { label: "S3 org-scoped paths (PR #50)", completed: true },
        { label: "E2E workflow tests (PR #60)", completed: true },
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
      statusLabel: "Phase 1 Done",
      icon: <IconHeart className="h-5 w-5" />,
      tasks: [
        { label: "Leader auto-notification (PR #47)", completed: true },
        { label: "Document auto-send (PR #47)", completed: true },
        { label: "Export tracking (PR #52)", completed: true },
        { label: "Check All toggle fix (PR #53)", completed: true },
      ],
      wishlist: [
        { label: "Onboarding pipeline UI", completed: false },
        { label: "General volunteer automation", completed: false },
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
      </div>

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
