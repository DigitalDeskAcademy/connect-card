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
} from "@tabler/icons-react";

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
        {
          label: "Scanner folder integration (File System Access API)",
          completed: false,
        },
        { label: "Phone camera capture (fallback)", completed: false },
        { label: "Auto-detect new scans in folder", completed: false },
        { label: "Upload flow polished", completed: true },
        { label: "AI extraction reliable", completed: true },
        { label: "Review queue complete", completed: true },
        { label: "Batch save/complete flow", completed: true },
      ],
    },
    {
      title: "Prayer Batches",
      items: [
        {
          label: "Auto-bundle: all prayers since last session",
          completed: false,
        },
        { label: "Create batch UI", completed: true },
        { label: "Prayer session output (printable)", completed: false },
      ],
    },
    {
      title: "Volunteer Onboarding",
      items: [
        { label: "Onboarding pipeline UI", completed: false },
        { label: "Automated welcome flow", completed: false },
        { label: "Background check tracking", completed: false },
        { label: "Leader assignment/notification", completed: false },
      ],
    },
    {
      title: "Export",
      items: [
        { label: "CSV export functional", completed: false },
        { label: "API button (placeholder for demo)", completed: false },
      ],
    },
    {
      title: "Demo Polish",
      items: [
        { label: "Sample data seeded", completed: false },
        { label: "End-to-end happy path tested", completed: false },
        { label: "No console errors", completed: false },
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
      statusLabel: "Ready for PR",
      icon: <IconUserPlus className="h-5 w-5" />,
      tasks: [
        { label: "CSV Export (Phase 3A)", completed: false },
        { label: "Card format onboarding", completed: false },
        {
          label: "Handle 'Send background check' checkbox in Review UI",
          completed: false,
        },
      ],
      wishlist: [
        { label: "Send message to Leader checkbox feature", completed: false },
        {
          label: "Automation for First Time / New Visitor selections",
          completed: false,
        },
      ],
    },
    {
      name: "Prayer",
      branch: "feature/prayer-enhancements",
      status: "blocking",
      statusLabel: "65% - Blocking",
      icon: <IconPray className="h-5 w-5" />,
      tasks: [
        { label: "Server action: createPrayerRequest", completed: false },
        { label: "Server action: updatePrayerRequest", completed: false },
        { label: "Server action: assignPrayerRequest", completed: false },
        { label: "Server action: markAnswered", completed: false },
        { label: "Server action: deletePrayerRequest", completed: false },
        { label: "UI: Create prayer form", completed: false },
        { label: "UI: Assignment dialog", completed: false },
        { label: "N+1 Query fix (8 COUNT queries)", completed: false },
      ],
      wishlist: [
        { label: "<Wishlist item 1>", completed: false },
        { label: "<Wishlist item 2>", completed: false },
      ],
    },
    {
      name: "Volunteer",
      branch: "feature/volunteer-management",
      status: "in-progress",
      statusLabel: "In Progress",
      icon: <IconHeart className="h-5 w-5" />,
      tasks: [
        { label: "Onboarding status tracking", completed: false },
        { label: "Onboarding pipeline dashboard", completed: false },
        { label: "Dynamic volunteer needs system", completed: false },
        { label: "Automated welcome messages", completed: false },
        { label: "Background check integration", completed: false },
        { label: "N+1 Query optimization", completed: false },
      ],
      wishlist: [
        { label: "<Wishlist item 1>", completed: false },
        { label: "<Wishlist item 2>", completed: false },
      ],
    },
    {
      name: "Tech Debt",
      branch: "feature/tech-debt",
      status: "critical",
      statusLabel: "Critical",
      icon: <IconBug className="h-5 w-5" />,
      tasks: [
        { label: "Missing database indexes", completed: false },
        { label: "Add caching layer", completed: false },
        { label: "Data abstraction / repository pattern", completed: false },
        { label: "Type safety violations", completed: false },
        { label: "Silent error swallowing", completed: false },
      ],
      wishlist: [
        { label: "<Wishlist item 1>", completed: false },
        { label: "<Wishlist item 2>", completed: false },
      ],
    },
    {
      name: "Integrations",
      branch: "feature/integrations",
      status: "planning",
      statusLabel: "Planning",
      icon: <IconPlugConnected className="h-5 w-5" />,
      tasks: [
        { label: "Export page UI with filters", completed: false },
        { label: "Planning Center CSV format", completed: false },
        { label: "Breeze CSV format", completed: false },
        { label: "Generic CSV format", completed: false },
        { label: "Export tracking (mark as exported)", completed: false },
        { label: "Planning Center OAuth connection", completed: false },
        { label: "Breeze OAuth connection", completed: false },
        { label: "Field mapping UI", completed: false },
      ],
      wishlist: [
        { label: "<Wishlist item 1>", completed: false },
        { label: "<Wishlist item 2>", completed: false },
      ],
    },
    {
      name: "Dashboard",
      branch: "main",
      status: "in-progress",
      statusLabel: "In Progress",
      icon: <IconDashboard className="h-5 w-5" />,
      tasks: [],
      wishlist: [
        { label: "<Wishlist item 1>", completed: false },
        { label: "<Wishlist item 2>", completed: false },
      ],
    },
  ];

  return (
    <PageContainer as="main" backButton={{ href: `/church/${slug}/admin` }}>
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
