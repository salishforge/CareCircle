"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Inbox, ShoppingCart, Salad } from "lucide-react";
import Link from "next/link";

const tabs = [
  { id: "meals", label: "Today", icon: UtensilsCrossed },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "shopping", label: "Shopping", icon: ShoppingCart },
  { id: "nutrition", label: "Nutrition", icon: Salad },
] as const;

type Tab = (typeof tabs)[number]["id"];

interface MealsTileProps {
  mealsPlanned: number;
  mealsDelivered: number;
  pendingRequests: number;
}

export function MealsTile({ mealsPlanned, mealsDelivered, pendingRequests }: MealsTileProps) {
  const [activeTab, setActiveTab] = useState<Tab>("meals");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-amber" />
          Meals
          {pendingRequests > 0 && (
            <Badge className="bg-coral text-white text-[10px] h-5">{pendingRequests}</Badge>
          )}
        </CardTitle>
        {/* Sub-tabs */}
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
        {activeTab === "meals" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Planned</span>
              <span className="font-semibold">{mealsPlanned}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivered</span>
              <span className="font-semibold text-green-600">{mealsDelivered}</span>
            </div>
            <Link href="/meals" className="block text-xs text-primary hover:underline mt-2">
              View meal plan →
            </Link>
          </div>
        )}
        {activeTab === "requests" && (
          <div>
            <p className="text-sm text-muted-foreground">
              {pendingRequests > 0 ? `${pendingRequests} open requests` : "No open requests"}
            </p>
            <Link href="/requests" className="block text-xs text-primary hover:underline mt-2">
              View all requests →
            </Link>
          </div>
        )}
        {activeTab === "shopping" && (
          <div>
            <p className="text-sm text-muted-foreground">Shopping lists and supplies</p>
            <Link href="/lists" className="block text-xs text-primary hover:underline mt-2">
              View shopping lists →
            </Link>
          </div>
        )}
        {activeTab === "nutrition" && (
          <div>
            <p className="text-sm text-muted-foreground">Dietary needs and targets</p>
            <Link href="/nutrition" className="block text-xs text-primary hover:underline mt-2">
              View nutrition profile →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
