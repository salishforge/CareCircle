"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";

interface CheckInButtonProps {
  shiftId: string;
  shiftEnd: string;
  alreadyCheckedIn: boolean;
}

export function CheckInButton({ shiftId, shiftEnd, alreadyCheckedIn }: CheckInButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(alreadyCheckedIn);
  const [error, setError] = useState("");

  async function handleCheckIn() {
    setLoading(true);
    setError("");

    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      }
    } catch {
      // GPS is optional — proceed without it
    }

    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId, latitude, longitude }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Check-in failed. Please try again.");
      return;
    }

    setCheckedIn(true);
    router.refresh();
  }

  if (checkedIn) {
    return (
      <Card className="border-sage/30 bg-sage/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-sage flex-shrink-0" />
            <div>
              <p className="font-semibold text-sage-dark">You&apos;re checked in</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Shift ends at {shiftEnd}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full h-20 text-lg font-bold bg-sage hover:bg-sage/90 text-white rounded-xl"
        size="lg"
      >
        {loading ? "Checking in..." : "I'm Here ✓"}
      </Button>
      {error && (
        <p className="text-sm text-coral text-center" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Tap when you arrive — your shift ends at {shiftEnd}
      </p>
    </div>
  );
}
