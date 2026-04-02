"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  UtensilsCrossed,
  Stethoscope,
  MessageCircle,
  Heart,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/medications", label: "Medical", icon: Stethoscope },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/wellness", label: "Wellness", icon: Heart },
];

interface BottomBarProps {
  isAdmin: boolean;
}

export function BottomBar({ isAdmin }: BottomBarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 md:h-16 max-w-[1600px] mx-auto px-2">
        {navItems.map((item) => {
          const isActive = item.href === "/home"
            ? pathname === "/home"
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] md:text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-lg transition-colors",
            pathname.startsWith("/settings")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-5 w-5" strokeWidth={pathname.startsWith("/settings") ? 2.5 : 1.8} />
          <span className="text-[10px] md:text-xs font-medium">Settings</span>
        </Link>

        {/* Admin — only for admin/primary caregiver */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-lg transition-colors",
              pathname.startsWith("/admin")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="h-5 w-5" strokeWidth={pathname.startsWith("/admin") ? 2.5 : 1.8} />
            <span className="text-[10px] md:text-xs font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
