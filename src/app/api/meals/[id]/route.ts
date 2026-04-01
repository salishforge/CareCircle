import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";

const updateMealSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  calories: z.number().int().positive().optional(),
  proteinGrams: z.number().int().positive().optional(),
  specialNotes: z.string().optional(),
  status: z.enum(["PLANNED", "CONFIRMED", "DELIVERED", "SKIPPED"]).optional(),
  patientRating: z.number().int().min(1).max(5).optional(),
  patientFeedback: z.string().optional(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/meals/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateMealSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const meal = await prisma.meal.findUnique({
    where: { id },
    include: { mealPlan: { select: { careCircleId: true } } },
  });

  if (!meal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const membershipError = await requireCircleMembership(session.user.id, meal.mealPlan.careCircleId);
  if (membershipError) return membershipError;

  const updated = await prisma.meal.update({
    where: { id },
    data: parsed.data,
    include: {
      provider: { select: { id: true, name: true, image: true } },
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/meals/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const meal = await prisma.meal.findUnique({
    where: { id },
    include: { mealPlan: { select: { careCircleId: true } } },
  });
  if (!meal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const membershipError = await requireCircleMembership(session.user.id, meal.mealPlan.careCircleId);
  if (membershipError) return membershipError;

  await prisma.meal.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
