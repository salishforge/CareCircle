"use client";

import { useState, useEffect } from "react";
import { format, isToday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  primaryCaregiver: { name: string | null; image: string | null } | null;
}

export function CalendarWidget({ careCircleId }: { careCircleId: string | null }) {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (!careCircleId) return;
    fetch(`/api/shifts?careCircleId=${careCircleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter to today and tomorrow
          const relevant = data.filter((s: Shift) => {
            const d = new Date(s.startTime);
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59);
            return d <= tomorrow;
          });
          setShifts(relevant.slice(0, 6));
        }
      })
      .catch(() => {});
  }, [careCircleId]);

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming shifts</p>;
  }

  return (
    <div className="space-y-2">
      {shifts.map((shift) => {
        const start = new Date(shift.startTime);
        const initials = shift.primaryCaregiver?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) ?? "?";
        return (
          <div key={shift.id} className="flex items-center gap-2 text-sm">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={shift.primaryCaregiver?.image ?? undefined} />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">
              {shift.primaryCaregiver?.name ?? "Open"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isToday(start) ? "" : format(start, "EEE") + " "}
              {format(start, "h:mma")}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {shift.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
