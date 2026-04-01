"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Shield,
  Clock,
  UtensilsCrossed,
  Inbox,
  Heart,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface ReportData {
  period: { days: number; since: string };
  coverage: { percent: number; coveredHours: number; totalHours: number; openSlots: number; gaps: number };
  shifts: { total: number; completed: number; missed: number; completionRate: number };
  checkIns: { total: number; onTime: number; onTimeRate: number };
  meals: { total: number; delivered: number; deliveryRate: number };
  requests: { total: number; fulfilled: number; fulfillRate: number };
  wellness: { entries: { date: string; mood: number; energyLevel: number | null; painLevel: number | null }[]; avgMood: number | null };
  team: { memberCount: number };
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMoodChart({ entries }: { entries: { date: string; mood: number }[] }) {
  if (entries.length < 2) return <p className="text-sm text-muted-foreground">Not enough data</p>;

  const maxMood = 5;
  const h = 60;
  const w = 100;

  const points = entries.map((e, i) => ({
    x: (i / (entries.length - 1)) * w,
    y: h - (e.mood / maxMood) * h,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`-3 -3 ${w + 6} ${h + 6}`} className="w-full h-16" preserveAspectRatio="none">
        <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="hsl(var(--primary))" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{format(new Date(entries[0].date), "MMM d")}</span>
        <span>{format(new Date(entries[entries.length - 1].date), "MMM d")}</span>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((d) => {
        if (d?.[0]?.careCircleId) setCareCircleId(d[0].careCircleId);
      })
      .catch(() => {});
  }, []);

  const loadReport = useCallback(async () => {
    if (!careCircleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?careCircleId=${careCircleId}&days=${days}`);
      const d = await res.json();
      setData(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [careCircleId, days]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Care Reports</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of care activity
          </p>
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((d) => (
            <Badge
              key={d}
              variant={days === d ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setDays(d)}
            >
              {d}d
            </Badge>
          ))}
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Shield}
          label="Coverage"
          value={`${data.coverage.percent}%`}
          subtitle={`${data.coverage.openSlots} open slots`}
          color="text-sage-dark"
        />
        <StatCard
          icon={Clock}
          label="On-time check-ins"
          value={`${data.checkIns.onTimeRate}%`}
          subtitle={`${data.checkIns.onTime}/${data.checkIns.total}`}
          color="text-teal-600"
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Meals delivered"
          value={`${data.meals.deliveryRate}%`}
          subtitle={`${data.meals.delivered}/${data.meals.total}`}
          color="text-amber-600"
        />
        <StatCard
          icon={Inbox}
          label="Requests fulfilled"
          value={`${data.requests.fulfillRate}%`}
          subtitle={`${data.requests.fulfilled}/${data.requests.total}`}
          color="text-coral"
        />
      </div>

      {/* Shift stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Shift Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span>Total shifts</span>
            <span className="font-semibold">{data.shifts.total}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Completed</span>
            <span className="font-semibold text-green-600">{data.shifts.completed}</span>
          </div>
          {data.shifts.missed > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                Missed
              </span>
              <span className="font-semibold text-red-600">{data.shifts.missed}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mood Trend
            </CardTitle>
            {data.wellness.avgMood !== null && (
              <Badge variant="secondary" className="text-xs">
                Avg: {data.wellness.avgMood}/5
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MiniMoodChart entries={data.wellness.entries} />
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{data.team.memberCount}</p>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
