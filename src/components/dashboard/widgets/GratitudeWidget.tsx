"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { format } from "date-fns";

interface GratitudeMsg {
  id: string;
  content: string;
  createdAt: string;
  sender: { name: string | null };
}

export function GratitudeWidget({ careCircleId }: { careCircleId: string | null }) {
  const [messages, setMessages] = useState<GratitudeMsg[]>([]);

  useEffect(() => {
    if (!careCircleId) return;
    fetch(`/api/gratitude?careCircleId=${careCircleId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data.slice(0, 3));
      })
      .catch(() => {});
  }, [careCircleId]);

  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No gratitude messages yet</p>;
  }

  return (
    <div className="space-y-2.5">
      {messages.map((msg) => (
        <div key={msg.id} className="text-sm">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Heart className="h-3 w-3 text-coral fill-coral" />
            <span className="font-medium text-xs">{msg.sender.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(msg.createdAt), "MMM d")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
