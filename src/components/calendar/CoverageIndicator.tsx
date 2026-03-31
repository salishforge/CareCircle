"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CoverageIndicatorProps {
  coveragePercent: number;
  openSlots: number;
}

export function CoverageIndicator({
  coveragePercent,
  openSlots,
}: CoverageIndicatorProps) {
  const isFullCoverage = coveragePercent === 100;
  const isLow = coveragePercent < 75;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-xl",
        isFullCoverage
          ? "bg-teal/10"
          : isLow
            ? "bg-coral/10"
            : "bg-amber/10"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "text-2xl font-bold",
            isFullCoverage
              ? "text-teal-dark"
              : isLow
                ? "text-coral-dark"
                : "text-amber-dark"
          )}
        >
          {coveragePercent}%
        </div>
        <div className="text-sm">
          <p className="font-medium">
            {isFullCoverage
              ? "Fully covered!"
              : `${openSlots} slot${openSlots !== 1 ? "s" : ""} need help`}
          </p>
          <p className="text-muted-foreground text-xs">This week&apos;s coverage</p>
        </div>
      </div>
      {!isFullCoverage && (
        <Badge
          className={cn(
            "text-xs",
            isLow ? "bg-coral text-white" : "bg-amber text-white"
          )}
        >
          Help needed
        </Badge>
      )}
    </div>
  );
}
