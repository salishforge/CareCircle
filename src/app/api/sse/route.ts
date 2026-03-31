import { prisma } from "@/lib/prisma";
import { ShiftStatus } from "@/generated/prisma/client";
import { format, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const circleId = searchParams.get("circleId");
  const token = searchParams.get("token");

  if (!circleId) {
    return Response.json({ error: "circleId required" }, { status: 400 });
  }

  // Validate display token if configured
  const displayToken = process.env.DISPLAY_TOKEN;
  if (displayToken && token !== displayToken) {
    return Response.json({ error: "Invalid display token" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const data = await getDisplayData(circleId);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "fetch_failed" })}\n\n`));
      }

      // Poll every 10 seconds
      const interval = setInterval(async () => {
        try {
          const data = await getDisplayData(circleId);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Keep the connection alive even if a poll fails
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        }
      }, 10_000);

      // Heartbeat ping every 25 seconds to prevent proxy timeout
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(ping);
          clearInterval(interval);
        }
      }, 25_000);

      // Cleanup when connection closes
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(ping);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function getDisplayData(circleId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [currentShift, upcomingShifts, todayMeals, openRequests, recentCheckIn] =
    await Promise.all([
      // Current active shift
      prisma.careShift.findFirst({
        where: {
          careCircleId: circleId,
          startTime: { lte: now },
          endTime: { gte: now },
          status: { in: [ShiftStatus.IN_PROGRESS, ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED] },
        },
        include: {
          primaryCaregiver: { select: { name: true, image: true, phone: true } },
        },
      }),

      // Next 3 upcoming shifts
      prisma.careShift.findMany({
        where: {
          careCircleId: circleId,
          startTime: { gt: now },
          status: { in: [ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED, ShiftStatus.OPEN] },
        },
        include: {
          primaryCaregiver: { select: { name: true, image: true } },
        },
        orderBy: { startTime: "asc" },
        take: 3,
      }),

      // Today's meals
      prisma.meal.findMany({
        where: {
          mealPlan: { careCircleId: circleId },
          date: { gte: todayStart, lte: todayEnd },
        },
        include: {
          provider: { select: { name: true } },
        },
        orderBy: { mealType: "asc" },
      }),

      // Open patient requests
      prisma.patientRequest.findMany({
        where: { careCircleId: circleId, status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),

      // Most recent check-in
      prisma.checkIn.findFirst({
        where: { shift: { careCircleId: circleId } },
        include: { caregiver: { select: { name: true } } },
        orderBy: { timestamp: "desc" },
      }),
    ]);

  return {
    timestamp: now.toISOString(),
    currentShift: currentShift
      ? {
          caregiverName: currentShift.primaryCaregiver?.name ?? "Unknown",
          caregiverImage: currentShift.primaryCaregiver?.image ?? null,
          caregiverPhone: currentShift.primaryCaregiver?.phone ?? null,
          shiftEnd: format(currentShift.endTime, "h:mm a"),
          checkedIn: currentShift.status === ShiftStatus.IN_PROGRESS,
        }
      : null,
    upcomingShifts: upcomingShifts.map((s) => ({
      id: s.id,
      caregiverName: s.primaryCaregiver?.name ?? "Open slot",
      caregiverImage: s.primaryCaregiver?.image ?? null,
      startTime: format(s.startTime, "h:mm a"),
      endTime: format(s.endTime, "h:mm a"),
      date: format(s.startTime, "EEE MMM d"),
      status: s.status,
    })),
    todayMeals: todayMeals.map((m) => ({
      id: m.id,
      mealType: m.mealType,
      title: m.title,
      providerName: m.provider?.name ?? null,
      status: m.status,
    })),
    openRequests: openRequests.map((r) => ({
      id: r.id,
      type: r.type,
      description: r.description,
      priority: r.priority,
      createdAt: format(r.createdAt, "h:mm a"),
    })),
    lastCheckIn: recentCheckIn
      ? {
          caregiverName: recentCheckIn.caregiver.name ?? "Unknown",
          timestamp: format(recentCheckIn.timestamp, "h:mm a"),
        }
      : null,
  };
}
