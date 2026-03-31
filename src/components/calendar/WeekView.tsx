"use client";

import { useState } from "react";
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverageIndicator } from "./CoverageIndicator";
import { ShiftCard } from "./ShiftCard";

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  primaryCaregiver?: { name: string; image?: string | null } | null;
  alternateCaregiver?: { name: string; image?: string | null } | null;
}

interface WeekViewProps {
  shifts: Shift[];
  coveragePercent: number;
  openSlots: number;
  onWeekChange?: (weekStart: Date) => void;
  onSignUp?: (shiftId: string) => void;
}

export function WeekView({
  shifts,
  coveragePercent,
  openSlots,
  onWeekChange,
  onSignUp,
}: WeekViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  function navigateWeek(direction: "prev" | "next") {
    const newWeek =
      direction === "prev"
        ? subWeeks(currentWeekStart, 1)
        : addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeek);
    onWeekChange?.(newWeek);
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  function getShiftsForDay(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    return shifts.filter((s) => s.date === dayStr);
  }

  return (
    <div className="space-y-4">
      {/* Coverage indicator */}
      <CoverageIndicator
        coveragePercent={coveragePercent}
        openSlots={openSlots}
      />

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek("prev")}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous week</span>
        </Button>
        <h3 className="text-base font-semibold">
          {format(currentWeekStart, "MMM d")} -{" "}
          {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek("next")}
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next week</span>
        </Button>
      </div>

      {/* Day columns */}
      <div className="space-y-6">
        {days.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isToday =
            format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={day.toISOString()}>
              <div
                className={`flex items-center gap-2 mb-3 ${
                  isToday ? "text-primary" : ""
                }`}
              >
                <span className="text-sm font-semibold">
                  {format(day, "EEEE")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(day, "MMM d")}
                </span>
                {isToday && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>

              {dayShifts.length === 0 ? (
                <div className="border border-dashed border-amber/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No shifts scheduled
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayShifts.map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      id={shift.id}
                      startTime={new Date(shift.startTime)}
                      endTime={new Date(shift.endTime)}
                      status={shift.status}
                      primaryCaregiver={shift.primaryCaregiver}
                      alternateCaregiver={shift.alternateCaregiver}
                      onSignUp={onSignUp}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
