import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/client";
import { sendPushToUser } from "@/lib/web-push";
import { sendEmail } from "@/lib/email";

type Channel = "email" | "sms" | "push";

interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
  quietHoursStart: string | null; // "22:00"
  quietHoursEnd: string | null;   // "07:00"
}

const DEFAULT_PREFS: NotificationPrefs = {
  email: true,
  sms: true,
  push: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

// Escalation notifications always bypass quiet hours
const BYPASS_QUIET_TYPES: NotificationType[] = [
  NotificationType.ESCALATION,
];

export async function getUserPrefs(userId: string): Promise<NotificationPrefs> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });

  const raw = user?.notificationPreferences as Record<string, unknown> | null;
  if (!raw) return DEFAULT_PREFS;

  return {
    email: typeof raw.email === "boolean" ? raw.email : DEFAULT_PREFS.email,
    sms: typeof raw.sms === "boolean" ? raw.sms : DEFAULT_PREFS.sms,
    push: typeof raw.push === "boolean" ? raw.push : DEFAULT_PREFS.push,
    quietHoursStart: typeof raw.quietHoursStart === "string" ? raw.quietHoursStart : null,
    quietHoursEnd: typeof raw.quietHoursEnd === "string" ? raw.quietHoursEnd : null,
  };
}

export function isInQuietHours(prefs: NotificationPrefs, now: Date = new Date()): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

  const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same day range (e.g., 09:00 - 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g., 22:00 - 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

export function shouldNotifyChannel(
  prefs: NotificationPrefs,
  channel: Channel,
  type: NotificationType,
  now: Date = new Date()
): boolean {
  // Check if channel is enabled
  if (!prefs[channel]) return false;

  // Escalations always bypass quiet hours
  if (BYPASS_QUIET_TYPES.includes(type)) return true;

  // Check quiet hours
  if (isInQuietHours(prefs, now)) return false;

  return true;
}

/**
 * Unified notification dispatcher.
 * Always creates in-app notification.
 * Sends push/email based on user preferences and quiet hours.
 */
export async function sendNotification(
  userId: string,
  params: {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    email?: { subject: string; html: string };
  }
): Promise<{ inApp: boolean; push: boolean; email: boolean }> {
  const prefs = await getUserPrefs(userId);
  const result = { inApp: true, push: false, email: false };

  // Always create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ?? undefined,
    },
  });

  // Push notification
  if (shouldNotifyChannel(prefs, "push", params.type)) {
    try {
      await sendPushToUser(userId, {
        title: params.title,
        body: params.body,
        data: { type: params.type, ...params.data },
      });
      result.push = true;
    } catch {
      // Push failure is non-fatal
    }
  }

  // Email notification
  if (shouldNotifyChannel(prefs, "email", params.type) && params.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendEmail(user.email, params.email.subject, params.email.html);
        result.email = true;
      }
    } catch {
      // Email failure is non-fatal
    }
  }

  return result;
}
