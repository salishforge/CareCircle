"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  UtensilsCrossed,
  MessageCircle,
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
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";

const mainNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const careNav = [
  { href: "/wellness", label: "Wellness", icon: Heart },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/requests", label: "Requests", icon: Inbox },
  { href: "/lists", label: "Shopping", icon: ShoppingCart },
  { href: "/gratitude", label: "Gratitude", icon: HeartHandshake },
  { href: "/documents", label: "Documents", icon: FileText },
];

const adminNav = [
  { href: "/admin", label: "User Management", icon: Shield },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/swaps", label: "Shift Swaps", icon: ArrowUpDown },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }) {
  const pathname = usePathname();
  const isActive = href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SideNav() {
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 xl:w-64 border-r border-border bg-card h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-border flex-shrink-0">
        <span className="text-lg font-bold text-primary tracking-tight">CareCircle</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Care
          </p>
          <div className="space-y-1">
            {careNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Manage
          </p>
          <div className="space-y-1">
            {adminNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border p-3 flex-shrink-0 space-y-1">
        <div className="flex items-center gap-2 px-3 py-1">
          <NotificationBell />
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-1"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
