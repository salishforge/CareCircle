"use client";

import { Phone, AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmergencyBannerProps {
  primaryContactName?: string;
  primaryContactPhone?: string;
}

export function EmergencyBanner({
  primaryContactName = "Emergency",
  primaryContactPhone = "911",
}: EmergencyBannerProps) {
  return (
    <div className="bg-coral/10 border-b border-coral/20 px-4 py-2">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-coral" />
          <span className="text-coral-dark font-medium">Emergency</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:911"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 text-coral-dark hover:bg-coral/10"
            )}
          >
            <Phone className="h-4 w-4 mr-1" />
            911
          </a>
          {primaryContactPhone !== "911" && (
            <a
              href={`tel:${primaryContactPhone}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 text-coral-dark hover:bg-coral/10"
              )}
            >
              <Phone className="h-4 w-4 mr-1" />
              {primaryContactName}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
