"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AcceptInviteButtonProps {
  inviteCode: string;
  circleName: string;
}

export function AcceptInviteButton({
  inviteCode,
  circleName,
}: AcceptInviteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/invites/${inviteCode}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept invite.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleAccept}
        disabled={loading}
        className="w-full h-12 text-base font-semibold"
      >
        {loading ? "Joining..." : `Join ${circleName}`}
      </Button>
      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
