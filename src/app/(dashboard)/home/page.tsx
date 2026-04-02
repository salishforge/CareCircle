import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CheckInButton } from "@/components/dashboard/CheckInButton";
import { WhoIsHere } from "@/components/dashboard/WhoIsHere";
import { TileDashboard } from "@/components/dashboard/TileDashboard";
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

  // Check if user is admin
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "PRIMARY_CAREGIVER";

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
    <TileDashboard
      careCircleId={circleId}
      firstName={firstName}
      isAdmin={isAdmin ?? false}
      userRole={membership?.role ?? "CAREGIVER"}
      mealsPlanned={mealCounts.planned}
      mealsDelivered={mealCounts.delivered}
      pendingRequests={pendingRequests}
      appointmentCount={appointmentCount}
      currentCaregiver={currentCaregiver}
      nextCaregiver={nextCaregiver}
      myShift={myShift ? {
        id: myShift.id,
        shiftEnd: format(myShift.endTime, "h:mm a"),
        alreadyCheckedIn,
      } : null}
    />
  );
}
