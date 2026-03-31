import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek } from "date-fns";
import { UtensilsCrossed } from "lucide-react";
import { MealPlanView } from "@/components/meals/MealPlanView";
import { getActiveCareCircle } from "@/lib/queries/dashboard";

export default async function MealsPage() {
  const session = await auth();
  const membership = session?.user?.id
    ? await getActiveCareCircle(session.user.id)
    : null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

  const mealPlan = membership?.careCircleId
    ? await prisma.mealPlan.findFirst({
        where: {
          careCircleId: membership.careCircleId,
          weekStartDate: weekStart,
          status: { in: ["ACTIVE", "DRAFT"] },
        },
        include: {
          meals: {
            include: {
              provider: { select: { id: true, name: true, image: true } },
            },
            orderBy: [{ date: "asc" }, { mealType: "asc" }],
          },
        },
      })
    : null;

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Meal Planner</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This week&apos;s meals and nutrition
        </p>
      </div>

      {mealPlan && mealPlan.meals.length > 0 ? (
        <MealPlanView meals={mealPlan.meals} weekStart={weekStart} />
      ) : (
        <div className="text-center py-16">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No meals planned this week yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ask the circle coordinator to add meals, or use the chat assistant.
          </p>
        </div>
      )}
    </div>
  );
}
