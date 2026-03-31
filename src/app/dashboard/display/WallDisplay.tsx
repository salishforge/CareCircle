"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Clock,
  Utensils,
  Calendar,
  Bell,
  Phone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ShiftInfo {
  caregiverName: string;
  caregiverImage: string | null;
  caregiverPhone: string | null;
  shiftEnd: string;
  checkedIn: boolean;
}

interface UpcomingShift {
  id: string;
  caregiverName: string;
  caregiverImage: string | null;
  startTime: string;
  endTime: string;
  date: string;
  status: string;
}

interface MealInfo {
  id: string;
  mealType: string;
  title: string;
  providerName: string | null;
  status: string;
}

interface RequestInfo {
  id: string;
  type: string;
  description: string;
  priority: string;
  createdAt: string;
}

interface DisplayData {
  timestamp: string;
  currentShift: ShiftInfo | null;
  upcomingShifts: UpcomingShift[];
  todayMeals: MealInfo[];
  openRequests: RequestInfo[];
  lastCheckIn: { caregiverName: string; timestamp: string } | null;
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

interface WallDisplayProps {
  circleId: string;
  token: string;
  patientName: string;
}

export function WallDisplay({ circleId, token, patientName }: WallDisplayProps) {
  const [data, setData] = useState<DisplayData | null>(null);
  const [time, setTime] = useState(new Date());
  const [isNightMode, setIsNightMode] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  // Clock tick
  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Night mode: dim between 9pm and 7am
  useEffect(() => {
    const hour = time.getHours();
    setIsNightMode(hour >= 21 || hour < 7);
  }, [time]);

  // SSE connection
  useEffect(() => {
    const params = new URLSearchParams({ circleId, token });
    const es = new EventSource(`/api/sse?${params}`);

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (!payload.error) setData(payload);
      } catch {
        // ignore malformed events
      }
    };

    return () => es.close();
  }, [circleId, token]);

  const handleNeedHelp = useCallback(async () => {
    setRequestLoading(true);
    await fetch("/api/display/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId, token }),
    });
    setRequestLoading(false);
    setRequestSent(true);
    setTimeout(() => setRequestSent(false), 10_000);
  }, [circleId, token]);

  const hour = time.getHours();
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  const baseClass = isNightMode
    ? "min-h-screen bg-[#0d0b09] text-[#c8b89a] transition-colors duration-2000"
    : "min-h-screen bg-background text-foreground transition-colors duration-2000";

  return (
    <div className={baseClass}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border/30">
        <div>
          <h1 className={`text-2xl font-bold ${isNightMode ? "text-[#c8b89a]" : "text-primary"}`}>
            CareCircle
          </h1>
          <p className="text-sm opacity-60">{patientName}&apos;s Care Dashboard</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">{timeStr}</p>
          <p className="text-sm opacity-60">{dateStr}</p>
        </div>
      </div>

      {/* 4-quadrant grid */}
      <div className="grid grid-cols-2 grid-rows-2 h-[calc(100vh-5rem)] gap-0">
        {/* Top-left: Who's Here */}
        <div className="border-r border-b border-border/30 p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <User className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Who&apos;s Here</span>
          </div>

          {data?.currentShift ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-6 mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={data.currentShift.caregiverImage ?? undefined} />
                  <AvatarFallback className="text-2xl bg-primary/20">
                    {data.currentShift.caregiverName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-3xl font-bold">{data.currentShift.caregiverName}</p>
                  <div className="flex items-center gap-2 mt-1 opacity-70">
                    <Clock className="h-4 w-4" />
                    <span className="text-lg">Until {data.currentShift.shiftEnd}</span>
                  </div>
                  {data.currentShift.checkedIn && (
                    <div className="flex items-center gap-1 mt-1 text-sage">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Checked in</span>
                    </div>
                  )}
                </div>
              </div>
              {data.currentShift.caregiverPhone && (
                <a
                  href={`tel:${data.currentShift.caregiverPhone}`}
                  className="flex items-center gap-2 text-lg opacity-70 hover:opacity-100 mt-2"
                >
                  <Phone className="h-5 w-5" />
                  {data.currentShift.caregiverPhone}
                </a>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center opacity-40">
                <User className="h-16 w-16 mx-auto mb-4" />
                <p className="text-xl">No one checked in</p>
              </div>
            </div>
          )}

          {/* Need Help button */}
          <div className="mt-6">
            {requestSent ? (
              <div className="w-full py-4 rounded-xl bg-sage/20 border border-sage/30 flex items-center justify-center gap-2 text-sage text-lg">
                <CheckCircle className="h-6 w-6" />
                Help is on the way!
              </div>
            ) : (
              <button
                onClick={handleNeedHelp}
                disabled={requestLoading}
                className="w-full py-5 rounded-xl bg-coral text-white text-2xl font-bold hover:bg-coral/90 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                {requestLoading ? "Sending..." : "I Need Help"}
              </button>
            )}
          </div>
        </div>

        {/* Top-right: Today's Schedule */}
        <div className="border-b border-border/30 p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Today&apos;s Schedule</span>
          </div>

          {data?.upcomingShifts && data.upcomingShifts.length > 0 ? (
            <div className="space-y-4 flex-1">
              {data.upcomingShifts.map((shift) => (
                <div key={shift.id} className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={shift.caregiverImage ?? undefined} />
                    <AvatarFallback className="bg-primary/20">
                      {shift.caregiverName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-semibold">{shift.caregiverName}</p>
                    <p className="opacity-60">
                      {shift.startTime} – {shift.endTime}
                      {shift.date !== new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) && (
                        <span className="ml-1 text-sm">({shift.date})</span>
                      )}
                    </p>
                  </div>
                  {shift.status === "OPEN" && (
                    <Badge variant="outline" className="ml-auto opacity-60">Open</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-40">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg">No upcoming shifts scheduled</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom-left: Today's Meals */}
        <div className="border-r border-border/30 p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <Utensils className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Today&apos;s Meals</span>
          </div>

          {data?.todayMeals && data.todayMeals.length > 0 ? (
            <div className="space-y-4 flex-1">
              {data.todayMeals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-50 uppercase tracking-wide">
                      {MEAL_LABELS[meal.mealType] ?? meal.mealType}
                    </p>
                    <p className="text-xl font-medium">{meal.title}</p>
                    {meal.providerName && (
                      <p className="text-sm opacity-60">by {meal.providerName}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      meal.status === "DELIVERED"
                        ? "border-sage/40 text-sage"
                        : meal.status === "CONFIRMED"
                        ? "border-amber/40 text-amber-dark"
                        : "opacity-40"
                    }
                  >
                    {meal.status.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-40">
              <div className="text-center">
                <Utensils className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg">No meals planned today</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom-right: Requests & Notes */}
        <div className="p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <Bell className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Requests</span>
          </div>

          {data?.openRequests && data.openRequests.length > 0 ? (
            <div className="space-y-4 flex-1">
              {data.openRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg bg-card border border-border/50">
                  <div className="flex items-start gap-2">
                    {req.priority === "URGENT" && (
                      <AlertCircle className="h-5 w-5 text-coral flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{req.description}</p>
                      <p className="text-sm opacity-50 mt-0.5">{req.createdAt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-40">
              <div className="text-center">
                <Bell className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg">No open requests</p>
              </div>
            </div>
          )}

          {data?.lastCheckIn && (
            <div className="mt-auto pt-4 border-t border-border/20 opacity-50 text-sm">
              Last check-in: {data.lastCheckIn.caregiverName} at {data.lastCheckIn.timestamp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
