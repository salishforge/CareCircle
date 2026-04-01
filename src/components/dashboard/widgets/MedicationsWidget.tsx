"use client";

import { useState, useEffect } from "react";
import { Check, Pill } from "lucide-react";

interface Med {
  id: string;
  name: string;
  dosage: string | null;
}

interface MedLog {
  medicationName: string;
  skipped: boolean;
}

export function MedicationsWidget() {
  const [meds, setMeds] = useState<Med[]>([]);
  const [logs, setLogs] = useState<MedLog[]>([]);

  useEffect(() => {
    fetch("/api/medications")
      .then((r) => r.json())
      .then((data) => {
        if (data?.medications) setMeds(data.medications);
        if (data?.todayLogs) setLogs(data.todayLogs);
      })
      .catch(() => {});
  }, []);

  if (meds.length === 0) {
    return <p className="text-sm text-muted-foreground">No medications tracked</p>;
  }

  return (
    <div className="space-y-2">
      {meds.map((med) => {
        const taken = logs.some((l) => l.medicationName === med.name && !l.skipped);
        return (
          <div key={med.id} className="flex items-center gap-2 text-sm">
            <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              taken ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
            }`}>
              {taken ? <Check className="h-3 w-3" /> : <Pill className="h-3 w-3" />}
            </div>
            <span className={`flex-1 truncate ${taken ? "line-through text-muted-foreground" : ""}`}>
              {med.name}
            </span>
            {med.dosage && (
              <span className="text-xs text-muted-foreground">{med.dosage}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
