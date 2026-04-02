"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  isSameDay,
} from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ShiftInfo {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  primaryCaregiver: { name: string | null; image: string | null } | null;
}

export function WeekStrip({ careCircleId }: { careCircleId: string | null }) {
  const router = useRouter();
  const [shifts, setShifts] = useState<ShiftInfo[]>([]);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!careCircleId) return;
    fetch(`/api/shifts?careCircleId=${careCircleId}&weekOf=${format(weekStart, "yyyy-MM-dd")}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setShifts(data); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careCircleId]);

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const today = isToday(day);
        const dayShifts = shifts.filter((s) => {
          const sd = s.startTime ? format(new Date(s.startTime), "yyyy-MM-dd") : "";
          return sd === dateKey;
        });

        return (
          <button
            key={dateKey}
            onClick={() => router.push(`/calendar/${dateKey}`)}
            className={`flex flex-col items-center rounded-xl p-2 md:p-3 transition-colors min-h-[70px] md:min-h-[90px] ${
              today
                ? "bg-primary/10 ring-2 ring-primary"
                : "bg-card border border-border hover:bg-muted/50"
            }`}
          >
            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase">
              {format(day, "EEE")}
            </span>
            <span className={`text-lg md:text-xl font-bold ${today ? "text-primary" : ""}`}>
              {format(day, "d")}
            </span>

            {/* Shift indicators */}
            <div className="flex flex-col gap-0.5 mt-1 w-full">
              {dayShifts.slice(0, 2).map((s) => {
                const name = s.primaryCaregiver?.name?.split(" ")[0] ?? "Open";
                return (
                  <div key={s.id} className="text-[8px] md:text-[10px] text-center truncate text-muted-foreground">
                    {name}
                  </div>
                );
              })}
              {dayShifts.length > 2 && (
                <span className="text-[8px] text-muted-foreground text-center">+{dayShifts.length - 2}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
