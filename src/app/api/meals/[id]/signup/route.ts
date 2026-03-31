import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const signupSchema = z.object({
  deliveryTime: z.string().optional(),
  plannedMeal: z.string().optional(),
  specialInstructions: z.string().optional(),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/meals/[id]/signup">
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
    return Response.json({ error: "Meal not found" }, { status: 404 });
  }

  if (meal.providerId) {
    return Response.json({ error: "This meal already has a provider" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Update meal with provider + create signup record
  const [updatedMeal, signup] = await prisma.$transaction([
    prisma.meal.update({
      where: { id },
      data: {
        providerId: session.user.id,
        status: "CONFIRMED",
      },
      include: {
        provider: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.mealProviderSignup.create({
      data: {
        careCircleId: meal.mealPlan.careCircleId,
        userId: session.user.id,
        date: meal.date,
        mealType: meal.mealType,
        plannedMeal: parsed.data.plannedMeal ?? meal.title,
        deliveryTime: parsed.data.deliveryTime ? new Date(parsed.data.deliveryTime) : null,
        specialInstructions: parsed.data.specialInstructions ?? null,
        status: "SIGNED_UP",
      },
    }),
  ]);

  return Response.json({ meal: updatedMeal, signup }, { status: 201 });
}
