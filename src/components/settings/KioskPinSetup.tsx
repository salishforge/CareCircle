"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Loader2, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function KioskPinSetup() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs don't match");
      return;
    }
    if (!password) {
      setError("Enter your current password to verify");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, currentPassword: password }),
      });

      if (res.ok) {
        toast.success("Kiosk PIN set successfully");
        setPin("");
        setConfirmPin("");
        setPassword("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to set PIN");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePin() {
    const res = await fetch("/api/settings/pin", { method: "DELETE" });
    if (res.ok) {
      toast.success("Kiosk PIN removed");
    } else {
      toast.error("Failed to remove PIN");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Fingerprint className="h-4 w-4" />
          Kiosk PIN
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Set a 4-digit PIN to sign in on the touchscreen kiosk without typing.
        </p>
        <form onSubmit={handleSetPin} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="kiosk-pin" className="text-xs">New PIN</Label>
              <Input
                id="kiosk-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="mt-1 text-center text-lg tracking-widest"
              />
            </div>
            <div>
              <Label htmlFor="kiosk-pin-confirm" className="text-xs">Confirm PIN</Label>
              <Input
                id="kiosk-pin-confirm"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="mt-1 text-center text-lg tracking-widest"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="kiosk-password" className="text-xs">Current Password</Label>
            <Input
              id="kiosk-password"
              type="password"
              placeholder="Verify your identity"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Check className="h-4 w-4 mr-1" /> Set PIN</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePin}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
