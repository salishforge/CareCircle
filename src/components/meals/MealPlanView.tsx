import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { MealCard } from "./MealCard";
import { UtensilsCrossed } from "lucide-react";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

interface Meal {
  id: string;
  date: string | Date;
  mealType: string;
  title: string;
  description?: string | null;
  calories?: number | null;
  proteinGrams?: number | null;
  specialNotes?: string | null;
  status: string;
  allergenFlags?: unknown;
  interactionFlags?: unknown;
  provider?: { id: string; name: string | null; image: string | null } | null;
}

interface MealPlanViewProps {
  meals: Meal[];
  weekStart: Date;
}

export function MealPlanView({ meals, weekStart }: MealPlanViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const dayMeals = meals.filter((m) => isSameDay(new Date(m.date), day));
        const todayClass = isToday(day) ? "border-primary" : "border-border";

        return (
          <div key={day.toISOString()} className={`rounded-xl border-2 ${todayClass} overflow-hidden`}>
            {/* Day header */}
            <div
              className={`px-4 py-2 text-sm font-semibold ${
                isToday(day) ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {isToday(day) ? "Today — " : ""}
              {format(day, "EEEE, MMM d")}
            </div>

            {/* Meal slots */}
            <div className="divide-y divide-border">
              {MEAL_TYPES.map((type) => {
                const meal = dayMeals.find((m) => m.mealType === type);
                return (
                  <div key={type} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xs font-medium text-muted-foreground w-20 pt-1 flex-shrink-0">
                      {MEAL_LABELS[type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      {meal ? (
                        <MealCard meal={meal} />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                          <UtensilsCrossed className="h-3.5 w-3.5 opacity-40" />
                          <span className="text-xs">Not planned</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
