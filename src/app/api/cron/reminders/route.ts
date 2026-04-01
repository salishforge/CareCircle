import { prisma } from "@/lib/prisma";
import { NotificationType, ShiftStatus } from "@/generated/prisma/client";
import { sendPushToUser } from "@/lib/web-push";
import { sendShiftReminderEmail, sendMedicationReminderEmail } from "@/lib/email";
import { getUserPrefs, shouldNotifyChannel } from "@/lib/notification-utils";

/**
 * Cron job: runs every 5 minutes (alongside check-in-monitor)
 * Sends shift reminders (30 min before) and medication reminders.
 */
export async function POST(request: Request) {
  // Verify cron secret with constant-time comparison
  const { safeCompare } = await import("@/lib/auth-utils");
  const authHeader = request.headers.get("authorization") ?? "";
  if (process.env.CRON_SECRET && !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  const twentyFiveMinsFromNow = new Date(now.getTime() + 25 * 60 * 1000);

  // --- Shift Reminders ---
  // Find shifts starting in ~30 minutes that haven't been reminded
  const upcomingShifts = await prisma.careShift.findMany({
    where: {
      startTime: { gte: twentyFiveMinsFromNow, lte: thirtyMinsFromNow },
      status: { in: [ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED] },
      primaryCaregiverId: { not: null },
    },
    include: {
      primaryCaregiver: { select: { id: true, name: true } },
      careCircle: { select: { name: true } },
    },
  });

  const shiftResults = await Promise.allSettled(
    upcomingShifts.map(async (shift) => {
      if (!shift.primaryCaregiverId) return;

      // Check if we already sent a reminder
      const existing = await prisma.notification.findFirst({
        where: {
          userId: shift.primaryCaregiverId,
          type: NotificationType.SHIFT_REMINDER,
          createdAt: { gte: twentyFiveMinsFromNow },
          data: { path: ["shiftId"], equals: shift.id },
        },
      });
      if (existing) return;

      const title = "Shift starting soon";
      const body = `Your shift at ${shift.careCircle.name} starts in 30 minutes.`;

      await prisma.notification.create({
        data: {
          userId: shift.primaryCaregiverId,
          type: NotificationType.SHIFT_REMINDER,
          title,
          body,
          data: { shiftId: shift.id },
        },
      });

      const prefs = await getUserPrefs(shift.primaryCaregiverId);

      if (shouldNotifyChannel(prefs, "push", NotificationType.SHIFT_REMINDER)) {
        await sendPushToUser(shift.primaryCaregiverId, {
          title,
          body,
          data: { type: "SHIFT_REMINDER", shiftId: shift.id },
        });
      }

      if (shouldNotifyChannel(prefs, "email", NotificationType.SHIFT_REMINDER)) {
        const user = await prisma.user.findUnique({
          where: { id: shift.primaryCaregiverId },
          select: { email: true, name: true },
        });
        if (user?.email) {
          await sendShiftReminderEmail({
            recipientEmail: user.email,
            recipientName: user.name ?? "Caregiver",
            shiftStart: shift.startTime,
            shiftEnd: shift.endTime,
            circleName: shift.careCircle.name,
          });
        }
      }
    })
  );

  // --- Medication Reminders ---
  // Remind once per day for active medications (morning check at ~8am window)
  const hour = now.getHours();
  let medResults: PromiseSettledResult<void>[] = [];

  if (hour >= 7 && hour <= 9) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find patients with active medications who haven't been reminded today
    const activeMeds = await prisma.medicationEntry.findMany({
      where: { isActive: true },
      select: { patientId: true, name: true },
    });

    // Group by patient
    const patientMeds = new Map<string, string[]>();
    for (const med of activeMeds) {
      const existing = patientMeds.get(med.patientId) ?? [];
      existing.push(med.name);
      patientMeds.set(med.patientId, existing);
    }

    medResults = await Promise.allSettled(
      Array.from(patientMeds.entries()).map(async ([patientId, medNames]) => {
        // Check if already reminded today
        const existing = await prisma.notification.findFirst({
          where: {
            userId: patientId,
            type: NotificationType.MEDICATION_REMINDER,
            createdAt: { gte: today },
          },
        });
        if (existing) return;

        const title = "Medication reminder";
        const body = `Don't forget to take: ${medNames.slice(0, 3).join(", ")}${medNames.length > 3 ? ` and ${medNames.length - 3} more` : ""}`;

        await prisma.notification.create({
          data: {
            userId: patientId,
            type: NotificationType.MEDICATION_REMINDER,
            title,
            body,
          },
        });

        const prefs = await getUserPrefs(patientId);

        if (shouldNotifyChannel(prefs, "push", NotificationType.MEDICATION_REMINDER)) {
          await sendPushToUser(patientId, {
            title,
            body,
            data: { type: "MEDICATION_REMINDER" },
          });
        }

        if (shouldNotifyChannel(prefs, "email", NotificationType.MEDICATION_REMINDER)) {
          const user = await prisma.user.findUnique({
            where: { id: patientId },
            select: { email: true, name: true },
          });
          if (user?.email) {
            await sendMedicationReminderEmail({
              recipientEmail: user.email,
              recipientName: user.name ?? "Patient",
              medications: medNames,
            });
          }
        }
      })
    );
  }

  return Response.json({
    shiftReminders: shiftResults.filter((r) => r.status === "fulfilled").length,
    medReminders: medResults.filter((r) => r.status === "fulfilled").length,
  });
}
