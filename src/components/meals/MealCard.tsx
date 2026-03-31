"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Flame, Dumbbell, AlertTriangle, CheckCircle, UserPlus } from "lucide-react";

interface MealCardProps {
  meal: {
    id: string;
    title: string;
    description?: string | null;
    calories?: number | null;
    proteinGrams?: number | null;
    specialNotes?: string | null;
    status: string;
    mealType: string;
    allergenFlags?: unknown;
    interactionFlags?: unknown;
    provider?: { id: string; name: string | null; image: string | null } | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-amber/10 border-amber/30 text-amber-dark",
  CONFIRMED: "bg-sage/10 border-sage/30 text-sage-dark",
  DELIVERED: "bg-teal/10 border-teal/30 text-teal-dark",
  SKIPPED: "bg-muted border-border text-muted-foreground",
};

export function MealCard({ meal }: MealCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const allergens = Array.isArray(meal.allergenFlags) ? (meal.allergenFlags as string[]) : [];
  const interactions = Array.isArray(meal.interactionFlags)
    ? (meal.interactionFlags as string[])
    : [];
  const hasWarnings = allergens.length > 0 || interactions.length > 0;

  async function handleSignUp() {
    setLoading(true);
    const res = await fetch(`/api/meals/${meal.id}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Card
            className={`cursor-pointer border ${STATUS_COLORS[meal.status] ?? STATUS_COLORS.PLANNED} transition-opacity hover:opacity-80`}
          />
        }
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{meal.title}</p>
              {meal.provider && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={meal.provider.image ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {meal.provider.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {meal.provider.name}
                  </span>
                </div>
              )}
            </div>
            {hasWarnings && (
              <AlertTriangle className="h-4 w-4 text-coral flex-shrink-0 mt-0.5" />
            )}
          </div>
        </CardContent>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader className="pb-4">
          <SheetTitle>{meal.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {meal.description && (
            <p className="text-sm text-muted-foreground">{meal.description}</p>
          )}

          {/* Nutrition */}
          {(meal.calories || meal.proteinGrams) && (
            <div className="flex gap-4">
              {meal.calories && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Flame className="h-4 w-4 text-coral" />
                  <span>{meal.calories} cal</span>
                </div>
              )}
              {meal.proteinGrams && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <span>{meal.proteinGrams}g protein</span>
                </div>
              )}
            </div>
          )}

          {/* Provider */}
          {meal.provider ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-sage/5 border border-sage/20">
              <CheckCircle className="h-4 w-4 text-sage flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Provided by {meal.provider.name}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {meal.status.toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              onClick={handleSignUp}
              disabled={loading}
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Signing up..." : "Sign up to bring this meal"}
            </Button>
          )}

          {/* Warnings */}
          {allergens.length > 0 && (
            <div className="p-3 rounded-lg bg-coral/5 border border-coral/20">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-4 w-4 text-coral" />
                <span className="text-sm font-medium text-coral">Allergen flags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {allergens.map((a) => (
                  <Badge key={a} variant="outline" className="text-xs border-coral/30 text-coral">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {interactions.length > 0 && (
            <div className="p-3 rounded-lg bg-amber/5 border border-amber/20">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber" />
                <span className="text-sm font-medium text-amber-dark">Drug interactions</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {interactions.map((i) => (
                  <Badge key={i} variant="outline" className="text-xs border-amber/30 text-amber-dark">
                    {i}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {meal.specialNotes && (
            <p className="text-sm text-muted-foreground italic">{meal.specialNotes}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
