import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Settings } from "lucide-react";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Emergency banner */}
      <EmergencyBanner />

      {/* Top header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-primary tracking-tight">
            CareCircle
          </h1>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link
              href="/settings"
              className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 px-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
