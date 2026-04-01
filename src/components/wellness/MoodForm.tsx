"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😊"];
const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
const SYMPTOM_OPTIONS = [
  "Nausea", "Fatigue", "Pain", "Dizziness", "Headache",
  "Loss of appetite", "Difficulty sleeping", "Anxiety",
];

interface MoodFormProps {
  initialValues?: {
    mood: number;
    energyLevel: number | null;
    painLevel: number | null;
    appetite: number | null;
    sleepQuality: number | null;
    symptoms: string[];
    notes: string | null;
  };
  onSave: (data: {
    mood: number;
    energyLevel?: number;
    painLevel?: number;
    appetite?: number;
    sleepQuality?: number;
    symptoms?: string[];
    notes?: string;
  }) => Promise<void>;
}

function SliderRow({
  label,
  value,
  onChange,
  max = 5,
  min = 1,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value ?? "-"}/{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? min}
        onChange={(e) => onChange(parseInt(e.target.value))}
        aria-label={`${label} (${min} to ${max})`}
        aria-valuetext={value !== null ? `${value} out of ${max}` : "Not set"}
        className="w-full accent-primary h-2"
      />
    </div>
  );
}

export function MoodForm({ initialValues, onSave }: MoodFormProps) {
  const [mood, setMood] = useState(initialValues?.mood ?? 3);
  const [energy, setEnergy] = useState<number | null>(initialValues?.energyLevel ?? null);
  const [pain, setPain] = useState<number | null>(initialValues?.painLevel ?? null);
  const [appetite, setAppetite] = useState<number | null>(initialValues?.appetite ?? null);
  const [sleep, setSleep] = useState<number | null>(initialValues?.sleepQuality ?? null);
  const [symptoms, setSymptoms] = useState<string[]>(initialValues?.symptoms ?? []);
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [saving, setSaving] = useState(false);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        mood,
        ...(energy !== null && { energyLevel: energy }),
        ...(pain !== null && { painLevel: pain }),
        ...(appetite !== null && { appetite }),
        ...(sleep !== null && { sleepQuality: sleep }),
        symptoms,
        ...(notes && { notes }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mood emoji picker */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Overall mood</p>
        <div className="flex justify-between">
          {MOOD_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMood(i + 1)}
              className={`text-3xl p-2 rounded-xl transition-all ${
                mood === i + 1
                  ? "bg-primary/10 scale-110 ring-2 ring-primary"
                  : "hover:bg-muted"
              }`}
            >
              {emoji}
              <span className="sr-only">{MOOD_LABELS[i]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <SliderRow label="Energy" value={energy} onChange={setEnergy} />
        <SliderRow label="Pain" value={pain} onChange={setPain} max={10} min={0} />
        <SliderRow label="Appetite" value={appetite} onChange={setAppetite} />
        <SliderRow label="Sleep quality" value={sleep} onChange={setSleep} />
      </div>

      {/* Symptoms */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Symptoms</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                symptoms.includes(s)
                  ? "bg-coral/10 border-coral text-coral-dark"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <Textarea
        placeholder="Any additional notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="text-sm"
      />

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : initialValues ? (
          "Update Entry"
        ) : (
          "Save Entry"
        )}
      </Button>
    </form>
  );
}
