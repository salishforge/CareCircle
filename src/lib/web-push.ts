import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:care@carecircle.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        // Remove invalid subscriptions (410 Gone or 404)
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      }
    })
  );

  return results;
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
