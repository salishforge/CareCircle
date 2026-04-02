"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Loader2, ChevronRight, X } from "lucide-react";
import Link from "next/link";

const MOODS = [
  { emoji: "\u{1F61E}", label: "Very low", value: 1 },
  { emoji: "\u{1F615}", label: "Low", value: 2 },
  { emoji: "\u{1F610}", label: "Okay", value: 3 },
  { emoji: "\u{1F642}", label: "Good", value: 4 },
  { emoji: "\u{1F60A}", label: "Great", value: 5 },
];

interface MoodEntry {
  mood: number;
  energyLevel: number | null;
  painLevel: number | null;
  sleepQuality: number | null;
  date: string;
}

interface WellnessTileProps {
  userRole: string;
}

export function WellnessTile({ userRole }: WellnessTileProps) {
  const router = useRouter();
  const [latest, setLatest] = useState<MoodEntry | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isPatientOrPrimary = userRole === "PATIENT" || userRole === "PRIMARY_CAREGIVER" || userRole === "ADMIN";

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

  async function handleSubmit() {
    if (!selectedMood) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          ...(notes && { notes }),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setSelectedMood(null);
        setNotes("");
        // Reload entries
        const data = await fetch("/api/wellness?days=7").then((r) => r.json());
        if (Array.isArray(data)) {
          setEntries(data);
          setLatest(data[data.length - 1]);
        }
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            How am I feeling?
          </CardTitle>
          <Link href="/wellness" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            Details <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Patient/Primary: show emoji picker for quick entry */}
        {isPatientOrPrimary ? (
          <>
            {/* Current mood + sparkline */}
            {latest && !selectedMood && (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{MOODS[latest.mood - 1]?.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{MOODS[latest.mood - 1]?.label}</p>
                  <div className="flex gap-3 text-[11px] text-muted-foreground">
                    {latest.energyLevel && <span>Energy {latest.energyLevel}/5</span>}
                    {latest.painLevel !== null && latest.painLevel !== undefined && <span>Pain {latest.painLevel}/10</span>}
                  </div>
                </div>
                {/* Mini sparkline */}
                {entries.length > 1 && (
                  <div className="flex items-end gap-0.5 h-6 w-16">
                    {entries.slice(-7).map((e, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary/25 rounded-t"
                        style={{ height: `${(e.mood / 5) * 100}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emoji picker row */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">
                {saved ? "✓ Saved!" : selectedMood ? "Add a note (optional)" : "Tap to log how you feel:"}
              </p>
              <div className="flex justify-between">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMood(selectedMood === m.value ? null : m.value)}
                    className={`text-2xl md:text-3xl p-1.5 rounded-xl transition-all ${
                      selectedMood === m.value
                        ? "bg-primary/15 scale-110 ring-2 ring-primary"
                        : "hover:bg-muted hover:scale-105"
                    }`}
                    aria-label={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded: notes + submit */}
            {selectedMood && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Textarea
                  placeholder="How are you feeling? (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedMood(null); setNotes(""); }}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 h-10 text-base font-semibold"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        {MOODS[selectedMood - 1]?.emoji} Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Caregiver view: summary only */
          <div>
            {latest ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{MOODS[latest.mood - 1]?.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">Patient is feeling {MOODS[latest.mood - 1]?.label?.toLowerCase()}</p>
                    <div className="flex gap-3 text-[11px] text-muted-foreground">
                      {latest.energyLevel && <span>Energy {latest.energyLevel}/5</span>}
                      {latest.painLevel !== null && latest.painLevel !== undefined && <span>Pain {latest.painLevel}/10</span>}
                      {latest.sleepQuality && <span>Sleep {latest.sleepQuality}/5</span>}
                    </div>
                  </div>
                </div>
                {/* 7-day trend bar */}
                {entries.length > 1 && (
                  <div className="flex items-end gap-1 h-8">
                    {entries.slice(-7).map((e, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full bg-primary/20 rounded-t"
                          style={{ height: `${(e.mood / 5) * 32}px` }}
                        />
                        <span className="text-[8px] text-muted-foreground">
                          {MOODS[e.mood - 1]?.emoji}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No wellness data recorded yet</p>
            )}
            <Link href="/wellness" className="block text-xs text-primary hover:underline mt-3">
              View full wellness journal →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
