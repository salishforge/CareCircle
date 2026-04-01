import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeeklyCoverage } from "@/lib/coverage-validator";
import { subDays, startOfDay } from "date-fns";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");
  const days = parseInt(searchParams.get("days") ?? "7", 10);

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const since = startOfDay(subDays(new Date(), days));
  const now = new Date();

  // Run all queries in parallel
  const [
    coverage,
    totalShifts,
    completedShifts,
    missedShifts,
    totalCheckIns,
    onTimeCheckIns,
    moodEntries,
    totalMeals,
    deliveredMeals,
    totalRequests,
    fulfilledRequests,
    openRequests,
  ] = await Promise.all([
    getWeeklyCoverage(careCircleId, new Date()),
    prisma.careShift.count({
      where: { careCircleId, date: { gte: since } },
    }),
    prisma.careShift.count({
      where: { careCircleId, date: { gte: since }, status: "COMPLETED" },
    }),
    prisma.careShift.count({
      where: { careCircleId, date: { gte: since }, status: "MISSED" },
    }),
    prisma.checkIn.count({
      where: { shift: { careCircleId }, timestamp: { gte: since } },
    }),
    prisma.checkIn.count({
      where: { shift: { careCircleId }, timestamp: { gte: since }, status: "ON_TIME" },
    }),
    prisma.moodEntry.findMany({
      where: {
        user: { circleMemberships: { some: { careCircleId } } },
        date: { gte: since },
      },
      orderBy: { date: "asc" },
      select: { date: true, mood: true, energyLevel: true, painLevel: true },
    }),
    prisma.meal.count({
      where: { mealPlan: { careCircleId }, date: { gte: since } },
    }),
    prisma.meal.count({
      where: { mealPlan: { careCircleId }, date: { gte: since }, status: "DELIVERED" },
    }),
    prisma.patientRequest.count({
      where: { careCircleId, createdAt: { gte: since } },
    }),
    prisma.patientRequest.count({
      where: { careCircleId, createdAt: { gte: since }, status: "FULFILLED" },
    }),
    prisma.patientRequest.count({
      where: { careCircleId, status: "OPEN" },
    }),
  ]);

  const checkInRate = totalCheckIns > 0
    ? Math.round((onTimeCheckIns / totalCheckIns) * 100)
    : 0;

  const mealDeliveryRate = totalMeals > 0
    ? Math.round((deliveredMeals / totalMeals) * 100)
    : 0;

  const requestFulfillmentRate = totalRequests > 0
    ? Math.round((fulfilledRequests / totalRequests) * 100)
    : 0;

  return Response.json({
    period: { days, since: since.toISOString() },
    coverage: {
      percent: coverage.coveragePercent,
      coveredHours: coverage.coveredHours,
      totalHours: coverage.totalHours,
      openSlots: coverage.openSlots,
      gaps: coverage.gaps.length,
    },
    shifts: {
      total: totalShifts,
      completed: completedShifts,
      missed: missedShifts,
    },
    checkIns: {
      total: totalCheckIns,
      onTime: onTimeCheckIns,
      onTimeRate: checkInRate,
    },
    meals: {
      total: totalMeals,
      delivered: deliveredMeals,
      deliveryRate: mealDeliveryRate,
    },
    requests: {
      total: totalRequests,
      fulfilled: fulfilledRequests,
      fulfillmentRate: requestFulfillmentRate,
      currentlyOpen: openRequests,
    },
    moodTrend: moodEntries,
  });
}
