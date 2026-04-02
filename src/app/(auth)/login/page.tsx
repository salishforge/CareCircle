import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { KioskLogin } from "@/components/auth/KioskLogin";

export default function LoginPage() {
  return (
    <>
      {/* Mobile/Desktop: standard email + password form */}
      <div className="xl:hidden">
        <Suspense fallback={<div className="h-96" />}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Kiosk: avatar tap + PIN pad */}
      <div className="hidden xl:block">
        <Suspense fallback={<div className="h-96" />}>
          <KioskLogin />
        </Suspense>
      </div>
    </>
  );
}
