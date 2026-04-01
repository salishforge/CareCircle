"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpDown, Check, X, Loader2, Inbox } from "lucide-react";
import { format } from "date-fns";

interface SwapRequest {
  id: string;
  reason: string | null;
  status: string;
  createdAt: string;
  requester: { id: string; name: string | null; image: string | null };
  originalShift: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber/20 text-amber-dark",
  APPROVED: "bg-green-100 text-green-700",
  DENIED: "bg-red-100 text-red-700",
};

export default function SwapsPage() {
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) setCareCircleId(data[0].careCircleId);
      })
      .catch(() => {});
  }, []);

  const loadSwaps = useCallback(async () => {
    if (!careCircleId) return;
    try {
      const res = await fetch(`/api/shifts/swap/${careCircleId}?careCircleId=${careCircleId}`);
      const data = await res.json();
      if (Array.isArray(data)) setSwaps(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [careCircleId]);

  useEffect(() => {
    loadSwaps();
  }, [loadSwaps]);

  async function handleDecision(swapId: string, status: "APPROVED" | "DENIED") {
    await fetch(`/api/shifts/swap/${swapId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadSwaps();
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold">Shift Swaps</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage shift swap requests
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : swaps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowUpDown className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No swap requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {swaps.map((swap) => {
            const initials = swap.requester.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "?";

            return (
              <Card key={swap.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={swap.requester.image ?? undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {swap.requester.name ?? "Caregiver"}
                        </span>
                        <Badge className={`text-[10px] ${statusColors[swap.status] ?? ""}`}>
                          {swap.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Shift: {format(new Date(swap.originalShift.date), "MMM d")} &middot;{" "}
                        {format(new Date(swap.originalShift.startTime), "h:mm a")} -{" "}
                        {format(new Date(swap.originalShift.endTime), "h:mm a")}
                      </p>
                      {swap.reason && (
                        <p className="text-xs mt-1">
                          Reason: {swap.reason}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(swap.createdAt), "MMM d, h:mm a")}
                      </p>

                      {swap.status === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-red-600"
                            onClick={() => handleDecision(swap.id, "DENIED")}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleDecision(swap.id, "APPROVED")}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
