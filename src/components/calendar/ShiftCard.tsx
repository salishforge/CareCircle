"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UserPlus } from "lucide-react";

interface ShiftCardProps {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  primaryCaregiver?: {
    name: string;
    image?: string | null;
  } | null;
  alternateCaregiver?: {
    name: string;
    image?: string | null;
  } | null;
  onSignUp?: (shiftId: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusStyles: Record<string, string> = {
  OPEN: "border-amber/40 bg-amber/5",
  CLAIMED: "border-sage/30 bg-sage/5",
  CONFIRMED: "border-sage/40 bg-sage/10",
  IN_PROGRESS: "border-teal/40 bg-teal/10",
  COMPLETED: "border-border bg-muted/50",
  MISSED: "border-coral/40 bg-coral/10",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  CLAIMED: "Claimed",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "Active",
  COMPLETED: "Done",
  MISSED: "Missed",
};

export function ShiftCard({
  id,
  startTime,
  endTime,
  status,
  primaryCaregiver,
  alternateCaregiver,
  onSignUp,
}: ShiftCardProps) {
  const timeRange = `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`;
  const isOpen = status === "OPEN";

  return (
    <div
      className={cn(
        "border rounded-xl p-3 transition-colors",
        statusStyles[status] || "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{timeRange}</span>
        <Badge
          variant="secondary"
          className={cn(
            "text-xs",
            isOpen && "bg-amber/20 text-amber-dark"
          )}
        >
          {statusLabels[status] || status}
        </Badge>
      </div>

      {isOpen ? (
        <Button
          variant="outline"
          className="w-full h-11 border-dashed border-amber/40 text-amber-dark hover:bg-amber/10"
          onClick={() => onSignUp?.(id)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Sign up for this shift
        </Button>
      ) : (
        <div className="space-y-2">
          {primaryCaregiver && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={primaryCaregiver.image ?? undefined} />
                <AvatarFallback className="bg-sage text-white text-xs">
                  {getInitials(primaryCaregiver.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{primaryCaregiver.name}</span>
            </div>
          )}
          {alternateCaregiver && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={alternateCaregiver.image ?? undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {getInitials(alternateCaregiver.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Backup: {alternateCaregiver.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
