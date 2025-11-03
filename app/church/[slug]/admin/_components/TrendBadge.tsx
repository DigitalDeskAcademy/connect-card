import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  trend: number; // percentage, e.g., 12.5 means +12.5%
  className?: string;
}

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const isFlat = trend === 0;

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        {
          "bg-green-500/10 text-green-600 dark:text-green-400": isPositive,
          "bg-red-500/10 text-red-600 dark:text-red-400": isNegative,
          "bg-muted text-muted-foreground": isFlat,
        },
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>
        {isPositive && "+"}
        {trend}%
      </span>
    </div>
  );
}
