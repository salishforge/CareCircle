"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface PatientRequest {
  id: string;
  type: string;
  description: string;
  priority: string;
  status: string;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  NORMAL: "",
  LOW: "bg-muted text-muted-foreground",
};

export function RequestsWidget({ careCircleId }: { careCircleId: string | null }) {
  const [requests, setRequests] = useState<PatientRequest[]>([]);

  useEffect(() => {
    if (!careCircleId) return;
    fetch(`/api/requests?careCircleId=${careCircleId}&status=OPEN`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data.slice(0, 5));
      })
      .catch(() => {});
  }, [careCircleId]);

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No open requests</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <div key={req.id} className="flex items-start gap-2 text-sm">
          <Badge variant="secondary" className={`text-[10px] flex-shrink-0 ${priorityColors[req.priority] ?? ""}`}>
            {req.type}
          </Badge>
          <span className="flex-1 line-clamp-1">{req.description}</span>
        </div>
      ))}
    </div>
  );
}
