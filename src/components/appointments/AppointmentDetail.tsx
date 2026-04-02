"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MapPin,
  Car,
  Phone,
  Mail,
  Stethoscope,
  Brain,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface AppointmentDetailProps {
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
      email: string | null;
      image: string | null;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_CONFIG: Record<string, { icon: typeof Stethoscope; color: string; label: string }> = {
  MEDICAL: { icon: Stethoscope, color: "bg-blue-100 text-blue-700", label: "Medical" },
  THERAPY: { icon: Brain, color: "bg-purple-100 text-purple-700", label: "Therapy" },
  OTHER: { icon: MoreHorizontal, color: "bg-gray-100 text-gray-700", label: "Other" },
};

function ContactCard({
  label,
  name,
  phone,
  email,
  image,
}: {
  label: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  image: string | null;
}) {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="border border-border rounded-xl p-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={image ?? undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{name ?? "Unknown"}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Phone className="h-3 w-3" />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Mail className="h-3 w-3" />
                {email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentDetail({ appointment, open, onOpenChange }: AppointmentDetailProps) {
  if (!appointment) return null;

  const config = TYPE_CONFIG[appointment.type] ?? TYPE_CONFIG.OTHER;
  const TypeIcon = config.icon;
  const dt = new Date(appointment.dateTime);
  const endTime = new Date(dt.getTime() + appointment.duration * 60 * 1000);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">{appointment.title}</SheetTitle>
            <Badge className={`${config.color}`} variant="secondary">
              <TypeIcon className="h-3 w-3 mr-0.5" />
              {config.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="font-medium">{format(dt, "EEEE, MMMM d, yyyy")}</p>
              <p className="text-muted-foreground">
                {format(dt, "h:mm a")} – {format(endTime, "h:mm a")} ({appointment.duration} min)
              </p>
            </div>
          </div>

          {/* Location */}
          {appointment.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p>{appointment.location}</p>
            </div>
          )}

          {/* Description */}
          {appointment.description && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">{appointment.description}</p>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{appointment.notes}</p>
            </div>
          )}

          {/* Transportation */}
          {appointment.transportationNeeded && (
            <div className="flex items-center gap-3 text-sm">
              <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {appointment.transportationVolunteer ? (
                <span className="text-green-600">
                  Ride by {appointment.transportationVolunteer.name}
                </span>
              ) : (
                <span className="text-amber-600">Transportation needed — no volunteer yet</span>
              )}
            </div>
          )}

          {/* Transportation Volunteer Contact */}
          {appointment.transportationVolunteer && (
            <ContactCard
              label="Transportation Volunteer"
              name={appointment.transportationVolunteer.name}
              phone={appointment.transportationVolunteer.phone}
              email={appointment.transportationVolunteer.email}
              image={appointment.transportationVolunteer.image}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
