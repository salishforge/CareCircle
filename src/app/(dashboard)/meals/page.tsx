"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

export default function MealsPage() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Meal Planner</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This week&apos;s meals and nutrition
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              No meal plan yet for this week.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Let&apos;s get some nourishing meals planned!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
