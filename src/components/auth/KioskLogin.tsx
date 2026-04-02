"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Delete, Loader2 } from "lucide-react";

interface KioskUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  hasPin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PRIMARY_CAREGIVER: "Primary Caregiver",
  CAREGIVER: "Caregiver",
  MEAL_PROVIDER: "Meal Provider",
  PATIENT: "Patient",
};

interface KioskLoginProps {
  onSwitchToEmail?: () => void;
}

export function KioskLogin({ onSwitchToEmail }: KioskLoginProps) {
  const router = useRouter();
  const [users, setUsers] = useState<KioskUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<KioskUser | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    fetch("/api/kiosk/users")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, []);

  const handlePinDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError("");

    // Auto-submit on 4th digit
    if (newPin.length === 4 && selectedUser) {
      submitPin(selectedUser.id, newPin);
    }
  }, [pin, selectedUser]);

  async function submitPin(userId: string, pinValue: string) {
    setLoading(true);
    setError("");

    const result = await signIn("kiosk-pin", {
      userId,
      pin: pinValue,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Wrong PIN");
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); }, 600);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  function handleBack() {
    setSelectedUser(null);
    setPin("");
    setError("");
  }

  // Avatar selection screen
  if (!selectedUser) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold text-primary mb-2">Welcome</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Tap your name to sign in
        </p>

        {users.length === 0 && (
          <div className="mb-8">
            <p className="text-muted-foreground mb-4">No users found. Sign in with email to get started.</p>
            <button
              onClick={onSwitchToEmail}
              className="text-primary font-semibold hover:underline text-lg"
            >
              Sign in with email →
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
          {users.map((user) => {
            const initials = user.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "?";

            return (
              <button
                key={user.id}
                onClick={() => {
                  if (user.hasPin) {
                    setSelectedUser(user);
                  } else {
                    setError(`${user.name ?? "User"} hasn't set up a kiosk PIN yet`);
                  }
                }}
                className="flex flex-col items-center gap-3 p-4 md:p-6 rounded-2xl border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <Avatar className="h-20 w-20 md:h-24 md:h-24 xl:h-28 xl:w-28 ring-4 ring-transparent group-hover:ring-primary/20 transition-all">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-base md:text-lg">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </p>
                </div>
                {!user.hasPin && (
                  <span className="text-[10px] text-muted-foreground/60">No PIN</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-6 text-sm text-coral" role="alert">{error}</p>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          <button onClick={onSwitchToEmail} className="text-primary hover:underline">
            Use email &amp; password instead
          </button>
        </p>
      </div>
    );
  }

  // PIN entry screen
  const initials = selectedUser.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <div className="text-center max-w-sm mx-auto">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 mx-auto"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Selected user avatar */}
      <Avatar className="h-24 w-24 mx-auto mb-3 ring-4 ring-primary/20">
        <AvatarImage src={selectedUser.image ?? undefined} />
        <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <p className="text-xl font-semibold mb-1">{selectedUser.name}</p>
      <p className="text-sm text-muted-foreground mb-6">Enter your 4-digit PIN</p>

      {/* PIN dots */}
      <div className={`flex justify-center gap-4 mb-6 ${shake ? "animate-shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-5 w-5 rounded-full transition-all ${
              i < pin.length
                ? error ? "bg-coral scale-110" : "bg-primary scale-110"
                : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-coral text-sm mb-4 font-medium" role="alert">{error}</p>
      )}

      {/* Loading */}
      {loading && (
        <div className="mb-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"].map((key) => {
          if (key === "") return <div key="empty" />;
          if (key === "back") {
            return (
              <button
                key="back"
                onClick={handleBackspace}
                disabled={loading}
                className="h-16 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:scale-95"
                aria-label="Backspace"
              >
                <Delete className="h-6 w-6" />
              </button>
            );
          }
          return (
            <button
              key={key}
              onClick={() => handlePinDigit(key)}
              disabled={loading || pin.length >= 4}
              className="h-16 rounded-2xl text-2xl font-semibold bg-card border border-border hover:bg-muted hover:border-primary/30 transition-all active:scale-95 active:bg-primary/10"
            >
              {key}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        <button onClick={onSwitchToEmail} className="text-primary hover:underline">
          Use email &amp; password instead
        </button>
      </p>
    </div>
  );
}
