"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CalendarDays, Plus, Loader2 } from "lucide-react";

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateTime: string;
  duration: number;
  type: string;
  transportationNeeded: boolean;
  notes: string | null;
  transportationVolunteer: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState("MEDICAL");
  const [location, setLocation] = useState("");
  const [transportNeeded, setTransportNeeded] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) {
          setCareCircleId(data[0].careCircleId);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!careCircleId) return;
    try {
      const res = await fetch(`/api/appointments?careCircleId=${careCircleId}`);
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [careCircleId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function handleVolunteer(appointmentId: string) {
    await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transportationVolunteerId: "SELF" }),
    });
    await loadAppointments();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dateTime || !careCircleId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careCircleId,
          title: title.trim(),
          dateTime,
          duration: parseInt(duration),
          type,
          location: location || undefined,
          transportationNeeded: transportNeeded,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        setTitle("");
        setDateTime("");
        setDuration("60");
        setType("MEDICAL");
        setLocation("");
        setTransportNeeded(false);
        setNotes("");
        setSheetOpen(false);
        await loadAppointments();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Upcoming medical and care appointments
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" />
              New
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>New Appointment</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-4">
              <Input
                placeholder="Appointment title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Duration (min)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={15}
                  step={15}
                />
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDICAL">Medical</SelectItem>
                    <SelectItem value="THERAPY">Therapy</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm">Transportation needed?</span>
                <Switch checked={transportNeeded} onCheckedChange={setTransportNeeded} />
              </div>
              <Textarea
                placeholder="Notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Appointment"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No upcoming appointments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onVolunteer={() => handleVolunteer(appt.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
