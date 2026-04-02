"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Bell, HeartHandshake, Send } from "lucide-react";
import Link from "next/link";

const tabs = [
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "gratitude", label: "Gratitude", icon: HeartHandshake },
  { id: "chat", label: "Chat", icon: Send },
] as const;

type Tab = (typeof tabs)[number]["id"];

export function MessagesTile() {
  const [activeTab, setActiveTab] = useState<Tab>("notifications");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications?unread=true&limit=1")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Messages
          {unreadCount > 0 && (
            <Badge className="bg-coral text-white text-[10px] h-5">{unreadCount}</Badge>
          )}
        </CardTitle>
        <div className="flex gap-1 mt-2">
          {tabs.map((tab) => {
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
        {activeTab === "notifications" && (
          <div>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
            <Link href="/home" className="block text-xs text-primary hover:underline mt-2">
              View notifications →
            </Link>
          </div>
        )}
        {activeTab === "gratitude" && (
          <div>
            <p className="text-sm text-muted-foreground">Share appreciation with your care team</p>
            <Link href="/gratitude" className="block text-xs text-primary hover:underline mt-2">
              View gratitude wall →
            </Link>
          </div>
        )}
        {activeTab === "chat" && (
          <div>
            <p className="text-sm text-muted-foreground">Ask the care assistant anything</p>
            <Link href="/chat" className="block text-xs text-primary hover:underline mt-2">
              Open chat →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
