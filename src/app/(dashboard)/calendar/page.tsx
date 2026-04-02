"use client";

import { useState, useEffect } from "react";
import { MonthGrid } from "@/components/calendar/MonthGrid";

export default function CalendarPage() {
  const [careCircleId, setCareCircleId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) setCareCircleId(data[0].careCircleId);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Care Calendar</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Tap a day to see shifts, meals, and appointments
        </p>
      </div>

      <MonthGrid careCircleId={careCircleId} />
    </div>
  );
}
