"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoodForm } from "@/components/wellness/MoodForm";
import { WellnessTrend } from "@/components/wellness/WellnessTrend";
import { Heart, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface MoodEntry {
  id: string;
  date: string;
  mood: number;
  energyLevel: number | null;
  painLevel: number | null;
  appetite: number | null;
  sleepQuality: number | null;
  symptoms: string[];
  notes: string | null;
}

export default function WellnessPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/wellness?days=14");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEntries(data);
        const today = format(new Date(), "yyyy-MM-dd");
        const found = data.find(
          (e: MoodEntry) => format(new Date(e.date), "yyyy-MM-dd") === today
        );
        setTodayEntry(found ?? null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleSave(data: {
    mood: number;
    energyLevel?: number;
    painLevel?: number;
    appetite?: number;
    sleepQuality?: number;
    symptoms?: string[];
    notes?: string;
  }) {
    const res = await fetch("/api/wellness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await loadEntries();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold">Wellness Journal</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Track how you&apos;re feeling each day
        </p>
      </div>

      {/* Trend chart */}
      {entries.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              14-Day Mood Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WellnessTrend entries={entries} />
          </CardContent>
        </Card>
      )}

      {/* Today's entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-coral" />
            {todayEntry ? "Update Today's Entry" : "How are you feeling?"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MoodForm
            initialValues={todayEntry ?? undefined}
            onSave={handleSave}
          />
        </CardContent>
      </Card>
    </div>
  );
}
