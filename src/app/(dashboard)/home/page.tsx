import { auth } from "@/lib/auth";
import { format } from "date-fns";
import { WhoIsHere } from "@/components/dashboard/WhoIsHere";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TodayOverview } from "@/components/dashboard/TodayOverview";
import { CheckInButton } from "@/components/dashboard/CheckInButton";
import { HomeDashboard } from "@/components/dashboard/HomeDashboard";
import {
  getActiveCareCircle,
  getCurrentShift,
  getNextShift,
  getTodayMealCounts,
  getPendingRequestCount,
  getTodayAppointmentCount,
  getUserShiftForNow,
} from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const membership = userId ? await getActiveCareCircle(userId) : null;
  const circleId = membership?.careCircleId ?? null;

  const [currentShift, nextShift, mealCounts, pendingRequests, appointmentCount, myShift] =
    circleId && userId
      ? await Promise.all([
          getCurrentShift(circleId),
          getNextShift(circleId),
          getTodayMealCounts(circleId),
          getPendingRequestCount(circleId),
          getTodayAppointmentCount(circleId),
          getUserShiftForNow(userId, circleId),
        ])
      : [null, null, { planned: 0, delivered: 0 }, 0, 0, null];

  const currentCaregiver = currentShift?.primaryCaregiver
    ? {
        name: currentShift.primaryCaregiver.name ?? "Caregiver",
        image: currentShift.primaryCaregiver.image,
        phone: currentShift.primaryCaregiver.phone,
        shiftEnd: format(currentShift.endTime, "h:mm a"),
      }
    : null;

  const nextCaregiver = nextShift?.primaryCaregiver
    ? {
        name: nextShift.primaryCaregiver.name ?? "Caregiver",
        image: nextShift.primaryCaregiver.image,
        phone: nextShift.primaryCaregiver.phone,
        shiftEnd: format(nextShift.endTime, "h:mm a"),
      }
    : null;

  const firstName = session?.user?.name?.split(" ")[0] ?? "";
  const alreadyCheckedIn = (myShift?.checkIns?.length ?? 0) > 0;

  return (
    <div className="py-6 xl:py-3 xl:h-[calc(100vh-1rem)] xl:flex xl:flex-col xl:overflow-hidden">
      <div className="mb-6 xl:mb-3">
        <h2 className="text-2xl xl:text-xl font-bold">
          Hi{firstName ? `, ${firstName}` : ""}
        </h2>
        <p className="text-muted-foreground text-sm xl:text-base mt-1">
          Here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Mobile layout — single column stack */}
      <div className="xl:hidden space-y-6">
        {myShift && (
          <CheckInButton
            shiftId={myShift.id}
            shiftEnd={format(myShift.endTime, "h:mm a")}
            alreadyCheckedIn={alreadyCheckedIn}
          />
        )}

        <WhoIsHere currentCaregiver={currentCaregiver} nextCaregiver={nextCaregiver} />
        <QuickActions />
        <TodayOverview
          mealsPlanned={mealCounts.planned}
          mealsDelivered={mealCounts.delivered}
          appointmentsCount={appointmentCount}
          pendingRequests={pendingRequests}
        />
      </div>

      {/* Desktop/Smart Board layout — widget grid, fills viewport on kiosk */}
      <div className="hidden xl:block xl:flex-1 xl:min-h-0">
        <HomeDashboard
          careCircleId={circleId}
          currentCaregiver={currentCaregiver}
          nextCaregiver={nextCaregiver}
          mealCounts={mealCounts}
          appointmentCount={appointmentCount}
          pendingRequests={pendingRequests}
          myShift={myShift ? {
            id: myShift.id,
            shiftEnd: format(myShift.endTime, "h:mm a"),
            alreadyCheckedIn,
          } : null}
        />
      </div>
    </div>
  );
}
