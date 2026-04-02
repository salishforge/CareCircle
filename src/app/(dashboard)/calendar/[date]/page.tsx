"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppointmentDetail } from "@/components/appointments/AppointmentDetail";
import { AddEventSheet } from "@/components/calendar/AddEventSheet";
import {
  ArrowLeft,
  Clock,
  UtensilsCrossed,
  CalendarDays,
  Loader2,
  Phone,
  MapPin,
  Plus,
  Stethoscope,
  Brain,
  MoreHorizontal,
} from "lucide-react";

interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  primaryCaregiver: { id: string; name: string | null; image: string | null; phone: string | null; email: string | null } | null;
  alternateCaregiver: { id: string; name: string | null; image: string | null; phone: string | null; email: string | null } | null;
}

interface Meal {
  id: string;
  mealType: string;
  title: string;
  description: string | null;
  calories: number | null;
  proteinGrams: number | null;
  status: string;
  provider: { id: string; name: string | null; image: string | null } | null;
}

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  dateTime: string;
  duration: number;
  type: string;
  transportationNeeded: boolean;
  notes: string | null;
  transportationVolunteer: { id: string; name: string | null; phone: string | null; email: string | null; image: string | null } | null;
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

const MEAL_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-amber/20 text-amber-dark",
  CLAIMED: "bg-sage/10 text-sage-dark",
  CONFIRMED: "bg-sage/20 text-sage-dark",
  IN_PROGRESS: "bg-teal/20 text-teal-dark",
  COMPLETED: "bg-muted text-muted-foreground",
  MISSED: "bg-coral/20 text-coral-dark",
};

const TYPE_ICONS: Record<string, typeof Stethoscope> = {
  MEDICAL: Stethoscope,
  THERAPY: Brain,
  OTHER: MoreHorizontal,
};

export default function DayDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date: dateStr } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) {
          setCareCircleId(data[0].careCircleId);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadData = useCallback(async () => {
    if (!careCircleId) return;
    try {
      const res = await fetch(`/api/calendar/${dateStr}?careCircleId=${careCircleId}`);
      const data = await res.json();
      setShifts(data.shifts ?? []);
      setMeals(data.meals ?? []);
      setAppointments(data.appointments ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [careCircleId, dateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const date = new Date(dateStr + "T12:00:00");
  const sortedMeals = [...meals].sort(
    (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/calendar")}
          className="h-10 w-10 flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to calendar</span>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{format(date, "EEEE")}</h2>
          <p className="text-muted-foreground text-sm">{format(date, "MMMM d, yyyy")}</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Shifts */}
      {/* Three sections — stacked on mobile, side-by-side on kiosk */}
      <div className="space-y-6 xl:grid xl:grid-cols-3 xl:gap-6 xl:space-y-0">

      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Shifts ({shifts.length})
        </h3>
        {shifts.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No shifts scheduled
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {shifts.map((shift) => {
              const initials = shift.primaryCaregiver?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) ?? "?";
              return (
                <Card key={shift.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={shift.primaryCaregiver?.image ?? undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {shift.primaryCaregiver?.name ?? "Open Shift"}
                          </span>
                          <Badge variant="secondary" className={`text-[10px] ${STATUS_STYLES[shift.status] ?? ""}`}>
                            {shift.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(shift.startTime), "h:mm a")} – {format(new Date(shift.endTime), "h:mm a")}
                        </p>
                        {shift.primaryCaregiver?.phone && (
                          <a
                            href={`tel:${shift.primaryCaregiver.phone}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          >
                            <Phone className="h-3 w-3" />
                            {shift.primaryCaregiver.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Meals */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4" />
          Meals ({sortedMeals.length})
        </h3>
        {sortedMeals.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No meals planned
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedMeals.map((meal) => (
              <Card key={meal.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-muted-foreground w-16 pt-0.5 flex-shrink-0">
                      {MEAL_LABELS[meal.mealType] ?? meal.mealType}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{meal.title}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            meal.status === "DELIVERED" ? "bg-green-100 text-green-700" : ""
                          }`}
                        >
                          {meal.status}
                        </Badge>
                      </div>
                      {(meal.calories || meal.proteinGrams) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {meal.calories && `${meal.calories} cal`}
                          {meal.calories && meal.proteinGrams && " · "}
                          {meal.proteinGrams && `${meal.proteinGrams}g protein`}
                        </p>
                      )}
                      {meal.provider && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          By {meal.provider.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Appointments */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Appointments ({appointments.length})
        </h3>
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No appointments
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => {
              const TypeIcon = TYPE_ICONS[appt.type] ?? MoreHorizontal;
              return (
                <Card
                  key={appt.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedAppt(appt)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{appt.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(appt.dateTime), "h:mm a")} · {appt.duration} min
                          {appt.location && (
                            <span className="inline-flex items-center gap-0.5 ml-2">
                              <MapPin className="h-3 w-3" />
                              {appt.location}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      </div>{/* end grid */}

      {/* Appointment detail sheet */}
      <AppointmentDetail
        appointment={selectedAppt}
        open={!!selectedAppt}
        onOpenChange={(open) => !open && setSelectedAppt(null)}
      />

      {/* Add event sheet */}
      <AddEventSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        date={dateStr}
        careCircleId={careCircleId}
        onCreated={loadData}
      />
    </div>
  );
}
