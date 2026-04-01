"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Smartphone, Moon } from "lucide-react";
import { toast } from "sonner";

interface Prefs {
  email: boolean;
  sms: boolean;
  push: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Prefs>({
    email: true,
    sms: true,
    push: true,
    quietHoursStart: null,
    quietHoursEnd: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setPrefs((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(update: Partial<Prefs>) {
    const newPrefs = { ...prefs, ...update };
    setPrefs(newPrefs);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error();
      toast.success("Preferences updated");
    } catch {
      toast.error("Failed to save preferences");
      setPrefs(prefs); // revert
    }
  }

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notification Channels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channel toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-toggle">Email notifications</Label>
            </div>
            <Switch
              id="email-toggle"
              checked={prefs.email}
              onCheckedChange={(v) => save({ email: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sms-toggle">SMS notifications</Label>
            </div>
            <Switch
              id="sms-toggle"
              checked={prefs.sms}
              onCheckedChange={(v) => save({ sms: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="push-toggle">Push notifications</Label>
            </div>
            <Switch
              id="push-toggle"
              checked={prefs.push}
              onCheckedChange={(v) => save({ push: v })}
            />
          </div>
        </div>

        {/* Quiet hours */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Quiet Hours</Label>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Silence non-emergency notifications during these hours
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">
                Start
              </Label>
              <Input
                id="quiet-start"
                type="time"
                value={prefs.quietHoursStart ?? ""}
                onChange={(e) =>
                  save({ quietHoursStart: e.target.value || null })
                }
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">
                End
              </Label>
              <Input
                id="quiet-end"
                type="time"
                value={prefs.quietHoursEnd ?? ""}
                onChange={(e) =>
                  save({ quietHoursEnd: e.target.value || null })
                }
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
