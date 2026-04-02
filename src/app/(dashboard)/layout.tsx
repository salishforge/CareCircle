import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { BottomBar } from "@/components/shared/BottomBar";
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

  const membership = await prisma.careCircleMember.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "PRIMARY_CAREGIVER";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Emergency banner */}
      <EmergencyBanner />

      {/* Main content */}
      <main className="flex-1 pb-20 px-4 md:px-6 xl:px-8 max-w-lg md:max-w-4xl xl:max-w-[1600px] mx-auto w-full">
        <PullToRefresh>
          {children}
        </PullToRefresh>
      </main>

      {/* Static bottom navigation */}
      <BottomBar isAdmin={isAdmin} />

      <InstallPrompt />
      <ServiceWorkerRegistration />
    </div>
  );
}
