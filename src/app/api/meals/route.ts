import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireCircleMembership } from "@/lib/auth-utils";
import { z } from "zod";
import { startOfWeek } from "date-fns";

const createMealSchema = z.object({
  careCircleId: z.string(),
  date: z.string(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  title: z.string().min(1),
  description: z.string().optional(),
  calories: z.number().int().positive().optional(),
  proteinGrams: z.number().int().positive().optional(),
  specialNotes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const careCircleId = searchParams.get("careCircleId");
  const weekOf = searchParams.get("weekOf");

  if (!careCircleId) {
    return Response.json({ error: "careCircleId required" }, { status: 400 });
  }

  const membershipError = await requireCircleMembership(session.user.id, careCircleId);
  if (membershipError) return membershipError;

  const refDate = weekOf ? new Date(weekOf) : new Date();
  const weekStart = startOfWeek(refDate, { weekStartsOn: 0 });

  // Get or create the active meal plan for this week
  let mealPlan = await prisma.mealPlan.findFirst({
    where: { careCircleId, weekStartDate: weekStart, status: { in: ["ACTIVE", "DRAFT"] } },
    include: {
      meals: {
        include: {
          provider: { select: { id: true, name: true, image: true } },
        },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
      },
    },
  });

  return Response.json(mealPlan);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createMealSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { careCircleId, date, mealType, title, description, calories, proteinGrams, specialNotes } =
    parsed.data;

  const membershipError = await requireCircleMembership(session.user.id, careCircleId);
  if (membershipError) return membershipError;

  const mealDate = new Date(date);
  const weekStart = startOfWeek(mealDate, { weekStartsOn: 0 });

  // Get or create meal plan for the week
  let mealPlan = await prisma.mealPlan.findFirst({
    where: { careCircleId, weekStartDate: weekStart },
  });

  if (!mealPlan) {
    mealPlan = await prisma.mealPlan.create({
      data: {
        careCircleId,
        weekStartDate: weekStart,
        createdById: session.user.id,
        status: "ACTIVE",
      },
    });
  }

  const meal = await prisma.meal.create({
    data: {
      mealPlanId: mealPlan.id,
      date: mealDate,
      mealType,
      title,
      description: description ?? null,
      calories: calories ?? null,
      proteinGrams: proteinGrams ?? null,
      specialNotes: specialNotes ?? null,
      status: "PLANNED",
    },
    include: {
      provider: { select: { id: true, name: true, image: true } },
    },
  });

  return Response.json(meal, { status: 201 });
}
