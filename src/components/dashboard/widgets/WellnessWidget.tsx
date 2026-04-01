"use client";

import { useState, useEffect } from "react";

const MOOD_EMOJIS = ["", "\u{1F61E}", "\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}"];

interface MoodEntry {
  mood: number;
  energyLevel: number | null;
  painLevel: number | null;
  date: string;
}

export function WellnessWidget() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    fetch("/api/wellness?days=7")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
      })
      .catch(() => {});
  }, []);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No wellness entries yet</p>;
  }

  const latest = entries[entries.length - 1];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{MOOD_EMOJIS[latest.mood]}</span>
        <div>
          <p className="text-sm font-medium">
            Mood: {latest.mood}/5
          </p>
          {latest.energyLevel && (
            <p className="text-xs text-muted-foreground">
              Energy: {latest.energyLevel}/5
              {latest.painLevel !== null && ` · Pain: ${latest.painLevel}/10`}
            </p>
          )}
        </div>
      </div>

      {/* Mini sparkline */}
      {entries.length > 1 && (
        <div className="flex items-end gap-1 h-8">
          {entries.map((e, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20 rounded-t"
              style={{ height: `${(e.mood / 5) * 100}%` }}
              title={`${new Date(e.date).toLocaleDateString()}: ${e.mood}/5`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
