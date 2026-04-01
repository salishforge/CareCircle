"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface Meal {
  id: string;
  mealType: string;
  title: string;
  status: string;
}

const typeLabels: Record<string, string> = {
  BREAKFAST: "Bkfst",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

export function MealsWidget({ careCircleId }: { careCircleId: string | null }) {
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    if (!careCircleId) return;
    fetch(`/api/meals?careCircleId=${careCircleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.meals) {
          // Filter to today
          const today = new Date().toISOString().split("T")[0];
          const todayMeals = data.meals.filter((m: { date: string }) =>
            m.date.startsWith(today)
          );
          setMeals(todayMeals);
        }
      })
      .catch(() => {});
  }, [careCircleId]);

  if (meals.length === 0) {
    return <p className="text-sm text-muted-foreground">No meals planned today</p>;
  }

  return (
    <div className="space-y-2">
      {meals.map((meal) => (
        <div key={meal.id} className="flex items-center gap-2 text-sm">
          <span className="text-xs text-muted-foreground w-12 flex-shrink-0">
            {typeLabels[meal.mealType] ?? meal.mealType}
          </span>
          <span className="flex-1 truncate">{meal.title}</span>
          <Badge
            variant="secondary"
            className={`text-[10px] ${
              meal.status === "DELIVERED"
                ? "bg-green-100 text-green-700"
                : ""
            }`}
          >
            {meal.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
