import { prisma } from "@/lib/prisma";
import { sendDailyDigestEmail } from "@/lib/email";
import { getUserPrefs, shouldNotifyChannel } from "@/lib/notification-utils";
import { NotificationType } from "@/generated/prisma/client";
import { format, startOfDay, endOfDay } from "date-fns";

/**
 * Daily care digest — runs once per day at 8am.
 * Sends a summary email to all circle members with email enabled.
 */
export async function POST(request: Request) {
  const { safeCompare } = await import("@/lib/auth-utils");
  const authHeader = request.headers.get("authorization") ?? "";
  if (process.env.CRON_SECRET && !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Get all active care circles
  const circles = await prisma.careCircle.findMany({
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  let emailsSent = 0;

  for (const circle of circles) {
    // Fetch today's data for this circle
    const [shifts, mealCounts, openRequests, latestMood] = await Promise.all([
      prisma.careShift.findMany({
        where: {
          careCircleId: circle.id,
          date: { gte: todayStart, lte: todayEnd },
        },
        include: {
          primaryCaregiver: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.meal.count({
        where: {
          mealPlan: { careCircleId: circle.id },
          date: { gte: todayStart, lte: todayEnd },
        },
      }).then(async (planned) => {
        const delivered = await prisma.meal.count({
          where: {
            mealPlan: { careCircleId: circle.id },
            date: { gte: todayStart, lte: todayEnd },
            status: "DELIVERED",
          },
        });
        return { planned, delivered };
      }),
      prisma.patientRequest.count({
        where: { careCircleId: circle.id, status: "OPEN" },
      }),
      prisma.moodEntry.findFirst({
        where: {
          user: { circleMemberships: { some: { careCircleId: circle.id } } },
        },
        orderBy: { date: "desc" },
        select: { mood: true },
      }),
    ]);

    const shiftData = shifts.map((s) => ({
      caregiver: s.primaryCaregiver?.name ?? "Unassigned",
      time: `${format(s.startTime, "h:mm a")} - ${format(s.endTime, "h:mm a")}`,
      status: s.status,
    }));

    // Send to each member
    for (const member of circle.members) {
      if (!member.user.email) continue;

      const prefs = await getUserPrefs(member.user.id);
      if (!shouldNotifyChannel(prefs, "email", NotificationType.SYSTEM)) continue;

      try {
        await sendDailyDigestEmail({
          recipientEmail: member.user.email,
          recipientName: member.user.name ?? "Team Member",
          circleName: circle.name,
          date: now,
          shifts: shiftData,
          mealsPlanned: mealCounts.planned,
          mealsDelivered: mealCounts.delivered,
          openRequests,
          latestMood: latestMood?.mood ?? null,
        });
        emailsSent++;
      } catch {
        // Non-fatal — continue to next member
      }
    }
  }

  return Response.json({
    circles: circles.length,
    emailsSent,
  });
}
