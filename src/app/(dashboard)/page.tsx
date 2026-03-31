import { auth } from "@/lib/auth";
import { WhoIsHere } from "@/components/dashboard/WhoIsHere";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TodayOverview } from "@/components/dashboard/TodayOverview";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6 py-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold">
          Hi{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Who's here now */}
      <WhoIsHere currentCaregiver={null} nextCaregiver={null} />

      {/* Quick actions */}
      <QuickActions />

      {/* Today's overview */}
      <TodayOverview
        mealsPlanned={0}
        mealsDelivered={0}
        appointmentsCount={0}
        pendingRequests={0}
      />
    </div>
  );
}
