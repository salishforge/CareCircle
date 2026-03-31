import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShiftStatus } from "@/generated/prisma/client";
import { z } from "zod";

const handoffSchema = z.object({
  handoffMood: z.number().int().min(1).max(5).optional(),
  handoffNotes: z.string().optional(),
  handoffMealsConsumed: z.string().optional(),
  handoffMedsGiven: z.string().optional(),
  complete: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/shifts/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const shift = await prisma.careShift.findUnique({ where: { id } });
  if (!shift) {
    return Response.json({ error: "Shift not found" }, { status: 404 });
  }

  // Only the primary caregiver or an admin can update handoff notes
  if (shift.primaryCaregiverId !== session.user.id) {
    const membership = await prisma.careCircleMember.findFirst({
      where: {
        careCircleId: shift.careCircleId,
        userId: session.user.id,
        role: { in: ["PRIMARY_CAREGIVER", "ADMIN"] },
        isActive: true,
      },
    });
    if (!membership) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const parsed = handoffSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { handoffMood, handoffNotes, handoffMealsConsumed, handoffMedsGiven, complete } =
    parsed.data;

  const updated = await prisma.careShift.update({
    where: { id },
    data: {
      ...(handoffMood !== undefined && { handoffMood }),
      ...(handoffNotes !== undefined && { handoffNotes }),
      ...(handoffMealsConsumed !== undefined && { handoffMealsConsumed }),
      ...(handoffMedsGiven !== undefined && { handoffMedsGiven }),
      ...(complete && { status: ShiftStatus.COMPLETED }),
    },
  });

  return Response.json(updated);
}
