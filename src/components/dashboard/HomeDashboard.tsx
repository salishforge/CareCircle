"use client";

import { WidgetGrid, type WidgetConfig } from "./WidgetGrid";
import { WhoIsHere } from "./WhoIsHere";
import { TodayOverview } from "./TodayOverview";
import { CheckInButton } from "./CheckInButton";
import { CalendarWidget } from "./widgets/CalendarWidget";
import { MealsWidget } from "./widgets/MealsWidget";
import { WellnessWidget } from "./widgets/WellnessWidget";
import { MedicationsWidget } from "./widgets/MedicationsWidget";
import { RequestsWidget } from "./widgets/RequestsWidget";
import { AppointmentsWidget } from "./widgets/AppointmentsWidget";
import { GratitudeWidget } from "./widgets/GratitudeWidget";
import {
  Users,
  Calendar,
  UtensilsCrossed,
  Heart,
  Pill,
  Inbox,
  CalendarDays,
  HeartHandshake,
  BarChart3,
  CheckCircle,
} from "lucide-react";

interface HomeDashboardProps {
  careCircleId: string | null;
  currentCaregiver: {
    name: string;
    image: string | null;
    phone: string | null;
    shiftEnd: string;
  } | null;
  nextCaregiver: {
    name: string;
    image: string | null;
    phone: string | null;
    shiftEnd: string;
  } | null;
  mealCounts: { planned: number; delivered: number };
  appointmentCount: number;
  pendingRequests: number;
  myShift: { id: string; shiftEnd: string; alreadyCheckedIn: boolean } | null;
}

export function HomeDashboard({
  careCircleId,
  currentCaregiver,
  nextCaregiver,
  mealCounts,
  appointmentCount,
  pendingRequests,
  myShift,
}: HomeDashboardProps) {
  const widgets: WidgetConfig[] = [
    {
      id: "checkin",
      title: "Check In",
      icon: <CheckCircle className="h-4 w-4 text-sage" />,
      defaultVisible: !!myShift,
      component: myShift ? (
        <CheckInButton
          shiftId={myShift.id}
          shiftEnd={myShift.shiftEnd}
          alreadyCheckedIn={myShift.alreadyCheckedIn}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No active shift</p>
      ),
    },
    {
      id: "who-is-here",
      title: "Who's Here",
      icon: <Users className="h-4 w-4 text-sage" />,
      defaultVisible: true,
      component: (
        <WhoIsHere
          currentCaregiver={currentCaregiver}
          nextCaregiver={nextCaregiver}
        />
      ),
    },
    {
      id: "overview",
      title: "Today's Overview",
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      defaultVisible: true,
      component: (
        <TodayOverview
          mealsPlanned={mealCounts.planned}
          mealsDelivered={mealCounts.delivered}
          appointmentsCount={appointmentCount}
          pendingRequests={pendingRequests}
        />
      ),
    },
    {
      id: "calendar",
      title: "Upcoming Shifts",
      icon: <Calendar className="h-4 w-4 text-sage-dark" />,
      defaultVisible: true,
      component: <CalendarWidget careCircleId={careCircleId} />,
    },
    {
      id: "meals",
      title: "Today's Meals",
      icon: <UtensilsCrossed className="h-4 w-4 text-amber" />,
      defaultVisible: true,
      component: <MealsWidget careCircleId={careCircleId} />,
    },
    {
      id: "medications",
      title: "Medications",
      icon: <Pill className="h-4 w-4 text-teal" />,
      defaultVisible: true,
      component: <MedicationsWidget />,
    },
    {
      id: "wellness",
      title: "Wellness",
      icon: <Heart className="h-4 w-4 text-pink-500" />,
      defaultVisible: true,
      component: <WellnessWidget />,
    },
    {
      id: "requests",
      title: "Open Requests",
      icon: <Inbox className="h-4 w-4 text-coral" />,
      defaultVisible: true,
      component: <RequestsWidget careCircleId={careCircleId} />,
    },
    {
      id: "appointments",
      title: "Appointments",
      icon: <CalendarDays className="h-4 w-4 text-amber" />,
      defaultVisible: true,
      component: <AppointmentsWidget careCircleId={careCircleId} />,
    },
    {
      id: "gratitude",
      title: "Gratitude Wall",
      icon: <HeartHandshake className="h-4 w-4 text-coral" />,
      defaultVisible: true,
      component: <GratitudeWidget careCircleId={careCircleId} />,
    },
  ];

  return <WidgetGrid widgets={widgets} />;
}
