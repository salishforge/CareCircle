"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { KioskLogin } from "@/components/auth/KioskLogin";

function LoginContent() {
  const searchParams = useSearchParams();
  const forceEmail = searchParams.get("mode") === "email";
  const [isKiosk, setIsKiosk] = useState(false);
  const [showEmail, setShowEmail] = useState(forceEmail);

  useEffect(() => {
    // Detect kiosk by screen width
    setIsKiosk(window.innerWidth >= 1280);
  }, []);

  // Show email form if: small screen, or forced via param/toggle
  if (!isKiosk || showEmail) {
    return (
      <>
        <LoginForm />
        {isKiosk && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowEmail(false)}
              className="text-sm text-primary hover:underline"
            >
              ← Back to kiosk login
            </button>
          </div>
        )}
      </>
    );
  }

  // Kiosk mode
  return <KioskLogin onSwitchToEmail={() => setShowEmail(true)} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <LoginContent />
    </Suspense>
  );
}
