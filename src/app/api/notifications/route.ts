import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 50),
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return Response.json({ notifications, unreadCount });
}

const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const now = new Date();

  if (parsed.data.all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: now },
    });
  } else if (parsed.data.ids?.length) {
    await prisma.notification.updateMany({
      where: {
        id: { in: parsed.data.ids },
        userId: session.user.id,
      },
      data: { read: true, readAt: now },
    });
  }

  return Response.json({ success: true });
}
