import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  CheckInMethod,
  CheckInStatus,
  ShiftStatus,
  EscalationResolution,
  NotificationType,
} from "@/generated/prisma/client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 check-ins per user per minute
  const rl = checkRateLimit(`checkin:${session.user.id}`, { max: 10, windowSec: 60 });
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = await request.json().catch(() => ({}));
  const { shiftId, latitude, longitude } = body;

  if (!shiftId) {
    return Response.json({ error: "shiftId is required" }, { status: 400 });
  }

  const shift = await prisma.careShift.findFirst({
    where: {
      id: shiftId,
      primaryCaregiverId: session.user.id,
      status: {
        in: [ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED, ShiftStatus.IN_PROGRESS],
      },
    },
  });

  if (!shift) {
    return Response.json({ error: "Shift not found or not active" }, { status: 404 });
  }

  const existingCheckIn = await prisma.checkIn.findFirst({
    where: { shiftId, caregiverId: session.user.id },
  });

  if (existingCheckIn) {
    return Response.json({ error: "Already checked in for this shift" }, { status: 409 });
  }

  const now = new Date();
  const minutesLate = (now.getTime() - shift.startTime.getTime()) / 60000;
  const status = minutesLate > 15 ? CheckInStatus.LATE : CheckInStatus.ON_TIME;

  const checkIn = await prisma.$transaction(async (tx) => {
    const record = await tx.checkIn.create({
      data: {
        shiftId,
        caregiverId: session.user.id,
        method: CheckInMethod.APP_BUTTON,
        status,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    });

    await tx.careShift.update({
      where: { id: shiftId },
      data: { status: ShiftStatus.IN_PROGRESS },
    });

    // Resolve any open escalations for this shift
    await tx.alertEscalation.updateMany({
      where: { shiftId, resolvedAt: null },
      data: {
        resolvedAt: now,
        resolvedById: session.user.id,
        resolution: EscalationResolution.CAREGIVER_ARRIVED,
      },
    });

    // Create a confirmation notification for the caregiver
    await tx.notification.create({
      data: {
        userId: session.user.id,
        type: NotificationType.SHIFT_CONFIRMATION,
        title: "Checked in successfully",
        body:
          status === CheckInStatus.LATE
            ? `You checked in ${Math.round(minutesLate)} minutes late.`
            : "You're checked in. Have a great shift! 💚",
      },
    });

    return record;
  });

  return Response.json({ checkIn, status });
}
