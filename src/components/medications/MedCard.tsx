"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Pill, Clock, AlertTriangle } from "lucide-react";

interface MedCardProps {
  medication: {
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    timing: string | null;
    foodInteractions: string[];
    notes: string | null;
  };
  loggedToday: boolean;
  skippedToday: boolean;
  onLogTaken: () => void;
  onLogSkipped: () => void;
}

export function MedCard({
  medication,
  loggedToday,
  skippedToday,
  onLogTaken,
  onLogSkipped,
}: MedCardProps) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              loggedToday
                ? "bg-green-100 text-green-700"
                : skippedToday
                  ? "bg-amber-100 text-amber-700"
                  : "bg-primary/10 text-primary"
            }`}
          >
            {loggedToday ? (
              <Check className="h-5 w-5" />
            ) : (
              <Pill className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">{medication.name}</h4>
              {medication.dosage && (
                <Badge variant="secondary" className="text-[10px]">
                  {medication.dosage}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {medication.frequency && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {medication.frequency}
                </span>
              )}
              {medication.timing && (
                <span className="text-xs text-muted-foreground">
                  {medication.timing}
                </span>
              )}
            </div>

            {medication.foodInteractions.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {medication.foodInteractions.join(", ")}
              </div>
            )}

            {loggedToday && (
              <p className="text-xs text-green-600 mt-1">Taken today</p>
            )}
            {skippedToday && (
              <p className="text-xs text-amber-600 mt-1">Skipped today</p>
            )}
          </div>

          {!loggedToday && !skippedToday && (
            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0 text-red-500 hover:text-red-600"
                onClick={onLogSkipped}
                title="Skip"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onLogTaken}
                title="Taken"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
