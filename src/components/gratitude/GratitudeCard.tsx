"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { format } from "date-fns";

interface GratitudeCardProps {
  message: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string | null; image: string | null };
  };
}

export function GratitudeCard({ message }: GratitudeCardProps) {
  const initials = message.sender.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <Card className="border-coral/20 bg-coral/5">
      <CardContent className="py-4">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={message.sender.image ?? undefined} />
            <AvatarFallback className="text-xs bg-coral/20 text-coral-dark">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {message.sender.name ?? "Someone"}
              </span>
              <Heart className="h-3 w-3 text-coral fill-coral" />
            </div>
            <p className="text-sm mt-1 leading-relaxed">{message.content}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              {format(new Date(message.createdAt), "MMM d, h:mm a")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
