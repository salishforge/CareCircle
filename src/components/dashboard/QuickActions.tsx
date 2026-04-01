"use client";

import Link from "next/link";
import {
  HandHeart,
  UtensilsCrossed,
  Calendar,
  Phone,
  Heart,
  Pill,
  HeartHandshake,
  CalendarDays,
  FileText,
  Inbox,
} from "lucide-react";

const primaryActions = [
  {
    href: "/requests",
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
    href: "/wellness",
    label: "How I feel",
    icon: Heart,
    color: "bg-pink-50 text-pink-700 hover:bg-pink-100",
  },
];

const secondaryActions = [
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/gratitude", label: "Gratitude", icon: HeartHandshake },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function QuickActions() {
  return (
    <div className="space-y-3">
      {/* Primary 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {primaryActions.map((action) => {
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

      {/* Secondary row */}
      <div className="grid grid-cols-4 gap-2">
        {secondaryActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground font-medium">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
