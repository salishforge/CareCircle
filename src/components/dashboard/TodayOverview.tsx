"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, CalendarClock, ClipboardList } from "lucide-react";

interface TodayOverviewProps {
  mealsPlanned: number;
  mealsDelivered: number;
  appointmentsCount: number;
  pendingRequests: number;
}

export function TodayOverview({
  mealsPlanned = 0,
  mealsDelivered = 0,
  appointmentsCount = 0,
  pendingRequests = 0,
}: TodayOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Today at a Glance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-amber" />
            <span className="text-sm">Meals</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {mealsDelivered}/{mealsPlanned} served
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-sage" />
            <span className="text-sm">Appointments</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {appointmentsCount} today
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-coral" />
            <span className="text-sm">Requests</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {pendingRequests} pending
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
