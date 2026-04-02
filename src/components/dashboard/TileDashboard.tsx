"use client";

import Link from "next/link";
import { WeekStrip } from "./tiles/WeekStrip";
import { MealsTile } from "./tiles/MealsTile";
import { MedicalTile } from "./tiles/MedicalTile";
import { MessagesTile } from "./tiles/MessagesTile";
import { WellnessTile } from "./tiles/WellnessTile";
import { CheckInButton } from "./CheckInButton";
import { WhoIsHere } from "./WhoIsHere";
import { Settings, Shield, Calendar } from "lucide-react";

interface TileDashboardProps {
  careCircleId: string | null;
  firstName: string;
  isAdmin: boolean;
  mealsPlanned: number;
  mealsDelivered: number;
  pendingRequests: number;
  appointmentCount: number;
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
  myShift: { id: string; shiftEnd: string; alreadyCheckedIn: boolean } | null;
}

export function TileDashboard({
  careCircleId,
  firstName,
  isAdmin,
  mealsPlanned,
  mealsDelivered,
  pendingRequests,
  appointmentCount,
  currentCaregiver,
  nextCaregiver,
  myShift,
}: TileDashboardProps) {
  return (
    <div className="py-4 xl:py-3 flex flex-col min-h-[calc(100vh-2rem)]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary tracking-tight">
            CareCircle
          </h1>
          <p className="text-sm text-muted-foreground">
            Hi{firstName ? `, ${firstName}` : ""} — here&apos;s today&apos;s overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Who's here — compact on dashboard */}
          <WhoIsHere currentCaregiver={currentCaregiver} nextCaregiver={nextCaregiver} />
        </div>
      </div>

      {/* Check-in button if on shift */}
      {myShift && (
        <div className="mb-4">
          <CheckInButton
            shiftId={myShift.id}
            shiftEnd={myShift.shiftEnd}
            alreadyCheckedIn={myShift.alreadyCheckedIn}
          />
        </div>
      )}

      {/* Week calendar strip */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            This Week
          </h2>
          <Link
            href="/calendar"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Calendar className="h-3 w-3" />
            Full Calendar
          </Link>
        </div>
        <WeekStrip careCircleId={careCircleId} />
      </div>

      {/* 4 Tile grid — stacked on mobile, 2x2 on md, 4-across on xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 flex-1">
        <MealsTile
          mealsPlanned={mealsPlanned}
          mealsDelivered={mealsDelivered}
          pendingRequests={pendingRequests}
        />
        <MedicalTile
          appointmentCount={appointmentCount}
          isAdmin={isAdmin}
        />
        <MessagesTile />
        <WellnessTile />
      </div>

      {/* Bottom bar — settings + admin */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg hover:bg-primary/10"
          >
            <Shield className="h-4 w-4" />
            Admin Portal
          </Link>
        )}
      </div>
    </div>
  );
}
