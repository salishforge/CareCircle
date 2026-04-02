"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DayData {
  hasShifts: boolean;
  hasAppointments: boolean;
  hasMeals: boolean;
}

const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthGrid({ careCircleId }: { careCircleId: string | null }) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayData, setDayData] = useState<Record<string, DayData>>({});

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Build array of all visible days
  const days: Date[] = [];
  let d = calendarStart;
  while (d <= calendarEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const loadMonthData = useCallback(async () => {
    if (!careCircleId) return;
    const from = format(calendarStart, "yyyy-MM-dd");
    const to = format(calendarEnd, "yyyy-MM-dd");

    try {
      // Fetch shifts for the month
      const [shiftsRes, apptsRes] = await Promise.all([
        fetch(`/api/shifts?careCircleId=${careCircleId}&weekOf=${format(monthStart, "yyyy-MM-dd")}`),
        fetch(`/api/appointments?careCircleId=${careCircleId}&upcoming=false`),
      ]);

      const shifts = await shiftsRes.json().catch(() => []);
      const appointments = await apptsRes.json().catch(() => []);

      const data: Record<string, DayData> = {};

      if (Array.isArray(shifts)) {
        for (const shift of shifts) {
          const dateKey = shift.date?.split("T")[0] ?? format(new Date(shift.startTime), "yyyy-MM-dd");
          if (!data[dateKey]) data[dateKey] = { hasShifts: false, hasAppointments: false, hasMeals: false };
          data[dateKey].hasShifts = true;
        }
      }

      if (Array.isArray(appointments)) {
        for (const appt of appointments) {
          const dateKey = format(new Date(appt.dateTime), "yyyy-MM-dd");
          if (!data[dateKey]) data[dateKey] = { hasShifts: false, hasAppointments: false, hasMeals: false };
          data[dateKey].hasAppointments = true;
        }
      }

      setDayData(data);
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careCircleId, currentMonth.getMonth()]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  function handleDayClick(day: Date) {
    router.push(`/calendar/${format(day, "yyyy-MM-dd")}`);
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous month</span>
        </Button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((header, i) => (
          <div
            key={i}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            {header}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const data = dayData[dateKey];

          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={`
                relative flex flex-col items-center py-2.5 min-h-[56px] xl:min-h-[72px] transition-colors
                ${inMonth ? "bg-card hover:bg-muted" : "bg-muted/30 text-muted-foreground/50"}
                ${today ? "ring-2 ring-inset ring-primary" : ""}
              `}
              aria-label={`${format(day, "EEEE, MMMM d")}${data?.hasShifts ? ", has shifts" : ""}${data?.hasAppointments ? ", has appointments" : ""}`}
            >
              <span
                className={`text-sm font-medium ${
                  today ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center" : ""
                }`}
              >
                {format(day, "d")}
              </span>

              {/* Indicator dots */}
              {data && inMonth && (
                <div className="flex gap-1 mt-1">
                  {data.hasShifts && (
                    <div className="h-1.5 w-1.5 rounded-full bg-sage" title="Shifts" />
                  )}
                  {data.hasAppointments && (
                    <div className="h-1.5 w-1.5 rounded-full bg-amber" title="Appointments" />
                  )}
                  {data.hasMeals && (
                    <div className="h-1.5 w-1.5 rounded-full bg-coral" title="Meals" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-sage" />
          Shifts
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-amber" />
          Appointments
        </div>
      </div>
    </div>
  );
}
