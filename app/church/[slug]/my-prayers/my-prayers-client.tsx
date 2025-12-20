"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle,
  Printer,
  CheckCircle2,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrayerSection } from "@/components/prayer-session/prayer-section";
import type { PrayerCardData } from "@/components/prayer-session/prayer-card";
import {
  groupPrayersByCategory,
  CATEGORY_ORDER,
  getPrayerStats,
} from "@/lib/utils/prayer-priority";
import { markPrayerAnswered } from "@/actions/prayer-requests/mark-answered";
import { completePrayerSession } from "@/actions/prayer/complete-prayer-session";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { IconPray } from "@tabler/icons-react";

interface MyPrayersClientProps {
  prayers: PrayerCardData[];
  slug: string;
  userName: string;
}

export function MyPrayersClient({
  prayers: initialPrayers,
  slug,
  userName,
}: MyPrayersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prayers, setPrayers] = useState(initialPrayers);

  // Group prayers by category
  const groupedPrayers = groupPrayersByCategory(prayers);

  // Calculate stats
  const stats = getPrayerStats(prayers);
  const progressPercent =
    stats.total > 0 ? (stats.prayed / stats.total) * 100 : 0;

  // Handle marking a prayer as answered
  const handleMarkAnswered = async (prayerId: string) => {
    startTransition(async () => {
      const result = await markPrayerAnswered(slug, {
        id: prayerId,
        answeredDate: new Date(),
        answeredNotes: null,
      });

      if (result.status === "success") {
        // Update local state to show immediate feedback
        setPrayers(prev =>
          prev.map(p => (p.id === prayerId ? { ...p, status: "ANSWERED" } : p))
        );
        toast.success("Prayer marked as answered!");
      } else {
        toast.error(result.message || "Failed to mark prayer as answered");
      }
    });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle complete session
  const handleCompleteSession = () => {
    startTransition(async () => {
      const result = await completePrayerSession(slug);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to complete session");
      }
    });
  };

  // Empty state
  if (prayers.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="py-16">
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconPray className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>No prayers assigned to you</EmptyTitle>
                  <EmptyDescription>
                    When a prayer coordinator assigns prayers to you, they will
                    appear here for your prayer session.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header - Hidden on print */}
      <header className="sticky top-12 z-10 bg-background/95 backdrop-blur border-b print:static print:top-0 print:border-0 print:bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary print:hidden" />
                My Prayer Sheet
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(), "EEEE, MMMM d, yyyy")} &bull; {userName}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="default"
                size="sm"
                onClick={handleCompleteSession}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Complete Session
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 print:hidden">
            {stats.critical > 0 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {stats.critical}
                    </div>
                    <div className="text-xs text-red-600/80">Critical</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="py-3 px-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-3 px-4">
                <div className="text-2xl font-bold text-green-600">
                  {stats.prayed}
                </div>
                <div className="text-xs text-muted-foreground">Answered</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-3 px-4">
                <div className="text-2xl font-bold">{stats.remaining}</div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 print:hidden">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Session Progress</span>
              <span className="font-medium">
                {stats.prayed} of {stats.total} answered
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Completion Message */}
          {stats.remaining === 0 && stats.total > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 flex items-center gap-3 print:hidden">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <div className="font-semibold text-green-700 dark:text-green-400">
                  Prayer Session Complete!
                </div>
                <div className="text-sm text-green-600 dark:text-green-500">
                  All {stats.total} prayers have been marked as answered.
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Print Header - Only visible on print */}
      <div className="hidden print:block px-6 py-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold">Prayer Sheet</h1>
        <p className="text-sm text-gray-600">
          {format(new Date(), "EEEE, MMMM d, yyyy")} &bull; {userName} &bull;{" "}
          {stats.total} prayers
        </p>
      </div>

      {/* Prayer Sections */}
      <main className="max-w-3xl mx-auto px-4 py-4 sm:px-6 space-y-4 print:px-6 print:py-4">
        {isPending && (
          <div className="fixed top-4 right-4 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2 print:hidden">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating...</span>
          </div>
        )}

        {CATEGORY_ORDER.map(category => (
          <PrayerSection
            key={category}
            category={category}
            prayers={groupedPrayers[category]}
            onMarkAnswered={handleMarkAnswered}
            showActions={true}
          />
        ))}
      </main>

      {/* Print Footer */}
      <footer className="hidden print:block px-6 py-4 border-t border-gray-300 text-center text-sm text-gray-500">
        Printed from Church Connect Hub &bull;{" "}
        {format(new Date(), "MMM d, yyyy h:mm a")}
      </footer>
    </div>
  );
}
