"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ClipboardList } from "lucide-react";

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😊"];

interface HandoffNotesProps {
  shiftId: string;
  previousNotes?: string | null;
}

export function HandoffNotes({ shiftId, previousNotes }: HandoffNotesProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [mealsConsumed, setMealsConsumed] = useState("");
  const [medsGiven, setMedsGiven] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/shifts/${shiftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handoffMood: mood,
        handoffNotes: notes || undefined,
        handoffMealsConsumed: mealsConsumed || undefined,
        handoffMedsGiven: medsGiven || undefined,
        complete: true,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save. Please try again.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" className="w-full gap-2" />
        }
      >
        <ClipboardList className="h-4 w-4" />
        End shift &amp; leave handoff notes
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Handoff Notes</SheetTitle>
        </SheetHeader>

        {previousNotes && (
          <div className="mb-4 p-3 rounded-lg bg-muted text-sm">
            <p className="font-medium mb-1 text-xs text-muted-foreground uppercase tracking-wide">
              Notes from last caregiver
            </p>
            <p>{previousNotes}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mood */}
          <div className="space-y-2">
            <Label>How is the patient&apos;s mood today?</Label>
            <div className="flex gap-3">
              {MOOD_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMood(i + 1)}
                  className={`text-2xl h-12 w-12 rounded-lg border-2 transition-colors ${
                    mood === i + 1
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background"
                  }`}
                  aria-label={`Mood ${i + 1}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Meals consumed */}
          <div className="space-y-2">
            <Label htmlFor="meals">Meals &amp; fluids consumed</Label>
            <Textarea
              id="meals"
              placeholder="e.g. Half a bowl of soup, 2 cups water, banana smoothie..."
              value={mealsConsumed}
              onChange={(e) => setMealsConsumed(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Meds given */}
          <div className="space-y-2">
            <Label htmlFor="meds">Medications given</Label>
            <Textarea
              id="meds"
              placeholder="e.g. 9am — metformin, 12pm — ondansetron..."
              value={medsGiven}
              onChange={(e) => setMedsGiven(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Notes for next person */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for the next caregiver</Label>
            <Textarea
              id="notes"
              placeholder="Anything the next person should know..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Complete shift & save notes"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
