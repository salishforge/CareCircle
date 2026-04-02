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
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddEventSheet } from "./AddEventSheet";

interface EventItem {
  id: string;
  label: string;
  time: string;
  type: "shift" | "appointment" | "meal";
}

interface DayEvents {
  events: EventItem[];
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_HEADERS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const EVENT_COLORS: Record<string, string> = {
  shift: "bg-sage/20 text-sage-dark border-l-2 border-l-sage",
  appointment: "bg-amber/20 text-amber-dark border-l-2 border-l-amber",
  meal: "bg-coral/10 text-coral-dark border-l-2 border-l-coral",
};

export function MonthGrid({ careCircleId }: { careCircleId: string | null }) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayEvents, setDayEvents] = useState<Record<string, DayEvents>>({});
  const [addDate, setAddDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let d = calendarStart;
  while (d <= calendarEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const loadMonthData = useCallback(async () => {
    if (!careCircleId) return;

    try {
      const [shiftsRes, apptsRes] = await Promise.all([
        fetch(`/api/shifts?careCircleId=${careCircleId}&weekOf=${format(monthStart, "yyyy-MM-dd")}`),
        fetch(`/api/appointments?careCircleId=${careCircleId}&upcoming=false`),
      ]);

      const shifts = await shiftsRes.json().catch(() => []);
      const appointments = await apptsRes.json().catch(() => []);

      const data: Record<string, DayEvents> = {};

      function ensureDay(dateKey: string) {
        if (!data[dateKey]) data[dateKey] = { events: [] };
      }

      if (Array.isArray(shifts)) {
        for (const shift of shifts) {
          const dateKey = shift.date?.split("T")[0] ?? format(new Date(shift.startTime), "yyyy-MM-dd");
          ensureDay(dateKey);
          const name = shift.primaryCaregiver?.name?.split(" ")[0] ?? "Open";
          const time = format(new Date(shift.startTime), "ha").toLowerCase();
          data[dateKey].events.push({
            id: shift.id,
            label: name,
            time,
            type: "shift",
          });
        }
      }

      if (Array.isArray(appointments)) {
        for (const appt of appointments) {
          const dateKey = format(new Date(appt.dateTime), "yyyy-MM-dd");
          ensureDay(dateKey);
          const time = format(new Date(appt.dateTime), "ha").toLowerCase();
          data[dateKey].events.push({
            id: appt.id,
            label: appt.title,
            time,
            type: "appointment",
          });
        }
      }

      // Sort events by time within each day
      for (const day of Object.values(data)) {
        day.events.sort((a, b) => a.time.localeCompare(b.time));
      }

      setDayEvents(data);
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

      {/* Day headers — short on mobile, full on md+ */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((header, i) => (
          <div
            key={i}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            <span className="hidden md:inline">{header}</span>
            <span className="md:hidden">{DAY_HEADERS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid — larger cells like a paper planner */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const dayData = dayEvents[dateKey];
          const events = dayData?.events ?? [];
          const maxDesktop = 5;

          return (
            <div
              key={dateKey}
              className={`
                relative flex flex-col text-left group
                min-h-[56px] md:min-h-[90px] xl:min-h-[105px] p-1 md:p-1.5 transition-colors
                ${inMonth ? "bg-card" : "bg-muted/20 text-muted-foreground/40"}
                ${today ? "ring-2 ring-inset ring-primary" : ""}
              `}
            >
              {/* Day header row: number + add button */}
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => handleDayClick(day)}
                  className={`text-xs md:text-sm font-medium hover:underline ${
                    today
                      ? "bg-primary text-primary-foreground w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[11px] md:text-sm"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </button>
                {inMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddDate(dateKey);
                    }}
                    className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-opacity"
                    aria-label={`Add event on ${format(day, "MMMM d")}`}
                  >
                    <Plus className="h-3 w-3 text-primary" />
                  </button>
                )}
              </div>

              {/* Events list — clickable to day detail */}
              <button
                onClick={() => handleDayClick(day)}
                className="flex flex-col gap-0.5 flex-1 overflow-hidden text-left w-full"
              >
                {/* Mobile: compact view */}
                <div className="md:hidden">
                  {events.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[9px] leading-tight px-1 py-px rounded truncate ${EVENT_COLORS[ev.type]}`}
                    >
                      {ev.label}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <span className="text-[9px] text-muted-foreground px-1">
                      +{events.length - 2}
                    </span>
                  )}
                </div>

                {/* Desktop: full event labels */}
                <div className="hidden md:flex flex-col gap-0.5">
                  {events.slice(0, maxDesktop).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[10px] xl:text-xs leading-tight px-1.5 py-0.5 rounded truncate ${EVENT_COLORS[ev.type]}`}
                    >
                      <span className="font-semibold">{ev.time}</span>{" "}
                      {ev.label}
                    </div>
                  ))}
                  {events.length > maxDesktop && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{events.length - maxDesktop} more
                    </span>
                  )}
                </div>
              </button>
            </div>
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-coral" />
          Meals
        </div>
      </div>

      {/* Add event sheet */}
      <AddEventSheet
        open={!!addDate}
        onOpenChange={(open) => !open && setAddDate(null)}
        date={addDate ?? format(new Date(), "yyyy-MM-dd")}
        careCircleId={careCircleId}
        onCreated={loadMonthData}
      />
    </div>
  );
}
