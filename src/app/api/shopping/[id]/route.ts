import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";

const updateItemSchema = z.object({
  status: z.enum(["NEEDED", "CLAIMED", "PURCHASED", "DELIVERED"]).optional(),
  assignedToId: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  quantity: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/shopping/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Verify circle membership via item's parent list
  const item = await prisma.shoppingItem.findUnique({
    where: { id },
    include: { list: { select: { careCircleId: true } } },
  });
  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const membershipError = await requireCircleMembership(session.user.id, item.list.careCircleId);
  if (membershipError) return membershipError;

  // If claiming, auto-assign to self
  const data = { ...parsed.data };
  if (data.status === "CLAIMED" && data.assignedToId === undefined) {
    data.assignedToId = session.user.id;
  }

  const updated = await prisma.shoppingItem.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, image: true } },
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/shopping/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const item = await prisma.shoppingItem.findUnique({
    where: { id },
    include: { list: { select: { careCircleId: true } } },
  });
  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const membershipError = await requireCircleMembership(session.user.id, item.list.careCircleId);
  if (membershipError) return membershipError;

  await prisma.shoppingItem.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
