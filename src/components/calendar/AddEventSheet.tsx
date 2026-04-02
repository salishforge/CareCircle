"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Clock, UtensilsCrossed, CalendarDays } from "lucide-react";
import { format } from "date-fns";

type EventType = "shift" | "appointment" | "meal";

interface AddEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string; // yyyy-MM-dd
  careCircleId: string | null;
  onCreated: () => void;
}

const EVENT_TYPES: { value: EventType; label: string; icon: typeof Clock }[] = [
  { value: "shift", label: "Care Shift", icon: Clock },
  { value: "appointment", label: "Appointment", icon: CalendarDays },
  { value: "meal", label: "Meal", icon: UtensilsCrossed },
];

export function AddEventSheet({
  open,
  onOpenChange,
  date,
  careCircleId,
  onCreated,
}: AddEventSheetProps) {
  const [eventType, setEventType] = useState<EventType>("shift");
  const [saving, setSaving] = useState(false);

  // Shift fields
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("16:00");
  const [shiftNotes, setShiftNotes] = useState("");

  // Appointment fields
  const [apptTitle, setApptTitle] = useState("");
  const [apptTime, setApptTime] = useState("10:00");
  const [apptDuration, setApptDuration] = useState("60");
  const [apptType, setApptType] = useState("MEDICAL");
  const [apptLocation, setApptLocation] = useState("");
  const [apptTransport, setApptTransport] = useState(false);
  const [apptNotes, setApptNotes] = useState("");

  // Meal fields
  const [mealType, setMealType] = useState("LUNCH");
  const [mealTitle, setMealTitle] = useState("");
  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealNotes, setMealNotes] = useState("");

  function resetForm() {
    setShiftStart("08:00");
    setShiftEnd("16:00");
    setShiftNotes("");
    setApptTitle("");
    setApptTime("10:00");
    setApptDuration("60");
    setApptType("MEDICAL");
    setApptLocation("");
    setApptTransport(false);
    setApptNotes("");
    setMealType("LUNCH");
    setMealTitle("");
    setMealCalories("");
    setMealProtein("");
    setMealNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!careCircleId) return;
    setSaving(true);

    try {
      let res: Response;

      if (eventType === "shift") {
        res = await fetch("/api/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            careCircleId,
            date,
            startTime: `${date}T${shiftStart}:00`,
            endTime: `${date}T${shiftEnd}:00`,
            notes: shiftNotes || undefined,
          }),
        });
      } else if (eventType === "appointment") {
        res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            careCircleId,
            title: apptTitle,
            dateTime: `${date}T${apptTime}:00`,
            duration: parseInt(apptDuration),
            type: apptType,
            location: apptLocation || undefined,
            transportationNeeded: apptTransport,
            notes: apptNotes || undefined,
          }),
        });
      } else {
        res = await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            careCircleId,
            date,
            mealType,
            title: mealTitle,
            calories: mealCalories ? parseInt(mealCalories) : undefined,
            proteinGrams: mealProtein ? parseInt(mealProtein) : undefined,
            specialNotes: mealNotes || undefined,
          }),
        });
      }

      if (res.ok) {
        resetForm();
        onOpenChange(false);
        onCreated();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Add to {format(new Date(date + "T12:00:00"), "EEEE, MMM d")}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Event type selector */}
          <div className="flex gap-2">
            {EVENT_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setEventType(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
                  eventType === value
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Shift form */}
          {eventType === "shift" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="shift-start">Start time</Label>
                  <Input
                    id="shift-start"
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shift-end">End time</Label>
                  <Input
                    id="shift-end"
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="shift-notes">Notes</Label>
                <Textarea
                  id="shift-notes"
                  placeholder="Any notes for this shift..."
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Appointment form */}
          {eventType === "appointment" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="appt-title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="appt-title"
                  placeholder="e.g., Oncology follow-up"
                  value={apptTitle}
                  onChange={(e) => setApptTitle(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="appt-time">Time</Label>
                  <Input
                    id="appt-time"
                    type="time"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="appt-dur">Duration</Label>
                  <Input
                    id="appt-dur"
                    type="number"
                    value={apptDuration}
                    onChange={(e) => setApptDuration(e.target.value)}
                    min={15}
                    step={15}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="appt-type">Type</Label>
                  <Select value={apptType} onValueChange={(v) => v && setApptType(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEDICAL">Medical</SelectItem>
                      <SelectItem value="THERAPY">Therapy</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="appt-loc">Location</Label>
                <Input
                  id="appt-loc"
                  placeholder="e.g., Seattle Cancer Care Alliance"
                  value={apptLocation}
                  onChange={(e) => setApptLocation(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label htmlFor="appt-transport" className="text-sm cursor-pointer">
                  Transportation needed?
                </Label>
                <Switch id="appt-transport" checked={apptTransport} onCheckedChange={setApptTransport} />
              </div>
              <div>
                <Label htmlFor="appt-notes">Notes</Label>
                <Textarea
                  id="appt-notes"
                  placeholder="Additional details..."
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Meal form */}
          {eventType === "meal" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="meal-type">Meal type</Label>
                  <Select value={mealType} onValueChange={(v) => v && setMealType(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                      <SelectItem value="LUNCH">Lunch</SelectItem>
                      <SelectItem value="DINNER">Dinner</SelectItem>
                      <SelectItem value="SNACK">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="meal-title">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="meal-title"
                    placeholder="e.g., Chicken soup"
                    value={mealTitle}
                    onChange={(e) => setMealTitle(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="meal-cal">Calories</Label>
                  <Input
                    id="meal-cal"
                    type="number"
                    placeholder="e.g., 450"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="meal-protein">Protein (g)</Label>
                  <Input
                    id="meal-protein"
                    type="number"
                    placeholder="e.g., 25"
                    value={mealProtein}
                    onChange={(e) => setMealProtein(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="meal-notes">Special notes</Label>
                <Textarea
                  id="meal-notes"
                  placeholder="Dietary notes, allergies..."
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Add ${eventType === "shift" ? "Shift" : eventType === "appointment" ? "Appointment" : "Meal"}`
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
