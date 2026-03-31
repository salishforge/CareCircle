"use client";

import { WeekView } from "@/components/calendar/WeekView";

export default function CalendarPage() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Care Calendar</h2>
        <p className="text-muted-foreground text-sm mt-1">
          24/7 care coverage at a glance
        </p>
      </div>

      <WeekView
        shifts={[]}
        coveragePercent={0}
        openSlots={0}
        onWeekChange={() => {}}
        onSignUp={() => {}}
      />
    </div>
  );
}
