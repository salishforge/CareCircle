"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Pill, CalendarDays, FileText, Clock } from "lucide-react";
import Link from "next/link";

const tabs = [
  { id: "meds", label: "Medications", icon: Pill },
  { id: "schedule", label: "Schedule", icon: Clock },
  { id: "appointments", label: "Appts", icon: CalendarDays },
  { id: "documents", label: "Docs", icon: FileText },
] as const;

type Tab = (typeof tabs)[number]["id"];

interface MedicalTileProps {
  appointmentCount: number;
  isAdmin: boolean;
}

export function MedicalTile({ appointmentCount, isAdmin }: MedicalTileProps) {
  const [activeTab, setActiveTab] = useState<Tab>("meds");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-teal" />
          Medical
          {appointmentCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5">{appointmentCount} appt{appointmentCount !== 1 && "s"}</Badge>
          )}
        </CardTitle>
        <div className="flex gap-1 mt-2">
          {tabs.map((tab) => {
            // Documents only for admins
            if (tab.id === "documents" && !isAdmin) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {activeTab === "meds" && (
          <div>
            <p className="text-sm text-muted-foreground">Track and log daily medications</p>
            <Link href="/medications" className="block text-xs text-primary hover:underline mt-2">
              View medications →
            </Link>
          </div>
        )}
        {activeTab === "schedule" && (
          <div>
            <p className="text-sm text-muted-foreground">Medication timing and reminders</p>
            <Link href="/medications" className="block text-xs text-primary hover:underline mt-2">
              View schedule →
            </Link>
          </div>
        )}
        {activeTab === "appointments" && (
          <div>
            <p className="text-sm text-muted-foreground">
              {appointmentCount > 0 ? `${appointmentCount} upcoming` : "No upcoming appointments"}
            </p>
            <Link href="/appointments" className="block text-xs text-primary hover:underline mt-2">
              View appointments →
            </Link>
          </div>
        )}
        {activeTab === "documents" && (
          <div>
            <p className="text-sm text-muted-foreground">Insurance, directives, lab results</p>
            <Link href="/documents" className="block text-xs text-primary hover:underline mt-2">
              View documents →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
