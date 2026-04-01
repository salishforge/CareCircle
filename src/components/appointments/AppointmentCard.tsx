"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Car, Stethoscope, Brain, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

interface AppointmentCardProps {
  appointment: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    dateTime: string;
    duration: number;
    type: string;
    transportationNeeded: boolean;
    notes: string | null;
    transportationVolunteer: {
      id: string;
      name: string | null;
      phone: string | null;
    } | null;
  };
  onVolunteer: () => void;
}

const TYPE_CONFIG: Record<string, { icon: typeof Stethoscope; color: string; label: string }> = {
  MEDICAL: { icon: Stethoscope, color: "bg-blue-100 text-blue-700", label: "Medical" },
  THERAPY: { icon: Brain, color: "bg-purple-100 text-purple-700", label: "Therapy" },
  OTHER: { icon: MoreHorizontal, color: "bg-gray-100 text-gray-700", label: "Other" },
};

export function AppointmentCard({ appointment, onVolunteer }: AppointmentCardProps) {
  const config = TYPE_CONFIG[appointment.type] ?? TYPE_CONFIG.OTHER;
  const TypeIcon = config.icon;
  const dt = new Date(appointment.dateTime);

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex gap-3">
          {/* Date block */}
          <div className="flex-shrink-0 w-14 text-center">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              {format(dt, "MMM")}
            </div>
            <div className="text-2xl font-bold">{format(dt, "d")}</div>
            <div className="text-xs text-muted-foreground">{format(dt, "EEE")}</div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">{appointment.title}</h4>
              <Badge className={`text-[10px] ${config.color}`} variant="secondary">
                <TypeIcon className="h-3 w-3 mr-0.5" />
                {config.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(dt, "h:mm a")} ({appointment.duration}min)
              </span>
              {appointment.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {appointment.location}
                </span>
              )}
            </div>

            {appointment.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {appointment.description}
              </p>
            )}

            {/* Transportation */}
            {appointment.transportationNeeded && (
              <div className="mt-2">
                {appointment.transportationVolunteer ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <Car className="h-3.5 w-3.5" />
                    Ride by {appointment.transportationVolunteer.name}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={onVolunteer}
                  >
                    <Car className="h-3 w-3 mr-1" />
                    Volunteer to drive
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
