"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Shield,
  UserPlus,
  Lock,
  Unlock,
  UserX,
  Loader2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  memberId: string;
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  userRole: string;
  circleRole: string;
  isActive: boolean;
  isLocked: boolean;
  joinedAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PRIMARY_CAREGIVER: "Primary Caregiver",
  CAREGIVER: "Caregiver",
  MEAL_PROVIDER: "Meal Provider",
  PATIENT: "Patient",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary",
  PRIMARY_CAREGIVER: "bg-sage/20 text-sage-dark",
  CAREGIVER: "bg-teal/10 text-teal-dark",
  MEAL_PROVIDER: "bg-amber/20 text-amber-dark",
  PATIENT: "bg-coral/10 text-coral-dark",
};

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add member form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("CAREGIVER");

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
          phone: newPhone || undefined,
          role: newRole,
        }),
      });
      if (res.ok) {
        setNewEmail("");
        setNewName("");
        setNewPassword("");
        setNewPhone("");
        setNewRole("CAREGIVER");
        setAddOpen(false);
        toast.success("Member added");
        await loadMembers();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to add member");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success("Role updated");
      await loadMembers();
    } else {
      toast.error("Failed to update role");
    }
  }

  async function handleToggleLock(userId: string, currentlyLocked: boolean) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !currentlyLocked }),
    });
    if (res.ok) {
      toast.success(currentlyLocked ? "Account unlocked" : "Account locked");
      await loadMembers();
    } else {
      toast.error("Failed to update");
    }
  }

  async function handleRemove(userId: string, name: string | null) {
    if (!confirm(`Remove ${name ?? "this user"} from the care circle?`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Member removed");
      await loadMembers();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to remove");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            User Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage care circle members and permissions
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>

      {/* Member list */}
      <div className="space-y-3">
        {members.map((member) => {
          const initials = member.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ?? "?";

          return (
            <Card key={member.memberId} className={!member.isActive ? "opacity-50" : ""}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={member.image ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {member.name ?? "Unknown"}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${ROLE_COLORS[member.circleRole] ?? ""}`}
                      >
                        {ROLE_LABELS[member.circleRole] ?? member.circleRole}
                      </Badge>
                      {member.isLocked && (
                        <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          Locked
                        </Badge>
                      )}
                      {!member.isActive && (
                        <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                          Removed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                    {member.phone && (
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {member.isActive && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Select
                        value={member.circleRole}
                        onValueChange={(v) => v && handleRoleChange(member.userId, v)}
                      >
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="PRIMARY_CAREGIVER">Primary CG</SelectItem>
                          <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                          <SelectItem value="MEAL_PROVIDER">Meal Provider</SelectItem>
                          <SelectItem value="PATIENT">Patient</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleLock(member.userId, member.isLocked)}
                        aria-label={member.isLocked ? "Unlock account" : "Lock account"}
                      >
                        {member.isLocked ? (
                          <Unlock className="h-4 w-4 text-green-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemove(member.userId, member.name)}
                        aria-label="Remove member"
                      >
                        <UserX className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {members.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No members found</p>
          </CardContent>
        </Card>
      )}

      {/* Add member sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Member
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleAddMember} className="space-y-3 mt-4">
            <div>
              <Label htmlFor="add-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="add-email"
                type="email"
                placeholder="member@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                autoFocus
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="add-name"
                placeholder="Jane Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-role">Role</Label>
              <Select value={newRole} onValueChange={(v) => v && setNewRole(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="PRIMARY_CAREGIVER">Primary Caregiver</SelectItem>
                  <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                  <SelectItem value="MEAL_PROVIDER">Meal Provider</SelectItem>
                  <SelectItem value="PATIENT">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Member"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
