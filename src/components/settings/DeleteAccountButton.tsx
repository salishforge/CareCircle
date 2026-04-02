"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete account.");
        setDeleting(false);
        return;
      }

      // Sign out and redirect to landing
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="outline"
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete My Account
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-destructive">
        Are you sure? This will permanently delete your account.
      </p>
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Trash2 className="h-4 w-4 mr-1" />
          )}
          Yes, Delete My Account
        </Button>
      </div>
    </div>
  );
}
