import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  return Response.json(user?.notificationPreferences ?? {});
}

const prefsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  quietHoursStart: z.string().nullable().optional(), // "22:00"
  quietHoursEnd: z.string().nullable().optional(),   // "07:00"
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Merge with existing preferences
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  const existing = (user?.notificationPreferences as Record<string, unknown>) ?? {};
  const merged = { ...existing, ...parsed.data };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: merged },
  });

  return Response.json(merged);
}
