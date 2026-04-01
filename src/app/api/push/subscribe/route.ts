import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVapidPublicKey } from "@/lib/web-push";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

export async function GET() {
  return Response.json({ publicKey: getVapidPublicKey() });
}

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 subscriptions per user per minute
  const rl = checkRateLimit(`push-sub:${session.user.id}`, { max: 5, windowSec: 60 });
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = await request.json().catch(() => ({}));
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  // Upsert subscription
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: {
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return Response.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await request.json().catch(() => ({}));
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint },
    });
  }

  return Response.json({ success: true });
}
