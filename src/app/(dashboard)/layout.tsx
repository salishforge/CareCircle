import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/providers/InstallPrompt";
import { PullToRefresh } from "@/components/shared/PullToRefresh";

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

      {/* Main content — full width, no sidebar */}
      <main className="flex-1 px-4 md:px-6 xl:px-8 max-w-lg md:max-w-4xl xl:max-w-[1600px] mx-auto w-full">
        <PullToRefresh>
          {children}
        </PullToRefresh>
      </main>

      <InstallPrompt />
      <ServiceWorkerRegistration />
    </div>
  );
}
