import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";

const gratitudeSchema = z.object({
  careCircleId: z.string(),
  content: z.string().min(1).max(1000),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const membershipError = await requireCircleMembership(session.user.id, careCircleId);
  if (membershipError) return membershipError;

  const messages = await prisma.gratitudeMessage.findMany({
    where: { careCircleId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(messages);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = gratitudeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Verify membership
  const membership = await prisma.careCircleMember.findFirst({
    where: { careCircleId: parsed.data.careCircleId, userId: session.user.id, isActive: true },
  });

  if (!membership) {
    return Response.json({ error: "Not a member" }, { status: 403 });
  }

  const message = await prisma.gratitudeMessage.create({
    data: {
      careCircleId: parsed.data.careCircleId,
      senderId: session.user.id,
      content: parsed.data.content,
      isDelivered: true,
      deliveredAt: new Date(),
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  return Response.json(message, { status: 201 });
}
