"use client";

import Link from "next/link";
import { HandHeart, UtensilsCrossed, Calendar, Phone } from "lucide-react";

const actions = [
  {
    href: "/chat",
    label: "I need something",
    icon: HandHeart,
    color: "bg-coral/10 text-coral-dark hover:bg-coral/20",
  },
  {
    href: "/meals",
    label: "Today's meals",
    icon: UtensilsCrossed,
    color: "bg-amber/10 text-amber-dark hover:bg-amber/20",
  },
  {
    href: "/calendar",
    label: "My schedule",
    icon: Calendar,
    color: "bg-sage/10 text-sage-dark hover:bg-sage/20",
  },
  {
    href: "#call",
    label: "Call caregiver",
    icon: Phone,
    color: "bg-teal/10 text-teal-dark hover:bg-teal/20",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl min-h-[88px] transition-colors ${action.color}`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium text-center leading-tight">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
