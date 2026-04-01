"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RequestCard } from "@/components/requests/RequestCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HandHeart, Plus, Loader2, Inbox } from "lucide-react";

interface PatientRequest {
  id: string;
  type: string;
  description: string;
  priority: string;
  status: string;
  notes: string | null;
  createdAt: string;
  fulfilledAt: string | null;
  patient: { id: string; name: string | null; image: string | null };
  assignedTo: { id: string; name: string | null; image: string | null } | null;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [type, setType] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) {
          setCareCircleId(data[0].careCircleId);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadRequests = useCallback(async () => {
    if (!careCircleId) return;
    const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
    try {
      const res = await fetch(`/api/requests?careCircleId=${careCircleId}${statusParam}`);
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [careCircleId, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleClaim(requestId: string) {
    await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    await loadRequests();
  }

  async function handleFulfill(requestId: string) {
    await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "FULFILLED" }),
    });
    await loadRequests();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !careCircleId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careCircleId,
          type,
          description: description.trim(),
          priority,
        }),
      });
      if (res.ok) {
        setDescription("");
        setType("OTHER");
        setPriority("NORMAL");
        setSheetOpen(false);
        await loadRequests();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Requests</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Ask for help from your care team
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" />
              Ask
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-coral" />
                New Request
              </SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEAL">Meal</SelectItem>
                    <SelectItem value="SCHEDULE">Schedule</SelectItem>
                    <SelectItem value="TRANSPORT">Transport</SelectItem>
                    <SelectItem value="SUPPLY">Supply</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="What do you need help with?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "OPEN", "IN_PROGRESS", "FULFILLED"].map((s) => (
          <Badge
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            className="cursor-pointer flex-shrink-0"
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onClaim={() => handleClaim(req.id)}
              onFulfill={() => handleFulfill(req.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
