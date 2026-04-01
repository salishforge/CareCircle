import { prisma } from "@/lib/prisma";
import {
  ShiftStatus,
  EscalationLevel,
  NotificationType,
} from "@/generated/prisma/client";
import { sendSms, sendEscalationAlert } from "@/lib/twilio";
import { sendEscalationEmail } from "@/lib/email";
import { shouldNotifyChannel, getUserPrefs } from "@/lib/notification-utils";

/**
 * Main escalation check. Call every 5 minutes via cron.
 * Optionally scope to a single care circle.
 */
export async function checkMissedCheckIns(circleId?: string): Promise<EscalationSummary> {
  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // Find shifts that started 15+ minutes ago with no check-in
  const shifts = await prisma.careShift.findMany({
    where: {
      ...(circleId ? { careCircleId: circleId } : {}),
      startTime: { lte: fifteenMinsAgo },
      endTime: { gte: now },
      status: { in: [ShiftStatus.CONFIRMED, ShiftStatus.CLAIMED] },
    },
    include: {
      primaryCaregiver: { select: { id: true, name: true, phone: true } },
      alternateCaregiver: { select: { id: true, name: true, phone: true } },
      escalations: { where: { resolvedAt: null }, orderBy: { triggeredAt: "desc" } },
      careCircle: {
        include: {
          members: {
            where: { isActive: true, role: { in: ["PRIMARY_CAREGIVER", "ADMIN"] } },
            include: { user: { select: { id: true, name: true, phone: true } } },
          },
        },
      },
    },
  });

  const results: EscalationResult[] = [];

  for (const shift of shifts) {
    const minutesLate = (now.getTime() - shift.startTime.getTime()) / 60000;
    const existingLevels = shift.escalations.map((e) => e.level);

    let targetLevel: EscalationLevel | null = null;

    if (minutesLate >= 45 && !existingLevels.includes(EscalationLevel.LEVEL_3)) {
      targetLevel = EscalationLevel.LEVEL_3;
    } else if (minutesLate >= 30 && !existingLevels.includes(EscalationLevel.LEVEL_2)) {
      targetLevel = EscalationLevel.LEVEL_2;
    } else if (minutesLate >= 15 && !existingLevels.includes(EscalationLevel.LEVEL_1)) {
      targetLevel = EscalationLevel.LEVEL_1;
    }

    if (!targetLevel) continue;

    await createEscalation(shift, targetLevel, now);
    results.push({ shiftId: shift.id, level: targetLevel, minutesLate: Math.round(minutesLate) });
  }

  return { processed: shifts.length, escalations: results };
}

async function createEscalation(
  shift: ShiftWithRelations,
  level: EscalationLevel,
  now: Date
) {
  // Create the escalation record
  await prisma.alertEscalation.create({
    data: { shiftId: shift.id, level, triggeredAt: now },
  });

  const caregiverName = shift.primaryCaregiver?.name ?? "the caregiver";

  // Determine who to notify
  const notifications: NotificationTarget[] = [];

  if (level === EscalationLevel.LEVEL_1 && shift.alternateCaregiver) {
    // L1: Alert alternate caregiver
    notifications.push({
      user: shift.alternateCaregiver,
      message: `${caregiverName} hasn't checked in yet. Can you cover their shift?`,
      notifType: NotificationType.ESCALATION,
    });
  } else if (level === EscalationLevel.LEVEL_2) {
    // L2: Alert alternate + admins
    if (shift.alternateCaregiver) {
      notifications.push({
        user: shift.alternateCaregiver,
        message: `URGENT: ${caregiverName} is 30+ min late. Please cover the shift.`,
        notifType: NotificationType.ESCALATION,
      });
    }
    for (const member of shift.careCircle.members) {
      notifications.push({
        user: member.user,
        message: `ALERT: ${caregiverName} is 30+ min late for their shift.`,
        notifType: NotificationType.ESCALATION,
      });
    }
  } else if (level === EscalationLevel.LEVEL_3) {
    // L3: Alert everyone + attempt emergency contacts
    for (const member of shift.careCircle.members) {
      notifications.push({
        user: member.user,
        message: `EMERGENCY: ${caregiverName} is 45+ min late. Patient may be unattended.`,
        notifType: NotificationType.ESCALATION,
      });
    }
  }

  // Persist in-app notifications and send SMS + email
  await Promise.allSettled(
    notifications.map(async (n) => {
      const prefs = await getUserPrefs(n.user.id);
      const levelNum = parseInt(level.split("_")[1]);

      await prisma.notification.create({
        data: {
          userId: n.user.id,
          type: n.notifType,
          title: `Care circle alert — Level ${levelNum}`,
          body: n.message,
        },
      });

      if (n.user.phone && shouldNotifyChannel(prefs, "sms", n.notifType)) {
        await sendEscalationAlert({
          recipientName: n.user.name ?? "Caregiver",
          recipientPhone: n.user.phone,
          missedCaregiverName: caregiverName,
          shiftStart: shift.startTime,
          level: levelNum,
        });
      }

      // Send escalation email
      const user = await prisma.user.findUnique({
        where: { id: n.user.id },
        select: { email: true },
      });
      if (user?.email && shouldNotifyChannel(prefs, "email", n.notifType)) {
        await sendEscalationEmail({
          recipientEmail: user.email,
          recipientName: n.user.name ?? "Caregiver",
          missedCaregiverName: caregiverName,
          shiftStart: shift.startTime,
          level: levelNum,
        });
      }
    })
  );
}

export async function resolveEscalation(
  escalationId: string,
  resolverId: string,
  resolution: "CAREGIVER_ARRIVED" | "ALTERNATE_DISPATCHED" | "EMERGENCY_CONTACTED"
) {
  return prisma.alertEscalation.update({
    where: { id: escalationId },
    data: {
      resolvedAt: new Date(),
      resolvedById: resolverId,
      resolution,
    },
  });
}

// --- Types ---

interface UserInfo {
  id: string;
  name: string | null;
  phone: string | null;
}

interface NotificationTarget {
  user: UserInfo;
  message: string;
  notifType: NotificationType;
}

interface ShiftWithRelations {
  id: string;
  startTime: Date;
  primaryCaregiver: UserInfo | null;
  alternateCaregiver: UserInfo | null;
  escalations: { level: EscalationLevel }[];
  careCircle: {
    members: { user: UserInfo }[];
  };
}

export interface EscalationResult {
  shiftId: string;
  level: EscalationLevel;
  minutesLate: number;
}

export interface EscalationSummary {
  processed: number;
  escalations: EscalationResult[];
}
