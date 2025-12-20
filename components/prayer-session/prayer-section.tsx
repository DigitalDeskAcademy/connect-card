"use client";

import { useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrayerCard, type PrayerCardData } from "./prayer-card";
import {
  PRAYER_CATEGORIES,
  type PrayerCategoryKey,
} from "@/lib/utils/prayer-priority";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  defaultOpen?: boolean;
}

/**
 * Prayer Section Component
 *
 * Collapsible groups of prayers by category with colored headers.
 * Critical and Private sections default to open, others can be collapsed.
 */
export function PrayerSection({
  category,
  prayers,
  onMarkAnswered,
  showActions = true,
  defaultOpen,
}: PrayerSectionProps) {
  // Default open for Critical and Private, closed for others with many prayers
  const shouldDefaultOpen =
    defaultOpen ??
    (category === "CRITICAL" || category === "PRIVATE" || prayers.length <= 5);
  const [isOpen, setIsOpen] = useState(shouldDefaultOpen);

  if (prayers.length === 0) return null;

  const config = PRAYER_CATEGORIES[category];
  const icon = CATEGORY_ICONS[category];

  // Calculate progress
  const answeredCount = prayers.filter(p => p.status === "ANSWERED").length;
  const totalCount = prayers.length;
  const allAnswered = answeredCount === totalCount;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="print:break-inside-avoid-page"
    >
      {/* Section Header - Clickable */}
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-2 pb-2 border-b-2 transition-colors hover:opacity-80",
            config.borderColor,
            "print:border-b print:border-gray-400"
          )}
        >
          <span className={cn(config.color, "print:text-black")}>{icon}</span>
          <h2
            className={cn(
              "text-base font-semibold",
              config.color,
              "print:text-black"
            )}
          >
            {config.label}
          </h2>
          <span
            className={cn(
              "text-sm ml-auto mr-2",
              allAnswered
                ? "text-green-600 font-medium"
                : "text-muted-foreground"
            )}
          >
            {answeredCount > 0 ? (
              <>
                {answeredCount}/{totalCount}
              </>
            ) : (
              totalCount
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform print:hidden",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3">
        {/* Prayer hint for private section */}
        {category === "PRIVATE" && (
          <div className="mb-3 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground print:bg-gray-100">
            <Lock className="h-3 w-3 inline-block mr-1.5" />
            Do not share during group prayer.
          </div>
        )}

        {/* Critical section warning */}
        {category === "CRITICAL" && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 text-xs text-red-500 print:bg-gray-100 print:text-black">
            <AlertTriangle className="h-3 w-3 inline-block mr-1.5" />
            Immediate attention needed.
          </div>
        )}

        {/* Prayer Cards - tighter spacing */}
        <div className="space-y-2">
          {prayers.map(prayer => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              onMarkAnswered={onMarkAnswered}
              showActions={showActions}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
