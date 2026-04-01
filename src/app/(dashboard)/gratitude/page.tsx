"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GratitudeCard } from "@/components/gratitude/GratitudeCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Heart, Plus, Loader2, HeartHandshake } from "lucide-react";

interface GratitudeMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
}

export default function GratitudePage() {
  const [messages, setMessages] = useState<GratitudeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [careCircleId, setCareCircleId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]?.careCircleId) setCareCircleId(data[0].careCircleId);
      })
      .catch(() => {});
  }, []);

  const loadMessages = useCallback(async () => {
    if (!careCircleId) return;
    try {
      const res = await fetch(`/api/gratitude?careCircleId=${careCircleId}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [careCircleId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !careCircleId) return;
    setSending(true);
    try {
      const res = await fetch("/api/gratitude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careCircleId, content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        setSheetOpen(false);
        await loadMessages();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gratitude Wall</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Share appreciation with your care team
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4" />
              Thank
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-coral" />
                Send a Thank You
              </SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSend} className="space-y-3 mt-4">
              <Textarea
                placeholder="Write your message of gratitude..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="text-sm"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/1000
              </p>
              <Button type="submit" className="w-full" disabled={!content.trim() || sending}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HeartHandshake className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No messages yet. Be the first to share your gratitude!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <GratitudeCard key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}
