import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconUserPlus,
  IconPray,
  IconHeart,
  IconBug,
  IconPlugConnected,
} from "@tabler/icons-react";

interface Task {
  label: string;
  completed: boolean;
}

interface WorktreeCardProps {
  name: string;
  branch: string;
  status: "ready" | "blocking" | "in-progress" | "critical" | "planning";
  statusLabel: string;
  icon: React.ReactNode;
  tasks: Task[];
}

function WorktreeCard({
  name,
  branch,
  status,
  statusLabel,
  icon,
  tasks,
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
      <CardContent className="pt-0">
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
      </CardContent>
    </Card>
  );
}

export default function DevDashboardPage() {
  const worktrees: WorktreeCardProps[] = [
    {
      name: "Connect Cards",
      branch: "feature/connect-card",
      status: "ready",
      statusLabel: "Ready for PR",
      icon: <IconUserPlus className="h-5 w-5" />,
      tasks: [
        { label: "Race conditions in batch creation", completed: true },
        { label: "Raw images in review queue", completed: true },
        { label: "Dashboard fetches ALL TIME data", completed: true },
        { label: "Cards not removing after save", completed: true },
        { label: "Remove Approve All button", completed: true },
        { label: "Simplified batch list UI", completed: true },
        { label: "CSV Export (Phase 3A)", completed: false },
        { label: "Card format onboarding", completed: false },
      ],
    },
    {
      name: "Prayer",
      branch: "feature/prayer-enhancements",
      status: "blocking",
      statusLabel: "65% - Blocking",
      icon: <IconPray className="h-5 w-5" />,
      tasks: [
        { label: "Database layer & schema", completed: true },
        { label: "Prayer requests table UI", completed: true },
        { label: "Search, filter, sort, pagination", completed: true },
        { label: "Privacy & status indicators", completed: true },
        { label: "E2E test suite (8 tests)", completed: true },
        { label: "Server action: createPrayerRequest", completed: false },
        { label: "Server action: updatePrayerRequest", completed: false },
        { label: "Server action: assignPrayerRequest", completed: false },
        { label: "Server action: markAnswered", completed: false },
        { label: "Server action: deletePrayerRequest", completed: false },
        { label: "UI: Create prayer form", completed: false },
        { label: "UI: Assignment dialog", completed: false },
        { label: "N+1 Query fix (8 COUNT queries)", completed: false },
      ],
    },
    {
      name: "Volunteer",
      branch: "feature/volunteer-management",
      status: "in-progress",
      statusLabel: "In Progress",
      icon: <IconHeart className="h-5 w-5" />,
      tasks: [
        { label: "Connect card volunteer extraction", completed: true },
        { label: "Volunteer category assignment", completed: true },
        { label: "Assign to volunteer leader", completed: true },
        { label: "SMS automation toggle", completed: true },
        { label: "Team volunteer category assignments", completed: true },
        { label: "Onboarding status tracking", completed: false },
        { label: "Onboarding pipeline dashboard", completed: false },
        { label: "Dynamic volunteer needs system", completed: false },
        { label: "Automated welcome messages", completed: false },
        { label: "Background check integration", completed: false },
        { label: "N+1 Query optimization", completed: false },
      ],
    },
    {
      name: "Tech Debt",
      branch: "feature/tech-debt",
      status: "critical",
      statusLabel: "Critical",
      icon: <IconBug className="h-5 w-5" />,
      tasks: [
        { label: "Subscription bypass fix", completed: true },
        { label: "PII removed from logs", completed: true },
        { label: "Pagination added to queries", completed: true },
        { label: "Missing database indexes", completed: false },
        { label: "Add caching layer", completed: false },
        { label: "Data abstraction / repository pattern", completed: false },
        { label: "Type safety violations", completed: false },
        { label: "Silent error swallowing", completed: false },
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
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Development Dashboard</h1>
        <p className="text-muted-foreground">
          Track progress across all feature worktrees
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {worktrees.map(worktree => (
          <WorktreeCard key={worktree.name} {...worktree} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Data sourced from /docs/features/*/vision.md • Update during PRs
      </p>
    </div>
  );
}
