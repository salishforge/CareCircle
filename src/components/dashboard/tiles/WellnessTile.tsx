"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import Link from "next/link";

const MOOD_EMOJIS = ["", "\u{1F61E}", "\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}"];
const MOOD_LABELS = ["", "Very low", "Low", "Okay", "Good", "Great"];

interface MoodEntry {
  mood: number;
  energyLevel: number | null;
  painLevel: number | null;
  sleepQuality: number | null;
  date: string;
}

export function WellnessTile() {
  const [latest, setLatest] = useState<MoodEntry | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    fetch("/api/wellness?days=7")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEntries(data);
          setLatest(data[data.length - 1]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          How am I feeling?
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {latest ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{MOOD_EMOJIS[latest.mood]}</span>
              <div>
                <p className="font-semibold">{MOOD_LABELS[latest.mood]}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  {latest.energyLevel && <span>Energy: {latest.energyLevel}/5</span>}
                  {latest.painLevel !== null && <span>Pain: {latest.painLevel}/10</span>}
                  {latest.sleepQuality && <span>Sleep: {latest.sleepQuality}/5</span>}
                </div>
              </div>
            </div>

            {/* Mini sparkline */}
            {entries.length > 1 && (
              <div className="flex items-end gap-1 h-8 mb-2">
                {entries.map((e, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 rounded-t transition-all"
                    style={{ height: `${(e.mood / 5) * 100}%` }}
                  />
                ))}
              </div>
            )}

            <Link href="/wellness" className="block text-xs text-primary hover:underline">
              Update or view journal →
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">No entries yet today</p>
            <Link href="/wellness" className="block text-xs text-primary hover:underline mt-2">
              Log how you&apos;re feeling →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
