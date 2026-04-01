"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UtensilsCrossed,
  Calendar,
  Car,
  ShoppingBag,
  CircleDot,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface RequestCardProps {
  request: {
    id: string;
    type: string;
    description: string;
    priority: string;
    status: string;
    notes: string | null;
    createdAt: string;
    patient: { id: string; name: string | null; image: string | null };
    assignedTo: { id: string; name: string | null; image: string | null } | null;
  };
  onClaim: () => void;
  onFulfill: () => void;
}

const TYPE_ICONS: Record<string, typeof CircleDot> = {
  MEAL: UtensilsCrossed,
  SCHEDULE: Calendar,
  TRANSPORT: Car,
  SUPPLY: ShoppingBag,
  OTHER: CircleDot,
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  NORMAL: "bg-blue-100 text-blue-700",
  URGENT: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  FULFILLED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export function RequestCard({ request, onClaim, onFulfill }: RequestCardProps) {
  const TypeIcon = TYPE_ICONS[request.type] ?? CircleDot;
  const initials = request.patient.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?";

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={request.patient.image ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[10px] ${PRIORITY_COLORS[request.priority] ?? ""}`} variant="secondary">
                {request.priority}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                <TypeIcon className="h-3 w-3 mr-0.5" />
                {request.type}
              </Badge>
              <Badge className={`text-[10px] ${STATUS_COLORS[request.status] ?? ""}`} variant="secondary">
                {request.status === "IN_PROGRESS" ? "In Progress" : request.status}
              </Badge>
            </div>

            <p className="text-sm mt-1.5 leading-relaxed">{request.description}</p>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(request.createdAt), "MMM d, h:mm a")}
              </span>
              {request.assignedTo && (
                <span className="text-[10px] text-muted-foreground">
                  Assigned to {request.assignedTo.name}
                </span>
              )}
            </div>

            {/* Actions */}
            {request.status === "OPEN" && (
              <div className="mt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onClaim}>
                  I&apos;ll handle this
                </Button>
              </div>
            )}
            {request.status === "IN_PROGRESS" && (
              <div className="mt-2">
                <Button size="sm" className="h-7 text-xs" onClick={onFulfill}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark fulfilled
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
