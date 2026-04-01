import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { SideNav } from "@/components/shared/SideNav";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/providers/InstallPrompt";
import { PullToRefresh } from "@/components/shared/PullToRefresh";
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
    <div className="flex min-h-screen">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <SideNav />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Emergency banner */}
        <EmergencyBanner />

        {/* Top header — mobile only (sidebar has logo on desktop) */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pt-[env(safe-area-inset-top)] md:hidden">
          <div className="flex items-center justify-between h-14 px-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] max-w-lg mx-auto">
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

        {/* Main content — responsive width */}
        <main className="flex-1 pb-20 md:pb-6 px-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] max-w-lg md:max-w-3xl xl:max-w-7xl mx-auto w-full">
          <PullToRefresh>
            {children}
          </PullToRefresh>
        </main>

        {/* Bottom navigation — mobile only */}
        <div className="md:hidden">
          <BottomNav />
        </div>
        <InstallPrompt />
        <ServiceWorkerRegistration />
      </div>
    </div>
  );
}
