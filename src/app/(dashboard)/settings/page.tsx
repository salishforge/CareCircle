import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { DeleteAccountButton } from "@/components/settings/DeleteAccountButton";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { KioskPinSetup } from "@/components/settings/KioskPinSetup";
import Link from "next/link";
import {
  Salad,
  BarChart3,
  ArrowUpDown,
} from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{session?.user?.name || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{session?.user?.email || "Not set"}</p>
          </div>
        </CardContent>
      </Card>

      <KioskPinSetup />

      <ThemeToggle />

      <NotificationPreferences />

      {/* Quick links to advanced features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Care Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            href="/nutrition"
            className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-muted transition-colors"
          >
            <Salad className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Nutrition Profile</span>
          </Link>
          <Link
            href="/swaps"
            className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Shift Swaps</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Care Reports</span>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <SignOutButton />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
