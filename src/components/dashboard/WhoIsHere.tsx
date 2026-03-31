"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Clock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CaregiverInfo {
  name: string;
  image?: string | null;
  phone?: string | null;
  shiftEnd: string;
}

interface WhoIsHereProps {
  currentCaregiver?: CaregiverInfo | null;
  nextCaregiver?: CaregiverInfo | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function WhoIsHere({ currentCaregiver, nextCaregiver }: WhoIsHereProps) {
  if (!currentCaregiver) {
    return (
      <Card className="border-amber/30 bg-amber/5">
        <CardContent className="py-4">
          <div className="text-center">
            <p className="text-amber-dark font-semibold">
              No one is currently checked in
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {nextCaregiver
                ? `${nextCaregiver.name} is coming next`
                : "No upcoming shifts scheduled"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sage/30 bg-sage/5">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={currentCaregiver.image ?? undefined} />
            <AvatarFallback className="bg-sage text-white text-lg">
              {getInitials(currentCaregiver.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">
              {currentCaregiver.name}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Here until {currentCaregiver.shiftEnd}</span>
            </div>
            {nextCaregiver && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Next: {nextCaregiver.name}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {currentCaregiver.phone && (
              <>
                <a
                  href={`tel:${currentCaregiver.phone}`}
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-10 w-10")}
                >
                  <Phone className="h-4 w-4" />
                  <span className="sr-only">Call {currentCaregiver.name}</span>
                </a>
                <a
                  href={`sms:${currentCaregiver.phone}`}
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-10 w-10")}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="sr-only">Text {currentCaregiver.name}</span>
                </a>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
