"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MapPin } from "lucide-react";

interface Appointment {
  id: string;
  title: string;
  dateTime: string;
  type: string;
  location: string | null;
}

const typeColors: Record<string, string> = {
  MEDICAL: "bg-coral/10 text-coral-dark",
  THERAPY: "bg-teal/10 text-teal-dark",
  OTHER: "",
};

export function AppointmentsWidget({ careCircleId }: { careCircleId: string | null }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!careCircleId) return;
    fetch(`/api/appointments?careCircleId=${careCircleId}&upcoming=true`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data.slice(0, 4));
      })
      .catch(() => {});
  }, [careCircleId]);

  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming appointments</p>;
  }

  return (
    <div className="space-y-2.5">
      {appointments.map((appt) => (
        <div key={appt.id} className="text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate flex-1">{appt.title}</span>
            <Badge variant="secondary" className={`text-[10px] ${typeColors[appt.type] ?? ""}`}>
              {appt.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{format(new Date(appt.dateTime), "EEE, MMM d · h:mm a")}</span>
            {appt.location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {appt.location}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
