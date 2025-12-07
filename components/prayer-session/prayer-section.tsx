"use client";

import {
  AlertTriangle,
  Heart,
  Users,
  Sparkles,
  DollarSign,
  Briefcase,
  HeartHandshake,
  BookOpen,
  MessageCircle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrayerCard, type PrayerCardData } from "./prayer-card";
import {
  PRAYER_CATEGORIES,
  type PrayerCategoryKey,
} from "@/lib/utils/prayer-priority";

// Icon mapping for categories
const CATEGORY_ICONS: Record<PrayerCategoryKey, React.ReactNode> = {
  CRITICAL: <AlertTriangle className="h-5 w-5" />,
  Health: <Heart className="h-5 w-5" />,
  Family: <Users className="h-5 w-5" />,
  Salvation: <Sparkles className="h-5 w-5" />,
  Financial: <DollarSign className="h-5 w-5" />,
  "Work/Career": <Briefcase className="h-5 w-5" />,
  Relationships: <HeartHandshake className="h-5 w-5" />,
  "Spiritual Growth": <BookOpen className="h-5 w-5" />,
  Other: <MessageCircle className="h-5 w-5" />,
  PRIVATE: <Lock className="h-5 w-5" />,
};

interface PrayerSectionProps {
  category: PrayerCategoryKey;
  prayers: PrayerCardData[];
  onMarkAnswered?: (prayerId: string) => Promise<void>;
  showActions?: boolean;
}

/**
 * Prayer Section Component
 *
 * Groups prayers by category with a styled header.
 * Used in the prayer session view to organize prayers visually.
 */
export function PrayerSection({
  category,
  prayers,
  onMarkAnswered,
  showActions = true,
}: PrayerSectionProps) {
  if (prayers.length === 0) return null;

  const config = PRAYER_CATEGORIES[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <section className="print:break-inside-avoid-page">
      {/* Section Header */}
      <div
        className={cn(
          "flex items-center gap-2 mb-4 pb-2 border-b-2",
          config.borderColor,
          "print:border-b print:border-gray-400"
        )}
      >
        <span className={cn(config.color, "print:text-black")}>{icon}</span>
        <h2
          className={cn(
            "text-lg font-semibold",
            config.color,
            "print:text-black"
          )}
        >
          {config.label}
        </h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {prayers.length} {prayers.length === 1 ? "prayer" : "prayers"}
        </span>
      </div>

      {/* Prayer hint for private section */}
      {category === "PRIVATE" && (
        <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-sm text-muted-foreground print:bg-gray-100">
          <Lock className="h-4 w-4 inline-block mr-2" />
          These prayers are marked private. Please do not share them during
          group prayer. Pray for these individually.
        </div>
      )}

      {/* Critical section warning */}
      {category === "CRITICAL" && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300 print:bg-gray-100 print:text-black">
          <AlertTriangle className="h-4 w-4 inline-block mr-2" />
          These prayers need immediate and focused attention. Please prioritize
          these in your prayer time.
        </div>
      )}

      {/* Prayer Cards */}
      <div className="space-y-4">
        {prayers.map(prayer => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            onMarkAnswered={onMarkAnswered}
            showActions={showActions}
          />
        ))}
      </div>
    </section>
  );
}
