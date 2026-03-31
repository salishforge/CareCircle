import { prisma } from "@/lib/prisma";
import { ShiftStatus } from "@/generated/prisma/client";

export async function getActiveCareCircle(userId: string) {
  return prisma.careCircleMember.findFirst({
    where: { userId, isActive: true },
    include: { careCircle: true },
  });
}

export async function getCurrentShift(careCircleId: string) {
  const now = new Date();
  return prisma.careShift.findFirst({
    where: {
      careCircleId,
      startTime: { lte: now },
      endTime: { gte: now },
      status: {
        in: [ShiftStatus.IN_PROGRESS, ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED],
      },
    },
    include: {
      primaryCaregiver: {
        select: { name: true, image: true, phone: true },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getNextShift(careCircleId: string) {
  const now = new Date();
  return prisma.careShift.findFirst({
    where: {
      careCircleId,
      startTime: { gt: now },
      status: {
        in: [ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED, ShiftStatus.OPEN],
      },
    },
    include: {
      primaryCaregiver: {
        select: { name: true, image: true, phone: true },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getTodayMealCounts(careCircleId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activePlan = await prisma.mealPlan.findFirst({
    where: { careCircleId, status: "ACTIVE" },
    select: { id: true },
  });

  if (!activePlan) return { planned: 0, delivered: 0 };

  const [planned, delivered] = await Promise.all([
    prisma.meal.count({
      where: { mealPlanId: activePlan.id, date: { gte: today, lt: tomorrow } },
    }),
    prisma.meal.count({
      where: {
        mealPlanId: activePlan.id,
        date: { gte: today, lt: tomorrow },
        status: "DELIVERED",
      },
    }),
  ]);

  return { planned, delivered };
}

export async function getPendingRequestCount(careCircleId: string) {
  return prisma.patientRequest.count({
    where: { careCircleId, status: "OPEN" },
  });
}

export async function getTodayAppointmentCount(careCircleId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.appointment.count({
    where: { careCircleId, dateTime: { gte: today, lt: tomorrow } },
  });
}

export async function getUserShiftForNow(userId: string, careCircleId: string) {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return prisma.careShift.findFirst({
    where: {
      careCircleId,
      primaryCaregiverId: userId,
      startTime: { lte: twoHoursFromNow },
      endTime: { gte: now },
      status: {
        in: [ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED, ShiftStatus.IN_PROGRESS],
      },
    },
    include: {
      checkIns: {
        where: { caregiverId: userId },
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
    orderBy: { startTime: "asc" },
  });
}
