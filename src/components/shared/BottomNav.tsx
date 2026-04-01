"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  UtensilsCrossed,
  MessageCircle,
  MoreHorizontal,
  Heart,
  Pill,
  CalendarDays,
  HeartHandshake,
  FileText,
  Inbox,
  BarChart3,
  Salad,
  ArrowUpDown,
  ShoppingCart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const moreItems = [
  { href: "/wellness", label: "Wellness", icon: Heart, color: "text-pink-600" },
  { href: "/medications", label: "Medications", icon: Pill, color: "text-teal-600" },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, color: "text-amber-600" },
  { href: "/requests", label: "Requests", icon: Inbox, color: "text-coral" },
  { href: "/lists", label: "Shopping", icon: ShoppingCart, color: "text-sage-dark" },
  { href: "/gratitude", label: "Gratitude", icon: HeartHandshake, color: "text-coral" },
  { href: "/documents", label: "Documents", icon: FileText, color: "text-muted-foreground" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "text-primary" },
  { href: "/nutrition", label: "Nutrition", icon: Salad, color: "text-sage-dark" },
  { href: "/swaps", label: "Swaps", icon: ArrowUpDown, color: "text-amber-600" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold">All Features</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 px-3 pb-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors min-h-[64px]",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : item.color)} />
                    <span className="text-[11px] font-medium leading-tight text-center">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          {primaryNav.map((item) => {
            const isActive =
              item.href === "/home"
                ? pathname === "/home"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] rounded-lg transition-colors",
              moreActive || moreOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="More features"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive ? 2.5 : 2} />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
