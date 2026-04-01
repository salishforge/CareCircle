"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MedCard } from "@/components/medications/MedCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Pill, Plus, Loader2 } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  timing: string | null;
  foodInteractions: string[];
  notes: string | null;
}

interface MedLog {
  id: string;
  medicationName: string;
  takenAt: string;
  skipped: boolean;
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  // New med form
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [timing, setTiming] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/medications");
      const data = await res.json();
      setMedications(data.medications ?? []);
      setTodayLogs(data.todayLogs ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dosage: dosage || undefined,
          frequency: frequency || undefined,
          timing: timing || undefined,
        }),
      });
      if (res.ok) {
        setName("");
        setDosage("");
        setFrequency("");
        setTiming("");
        setSheetOpen(false);
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLog(med: Medication, skipped: boolean) {
    await fetch(`/api/medications/${med.id}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicationName: med.name, skipped }),
    });
    await loadData();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medications</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track doses and medication schedule
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4" />
              Add
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Add Medication</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleAdd} className="space-y-3 mt-4">
              <div>
                <Label htmlFor="med-name">Medication name <span className="text-destructive">*</span></Label>
                <Input
                  id="med-name"
                  placeholder="e.g., Lisinopril"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="med-dosage">Dosage</Label>
                <Input
                  id="med-dosage"
                  placeholder="e.g., 500mg, 1 tablet"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="med-freq">Frequency</Label>
                <Input
                  id="med-freq"
                  placeholder="e.g., Twice daily, Every 12 hours"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="med-timing">Timing</Label>
                <Input
                  id="med-timing"
                  placeholder="e.g., With food, 30 min before meals"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Medication"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Pill className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm font-medium">No medications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Track your medications and log daily doses
            </p>
            <Button size="sm" className="mt-4" onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {medications.map((med) => {
            const logged = todayLogs.some(
              (l) => l.medicationName === med.name && !l.skipped
            );
            const skippedToday = todayLogs.some(
              (l) => l.medicationName === med.name && l.skipped
            );
            return (
              <MedCard
                key={med.id}
                medication={med}
                loggedToday={logged}
                skippedToday={skippedToday}
                onLogTaken={() => handleLog(med, false)}
                onLogSkipped={() => handleLog(med, true)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
